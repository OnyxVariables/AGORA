<?php

namespace App\Console\Commands;

use App\Models\Votation;
use App\Services\BlockchainService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ProcessVotationLifecycle extends Command
{
    protected $signature = 'votations:process-lifecycle';

    protected $description = 'Envía a blockchain las votaciones pending al llegar startDate y finishVotation cuando endDate ha pasado';

    public function handle(BlockchainService $blockchain): int
    {
        Log::info('votations:process-lifecycle: tick');

        $connection = $blockchain->checkConnection();
        if (!$connection['success']) {
            Log::warning('votations:process-lifecycle: blockchain no disponible', [
                'error' => $connection['error'] ?? null,
            ]);

            return self::FAILURE;
        }

        $this->activatePendingOnChain($blockchain);
        $this->finishActiveOnChain($blockchain);

        return self::SUCCESS;
    }

    /**
     * Tras createVotation el contrato deja la votación en Active; la BD debe reflejarlo
     * en el mismo paso que el receipt (no depende solo del listener de Spring Boot, Spring Boot lo sobreescribe a modo de validación extra).
     */
    private function activatePendingOnChain(BlockchainService $blockchain): void
    {
        $now = now();
        $pending = Votation::query()
            ->where('state', 'pending')
            ->where(function ($q) {
                $q->whereNull('txHash')->orWhere('txHash', '');
            })
            ->where('startDate', '<=', $now)
            ->orderBy('id')
            ->get();

        Log::info('votations:process-lifecycle: candidatas a activar (pending, sin tx, startDate<=ahora)', [
            'count' => $pending->count(),
            'now' => $now->toIso8601String(),
        ]);

        foreach ($pending as $votation) {
            if ($votation->endDate === null) {
                Log::error('Votación sin endDate; omitiendo activación en cadena', [
                    'id' => $votation->id,
                ]);
                continue;
            }

            $startTs = Carbon::parse($votation->startDate)->getTimestamp();
            $endTs = Carbon::parse($votation->endDate)->getTimestamp();
            if ($endTs <= $startTs) {
                Log::error('Votación con fechas inválidas; omitiendo activación en cadena', [
                    'id' => $votation->id,
                ]);
                continue;
            }

            $result = $blockchain->createVotation(
                $votation->id,
                $votation->title,
                (string) ($votation->description ?? ''),
                $startTs,
                $endTs
            );

            if (empty($result['success'])) {
                Log::error('createVotation falló en scheduler', [
                    'id' => $votation->id,
                    'error' => $result['error'] ?? null,
                ]);
                continue;
            }

            $blockchain->ensureBlockExists(
                $result['blockHash'] ?? null,
                $result['blockNumber'] ?? null,
                $result['parentHash'] ?? null
            );

            $votation->update([
                'txHash' => $result['transactionHash'],
                'startBlockHash' => $result['blockHash'],
                'state' => 'active',
            ]);

            Log::info('Votación activada en cadena (scheduler); BD state=active', ['id' => $votation->id]);
        }
    }

    /**
     * Incluye pending+txHash por si filas antiguas quedaron sin pasar a active (listener caído).
     * Tras finishVotation el contrato marca Finished; la BD debe reflejarlo con el receipt.
     */
    private function finishActiveOnChain(BlockchainService $blockchain): void
    {
        $now = now();
        $active = Votation::query()
            ->where(function ($q) {
                $q->where('state', 'active')
                    ->orWhere(function ($q2) {
                        $q2->where('state', 'pending')
                            ->whereNotNull('txHash')
                            ->where('txHash', '!=', '');
                    });
            })
            ->whereNotNull('endDate')
            ->where('endDate', '<=', $now)
            ->orderBy('id')
            ->get();

        foreach ($active as $votation) {
            $result = $blockchain->finishVotation($votation->id);

            if (empty($result['success'])) {
                Log::error('finishVotation falló en scheduler', [
                    'id' => $votation->id,
                    'error' => $result['error'] ?? null,
                ]);
                continue;
            }

            $blockchain->ensureBlockExists(
                $result['blockHash'] ?? null,
                $result['blockNumber'] ?? null,
                $result['parentHash'] ?? null
            );

            $votation->update([
                'endBlockHash' => $result['blockHash'],
                'state' => 'finished',
            ]);

            Log::info('Votación finalizada en cadena (scheduler); BD state=finished', ['id' => $votation->id]);
        }
    }
}