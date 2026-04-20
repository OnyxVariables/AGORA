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
        $ok = ($details['success'] ?? false) === true;

        return response()->json([
            'service' => 'blockchain',
            'status' => $ok ? 'ok' : 'error',
            'details' => $details,
            'timestamp' => now()->toIso8601String(),
        ], $ok ? 200 : 503);
    }
}