<?php

namespace App\Http\Controllers;

use App\Models\Auditory;
use App\Models\Party;
use App\Models\User;
use App\Models\Vote;
use App\Models\Votation;
use App\Models\VoteIntent;
use App\Services\BlockchainService;
use kornrunner\Keccak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        if (!config('agora.insecure_mode') && !$user->isActive) {
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

        $party = Party::query()
            ->whereKey($data['partyId'])
            ->where('active', true)
            ->first();

        if (!$party) {
            return response()->json([
                'error' => 'Partido no válido'
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $hasConfiguredParties = DB::table('votation_party')
            ->where('votationId', $votation->id)
            ->exists();

        if ($hasConfiguredParties && !$party->votations()->where('votation.id', $votation->id)->exists()) {
            return response()->json([
                'error' => 'El partido no está habilitado para esta votación'
            ], 400, [], JSON_UNESCAPED_UNICODE);
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

            try {
                $this->blockchainService->ensureBlockExists(
                    $tx['blockHash'] ?? null,
                    $tx['blockNumber'] ?? null,
                    $tx['parentHash'] ?? null
                );
            } catch (\Throwable $blockSyncError) {
                Log::warning('Vote on chain but block sync failed', [
                    'tx_hash' => $tx['transactionHash'] ?? null,
                    'message' => $blockSyncError->getMessage(),
                ]);
            }

            // Esto Laravel lo escucha, en principio sabe el usuario y el voto asociado durante
            // unos instantes, pero luego se elimina.
            //Auditory::log(
            //    (int) $user->id,
            //    'SUBMIT_VOTE',
            //    "Voto enviado (votación {$data['votationId']}, partido {$data['partyId']})",
            //    $tx['transactionHash'] ?? null,
            //    $tx['blockHash'] ?? null
            //);

            // isActive se pone a false en Spring Boot al confirmar VoteSubmitted (correlación por vote_intent)

            return response()->json([
                'message' => 'Voto enviado',
                'txHash' => $tx['transactionHash']
            ]);

        } catch (\Throwable $e) {
            Log::error('Vote send failed', [
                'user_id' => $user->id ?? null,
                'votation_id' => $data['votationId'] ?? null,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $intent->delete();

            return response()->json([
                'error' => 'Error interno al registrar el voto',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500, [], JSON_UNESCAPED_UNICODE);
        }
    }

    /**
     * Obtiene metricas de votos para una votacion.
     * Incluye contadores por partido y municipio.
     *
     * Nota: Los datos reales vienen de Spring Boot via WebSocket.
     * Este endpoint es para carga inicial y fallback.
     */
    public function metrics($votationId)
    {
        try {
            // Obtener votos de la tabla vote (insertados por Spring Boot)
            $votes = \DB::table('vote')
                ->where('votationId', $votationId)
                ->get();

            $totalVotes = $votes->count();

            $votesByParty = $votes
                ->groupBy('partyId')
                ->map(fn($group) => $group->count())
                ->all();

            $votesByMunicipality = $votes
                ->groupBy('municipalityId')
                ->map(fn($group) => $group->count())
                ->all();

            return response()->json([
                'votationId' => (int) $votationId,
                'totalVotes' => $totalVotes,
                'votesByParty' => $votesByParty,
                'votesByMunicipality' => $votesByMunicipality,
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error obteniendo metricas de votos: ' . $e->getMessage());
            return response()->json(['error' => 'Error obteniendo metricas'], 500);
        }
    }

    /**
     * Verifica el voto del ciudadano autenticado a partir del código mostrado al votar.
     * El hash en cadena coincide con keccak256(utf8(nickname + code + votationId)).
     */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'regex:/^[a-fA-F0-9]{64}$/'],
            'votationId' => 'required|integer',
        ]);

        $user = Auth::user();
        if (!$user instanceof User) {
            return response()->json(['error' => 'No autenticado'], 401, [], JSON_UNESCAPED_UNICODE);
        }

        $nickname = $user->nicknamePassword;
        if ($nickname === null || $nickname === '') {
            return response()->json(['error' => 'No tienes nickname registrado'], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $code = strtolower($data['code']);
        $payload = $nickname.$code.(string) $data['votationId'];
        $hashHex = Keccak::hash($payload, 256);
        $voteHash = '0x'.strtolower($hashHex);

        $vote = Vote::query()
            ->where('voteHash', $voteHash)
            ->where('votationId', $data['votationId'])
            ->first();

        if (!$vote) {
            return response()->json(['error' => 'No se encontró el voto con ese código para esta votación'], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $party = Party::query()->find($vote->partyId);

        return response()->json([
            'nickname' => $nickname,
            'partyName' => $party->name ?? 'Desconocido',
            'partyId' => (int) $vote->partyId,
            'votationId' => (int) $data['votationId'],
            'voteHash' => $voteHash,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
