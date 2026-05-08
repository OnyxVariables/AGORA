<?php

namespace App\Http\Controllers;

use App\Services\BlockchainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminHealthController extends Controller
{
    public function database(): JsonResponse
    {
        DB::select('SELECT 1 AS ok');

        return response()->json([
            'status' => 'ok',
            'service' => 'database',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function blockchain(BlockchainService $blockchain): JsonResponse
    {
        $details = $blockchain->checkConnection();
        $reachable = ($details['success'] ?? false) === true;
        $clientMatches = $details['clientMatches'] ?? null;

        // Si conecto pero el cliente no es el esperado (ej. Hardhat en lugar
        // de Besu) lo marcamos como `degraded`: sirve para no fallar en dev y
        // a la vez avisar en prod cuando hay un nodo inesperado.
        $status = match (true) {
            !$reachable => 'error',
            $clientMatches === false => 'degraded',
            default => 'ok',
        };

        $httpStatus = $reachable ? 200 : 503;

        return response()->json([
            'service' => 'blockchain',
            'status' => $status,
            'details' => $details,
            'timestamp' => now()->toIso8601String(),
        ], $httpStatus);
    }
}