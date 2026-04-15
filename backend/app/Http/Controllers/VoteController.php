<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Votation;
use App\Models\VoteIntent;
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
        $data['voteHash'] = strtolower($data['voteHash']);

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
            ->votableForCitizens()
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

        if ($votation->endDate !== null && now()->gt($votation->endDate)) {
            return response()->json([
                'error' => 'La votación ha finalizado'
            ], 400);
        }

        $connection = $this->blockchainService->checkConnection();
        if (!$connection['success']) {
            return response()->json([
                'error' => 'Blockchain no disponible',
                'details' => $connection['error']
            ], 503);
        }

        $maxRetries = 3;
        $attempt = 0;
        $tx = null;

        VoteIntent::where('userId', $user->id)->delete();

        $intent = VoteIntent::create([
            'userId' => $user->id,
            'voteHash' => $data['voteHash'],
            'votationId' => $data['votationId'],
        ]);

        try {
            do {
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
                $intent->delete();

                return response()->json([
                    'error' => 'Error en blockchain tras ' . $maxRetries . ' intentos',
                    'details' => $tx['error'] ?? null
                ], 500);
            }

            // isActive se pone a false en Spring Boot al confirmar VoteSubmitted (correlación por vote_intent)

            return response()->json([
                'message' => 'Voto enviado',
                'txHash' => $tx['transactionHash']
            ]);

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            $intent->delete();

            return response()->json(['error' => 'Error interno'], 500, [], JSON_UNESCAPED_UNICODE);
        }
    }
}