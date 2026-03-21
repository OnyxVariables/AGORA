<?php

namespace App\Http\Controllers;

use App\Models\Vote;
use App\Models\User;
use App\Models\Votation;
use App\Models\Municipality;
use App\Services\BlockchainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class VoteController extends Controller
{
    private $blockchainService;
    
    public function __construct(BlockchainService $blockchainService)
    {
        $this->blockchainService = $blockchainService;
    }

    public function send(Request $request)
    {
        $data = $request->validate([
            'partyId' => 'required|integer',
            'votationId' => 'required|integer',
            'municipalityId' => 'required|integer',
            'voteHash' => [
                'required',
                'regex:/^0x[a-fA-F0-9]{64}$/'
            ]
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'error' => 'No autenticado'
            ], 401, [], JSON_UNESCAPED_UNICODE);
        }

        if (!$user->isActive) {
            return response()->json([
                'error' => 'Ya has votado'
            ], 403, [], JSON_UNESCAPED_UNICODE);
        }

        $votation = Votation::where('id', $data['votationId'])
            ->where('state', 'active')
            ->first();

        if (!$votation) {
            return response()->json([
                'error' => 'La votación no está activa'
            ], 400);
        }

        if (now()->lt($votation->startDate)) {
            return response()->json([
                'error' => 'La votación aún no ha comenzado'
            ], 400);
        }

        if (now()->gt($votation->endDate)) {
            return response()->json([
                'error' => 'La votación ha finalizado'
            ], 400);
        }

        $maxRetries = 3;
        $attempt = 0;
        $tx = null;

        try {
            do{
                $tx = $this->blockchainService->submitVote(
                    $data['partyId'],
                    $data['votationId'],
                    $data['municipalityId'],
                    $data['voteHash']
                );

                $attempt++;

                if ($tx['success']) {
                    break;
                }

                sleep(1);
            } while ($attempt < $maxRetries);

            if (!$tx['success']) {
                return response()->json([
                    'error' => 'Error en blockchain tras ' . $maxRetries . ' intentos',
                    'details' => $tx['error'] ?? null
                ], 500);
            }

            // No se pasa usuario a inactive aquí porque si la transacción falla en blockchain, el usuario no va a poder votar de nuevo
            // Se pasa a inactive en Spring Boot cuando se confirma el voto en la blockchain y escucha el evento

            return response()->json([
                'message' => 'Voto enviado',
                'txHash' => $tx['transactionHash']
            ]);

        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return response()->json(['error' => 'Error interno'], 500, [], JSON_UNESCAPED_UNICODE);
        }
    }
}