<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Seat;
use App\Models\Votation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Admin-only aggregated data for the /metrics dashboard
class MetricsController extends Controller
{
    private const MAX_PAGE_SIZE = 500;

    private const DEFAULT_PAGE_SIZE = 100;

    private function assertAdmin(): ?JsonResponse
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        return null;
    }

    // Instante UTC inequívoco para el cliente (evita que ISO sin zona se interprete como hora local del navegador)
    private function timeseriesInstantToUtcIso8601(Carbon $dt): string
    {
        return $dt->copy()->utc()->format('Y-m-d\TH:i:s\Z');
    }

    private function paginationParams(Request $request): array
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = (int) $request->query('pageSize', self::DEFAULT_PAGE_SIZE);
        $pageSize = min(self::MAX_PAGE_SIZE, max(1, $pageSize));

        return [$page, $pageSize];
    }

    /**
     * Summary bundle: votation + metrics aggregates only (no vote/block/audit rows).
     * Use ?full=1 for legacy full payload (export / compatibility).
     */
    public function votationBundle(Request $request, int $votationId): JsonResponse
    {
        if ($deny = $this->assertAdmin()) {
            return $deny;
        }

        $votation = Votation::find($votationId);
        if (! $votation) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        if ($request->query('full') === '1') {
            return $this->votationBundleFull($votationId, $votation);
        }

        $metrics = $this->buildMetricsAggregates($votationId, $votation);

        return response()->json([
            'votation' => $votation,
            'metrics' => $metrics,
            'blockFilterOptions' => $this->blockFilterOptionsForVotation($votationId, $votation),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Serie temporal. Query: buckets (1-200) O intervalSeconds (ancho fijo, ej. 5), cumulative (1/0).
    // Admin-only. intervalSeconds divide la ventana en tramos iguales de N segundos (tipo “vela” fina).
    public function votationTimeseries(Request $request, int $votationId): JsonResponse
    {
        if ($deny = $this->assertAdmin()) {
            return $deny;
        }

        $votation = Votation::find($votationId);
        if (! $votation) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        $start = $votation->startDate
            ? Carbon::parse($votation->startDate)
            : Carbon::now()->subHour();
        $end = $votation->endDate
            ? Carbon::parse($votation->endDate)
            : Carbon::now();

        if ($end->lessThanOrEqualTo($start)) {
            $end = $start->copy()->addMinute();
        }

        [
            $bucketsCount,
            $start,
            $end,
            $totalSeconds,
            $bucketSeconds,
            $maxBucketIndex,
        ] = $this->resolveMetricsTimeseriesBuckets($request, $start, $end);

        $cumulative = $this->parseTimeseriesCumulativeFlag($request);

        $payload = $this->buildVotationTimeseriesPayload(
            $votationId,
            $bucketsCount,
            $start,
            $end,
            $totalSeconds,
            $bucketSeconds,
            $maxBucketIndex,
            $cumulative,
        );

        return response()->json($payload, 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Serie temporal pública solo para votaciones finalizadas (página resultados)
    public function votationTimeseriesPublic(Request $request, int $votationId): JsonResponse
    {
        $votation = Votation::find($votationId);
        if (! $votation || $votation->state !== 'finished') {
            return response()->json(['error' => 'Votación no disponible'], 404);
        }

        $start = $votation->startDate
            ? Carbon::parse($votation->startDate)
            : Carbon::now()->subHour();
        $end = $votation->endDate
            ? Carbon::parse($votation->endDate)
            : Carbon::now();

        if ($end->lessThanOrEqualTo($start)) {
            $end = $start->copy()->addMinute();
        }

        $totalSeconds = max(1, $end->getTimestamp() - $start->getTimestamp());
        $bucketsParam = $request->query('buckets');
        $bucketsOverride = ($bucketsParam !== null && $bucketsParam !== '') ? (int) $bucketsParam : null;
        [$bucketsCount, $bucketSeconds, $maxBucketIndex] = $this->resolveAdaptiveBucketLayout($totalSeconds, $bucketsOverride);

        $cumulative = $this->parseTimeseriesCumulativeFlag($request);

        $payload = $this->buildVotationTimeseriesPayload(
            $votationId,
            $bucketsCount,
            $start,
            $end,
            $totalSeconds,
            $bucketSeconds,
            $maxBucketIndex,
            $cumulative,
        );

        return response()->json($payload, 200, [], JSON_UNESCAPED_UNICODE);
    }

    private function parseTimeseriesCumulativeFlag(Request $request): bool
    {
        $raw = $request->query('cumulative', '1');

        return ! in_array(strtolower((string) $raw), ['0', 'false', 'no', 'off'], true);
    }

    /**
     * Reparte la duración en ~12 tramos (p. ej. 12 h → ~1 h/tramo; 20 min → ~100 s/tramo).
     * Si $bucketsOverride no es null, usa ese número de buckets.
     *
     * @return array{0: int, 1: int, 2: int}
     */
    private function resolveAdaptiveBucketLayout(int $totalSeconds, ?int $bucketsOverride): array
    {
        $totalSeconds = max(1, $totalSeconds);

        if ($bucketsOverride !== null) {
            $bucketsCount = min(200, max(1, $bucketsOverride));
            $bucketSeconds = max(1, (int) ceil($totalSeconds / $bucketsCount));
            $maxBucketIndex = $bucketsCount - 1;

            return [$bucketsCount, $bucketSeconds, $maxBucketIndex];
        }

        $targetIntervals = 12;
        $bucketSeconds = max(1, (int) ceil($totalSeconds / $targetIntervals));
        $bucketsCount = max(1, (int) ceil($totalSeconds / $bucketSeconds));
        $maxBucketIndex = $bucketsCount - 1;

        return [$bucketsCount, $bucketSeconds, $maxBucketIndex];
    }

    /**
     * Ventana temporal para gráfico admin: o N buckets que reparten toda la duración, o ancho fijo intervalSeconds.
     *
     * @return array{0: int, 1: Carbon, 2: Carbon, 3: int, 4: int, 5: int}
     */
    private function resolveMetricsTimeseriesBuckets(Request $request, Carbon $start, Carbon $end): array
    {
        $intervalRaw = $request->query('intervalSeconds');
        $hasInterval = $intervalRaw !== null && $intervalRaw !== '';

        if ($hasInterval) {
            $intervalSec = min(60, max(1, (int) $intervalRaw));
            $originalStart = $start->copy();

            $totalSeconds = max(1, $end->getTimestamp() - $start->getTimestamp());
            $bucketSeconds = $intervalSec;
            $maxBuckets = 2400;

            $bucketsCount = (int) ceil($totalSeconds / $bucketSeconds);

            if ($bucketsCount > $maxBuckets) {
                $start = $end->copy()->subSeconds($maxBuckets * $bucketSeconds);
                if ($start->lt($originalStart)) {
                    $start = $originalStart->copy();
                }
                $totalSeconds = max(1, $end->getTimestamp() - $start->getTimestamp());
                $bucketsCount = min($maxBuckets, (int) ceil($totalSeconds / $bucketSeconds));
            }

            $bucketsCount = max(1, $bucketsCount);
            $maxBucketIndex = $bucketsCount - 1;

            return [$bucketsCount, $start, $end, $totalSeconds, $bucketSeconds, $maxBucketIndex];
        }

        $totalSeconds = max(1, $end->getTimestamp() - $start->getTimestamp());
        $bucketsParam = $request->query('buckets');
        $bucketsOverride = ($bucketsParam !== null && $bucketsParam !== '') ? (int) $bucketsParam : null;
        [$bucketsCount, $bucketSeconds, $maxBucketIndex] = $this->resolveAdaptiveBucketLayout($totalSeconds, $bucketsOverride);

        return [$bucketsCount, $start, $end, $totalSeconds, $bucketSeconds, $maxBucketIndex];
    }

    /**
     * Agrupa votos en intervalos temporales (por partido). cumulative=true: serie acumulada; false: votos por bucket.
     *
     * La agregación se hace en PHP (no TIMESTAMPDIFF + GROUP BY en SQL) para evitar:
     * errores con ONLY_FULL_GROUP_BY, diferencias entre MariaDB/MySQL y otros drivers.
     *
     * @return array<string, mixed>
     */
    private function buildVotationTimeseriesPayload(
        int $votationId,
        int $bucketsCount,
        Carbon $start,
        Carbon $end,
        int $totalSeconds,
        int $bucketSeconds,
        int $maxBucketIndex,
        bool $cumulative = true,
    ): array {
        $startTs = $start->getTimestamp();

        $partyIds = DB::table('vote')
            ->where('votationId', $votationId)
            ->distinct()
            ->pluck('partyId')
            ->filter()
            ->values()
            ->all();

        if ($partyIds === []) {
            $partyIds = Party::query()->pluck('id')->all();
        }

        $raw = [];
        foreach ($partyIds as $pid) {
            $raw[(int) $pid] = array_fill(0, $bucketsCount, 0);
        }

        // Hora del voto: preferir chain_timestamp del bloque (instante en cadena). createdAt en `vote` es
        // la inserción en BD (p. ej. microservicio) y puede agrupar votos reales al mismo minuto.
        $voteQuery = DB::table('vote as v')
            ->leftJoin('block as b', 'b.hash', '=', 'v.blockHash')
            ->where('v.votationId', $votationId)
            ->select([
                'v.partyId as partyId',
                'v.createdAt as vote_created_at',
                'b.chain_timestamp as chain_timestamp',
            ])
            ->orderBy('v.id');

        $endTs = $end->getTimestamp();

        foreach ($voteQuery->cursor() as $row) {
            $partyKey = $row->partyId ?? $row->partyid ?? null;
            $pid = (int) $partyKey;
            if ($pid <= 0) {
                continue;
            }
            $voteUnix = null;
            $ct = $row->chain_timestamp ?? $row->chainTimestamp ?? null;
            if ($ct !== null && (int) $ct > 0) {
                $voteUnix = (int) $ct;
            } else {
                $rawAt = $row->vote_created_at ?? $row->voteCreatedAt ?? null;
                if ($rawAt === null) {
                    continue;
                }
                try {
                    // Sin zona en la cadena: interpretar como hora de la app (misma convención que startDate/endDate).
                    $voteUnix = Carbon::parse($rawAt, config('app.timezone'))->getTimestamp();
                } catch (\Throwable) {
                    continue;
                }
            }
            if ($voteUnix < $startTs || $voteUnix > $endTs) {
                continue;
            }
            $secondsFromStart = $voteUnix - $startTs;
            $secondsFromStart = max(0, min($totalSeconds, $secondsFromStart));
            $idx = (int) min($maxBucketIndex, floor($secondsFromStart / $bucketSeconds));
            if ($idx < 0 || $idx >= $bucketsCount) {
                continue;
            }
            if (! isset($raw[$pid])) {
                $raw[$pid] = array_fill(0, $bucketsCount, 0);
            }
            $raw[$pid][$idx] += 1;
        }

        $byParty = [];
        foreach ($raw as $pid => $counts) {
            if ($cumulative) {
                $cum = [];
                $running = 0;
                for ($i = 0; $i < $bucketsCount; $i++) {
                    $running += $counts[$i];
                    $cum[] = $running;
                }
                $byParty[(string) $pid] = $cum;
            } else {
                $series = [];
                for ($i = 0; $i < $bucketsCount; $i++) {
                    $series[] = (int) $counts[$i];
                }
                $byParty[(string) $pid] = $series;
            }
        }

        $labels = [];
        for ($i = 0; $i < $bucketsCount; $i++) {
            $secondsAtEnd = min($totalSeconds, ($i + 1) * $bucketSeconds);
            $t = $start->copy()->addSeconds($secondsAtEnd);
            if ($t->greaterThan($end)) {
                $t = $end->copy();
            }
            $labels[] = $this->timeseriesInstantToUtcIso8601($t);
        }

        if ($bucketsCount > 0) {
            $labels[$bucketsCount - 1] = $this->timeseriesInstantToUtcIso8601($end);
        }

        if ($cumulative) {
            foreach ($byParty as $pidKey => $series) {
                $byParty[$pidKey] = array_merge([0], $series);
            }
            array_unshift($labels, $this->timeseriesInstantToUtcIso8601($start));
        }

        return [
            'bucketSeconds' => $bucketSeconds,
            'buckets' => $bucketsCount,
            'startDate' => $this->timeseriesInstantToUtcIso8601($start),
            'endDate' => $this->timeseriesInstantToUtcIso8601($end),
            'labels' => $labels,
            'byParty' => $byParty,
            'cumulative' => $cumulative,
        ];
    }

    /**
     * Lista ligera de bloques vinculados a la votación (selector de filtro).
     *
     * @return array<int, array{hash: string, blockNumber: int}>
     */
    private function blockFilterOptionsForVotation(int $votationId, Votation $votation): array
    {
        $rows = DB::table('vote as v')
            ->join('block as b', 'b.hash', '=', 'v.blockHash')
            ->where('v.votationId', $votationId)
            ->select('b.hash', 'b.blockNumber')
            ->distinct()
            ->orderByDesc('b.blockNumber')
            ->get();

        $seen = [];
        $out = [];
        foreach ($rows as $r) {
            if (isset($seen[$r->hash])) {
                continue;
            }
            $seen[$r->hash] = true;
            $out[] = ['hash' => $r->hash, 'blockNumber' => (int) $r->blockNumber];
        }

        foreach (array_filter([$votation->startBlockHash, $votation->endBlockHash]) as $h) {
            if ($h === null || $h === '' || isset($seen[$h])) {
                continue;
            }
            $b = DB::table('block')->where('hash', $h)->first();
            if ($b) {
                $seen[$h] = true;
                $out[] = ['hash' => $b->hash, 'blockNumber' => (int) $b->blockNumber];
            }
        }

        usort($out, fn ($a, $b) => $b['blockNumber'] <=> $a['blockNumber']);

        return $out;
    }

    // Prefijo numérico para búsqueda tipo "123%" (solo dígitos)
    private function normalizeDigitPrefix(?string $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === '') {
            return null;
        }

        return substr($digits, 0, 19);
    }

    /**
     * Filtro "empieza por" sobre un entero almacenado como número (CAST a texto).
     *
     * @param  \Illuminate\Database\Query\Builder  $query
     */
    private function applyNumericColumnStartsWithPrefix($query, string $column, string $digitPrefix): void
    {
        if (! in_array($column, ['id', 'blockNumber'], true)) {
            throw new \InvalidArgumentException('Invalid column for prefix filter');
        }
        $like = $digitPrefix.'%';
        $driver = DB::connection()->getDriverName();
        $cast = match ($driver) {
            'sqlite', 'pgsql' => "CAST({$column} AS TEXT)",
            default => "CAST({$column} AS CHAR)",
        };
        $query->whereRaw("{$cast} LIKE ?", [$like]);
    }

    public function votationVotes(Request $request, int $votationId): JsonResponse
    {
        if ($deny = $this->assertAdmin()) {
            return $deny;
        }

        $votation = Votation::find($votationId);
        if (! $votation) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        [$page, $pageSize] = $this->paginationParams($request);
        $blockHash = $request->query('blockHash');
        $blockHash = is_string($blockHash) && $blockHash !== '' ? $blockHash : null;

        $idPrefix = $this->normalizeDigitPrefix(
            is_string($request->query('idPrefix')) ? $request->query('idPrefix') : null,
        );

        $base = DB::table('vote')->where('votationId', $votationId);
        if ($blockHash !== null) {
            $base->where('blockHash', $blockHash);
        }
        if ($idPrefix !== null) {
            $this->applyNumericColumnStartsWithPrefix($base, 'id', $idPrefix);
        }

        $total = (clone $base)->count();

        $votesQuery = clone $base;
        if ($idPrefix !== null) {
            $votesQuery->orderBy('id', 'asc');
        } else {
            $votesQuery->orderByDesc('id');
        }

        $votes = $votesQuery
            ->offset(($page - 1) * $pageSize)
            ->limit($pageSize)
            ->get();

        $partyNames = Party::query()->pluck('name', 'id')->all();
        $municipalityIds = $votes->pluck('municipalityId')->unique()->filter()->values()->all();
        $geoByMunicipalityId = $this->loadGeoByMunicipalityIds($municipalityIds);

        $data = $votes->map(function ($v) use ($partyNames, $geoByMunicipalityId) {
            $geo = $geoByMunicipalityId->get($v->municipalityId);

            return [
                'id' => $v->id,
                'voteHash' => $v->voteHash,
                'partyId' => $v->partyId,
                'partyName' => $partyNames[$v->partyId] ?? ('#'.$v->partyId),
                'municipalityId' => $v->municipalityId,
                'municipalityName' => $geo->municipalityName ?? null,
                'provinceName' => $geo->provinceName ?? null,
                'autonomousCommunityName' => $geo->autonomousCommunityName ?? null,
                'blockHash' => $v->blockHash,
                'txHash' => $v->txHash,
                'createdAt' => (string) $v->createdAt,
            ];
        })->values()->all();

        return response()->json([
            'data' => $data,
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function votationBlocks(Request $request, int $votationId): JsonResponse
    {
        if ($deny = $this->assertAdmin()) {
            return $deny;
        }

        $votation = Votation::find($votationId);
        if (! $votation) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        [$page, $pageSize] = $this->paginationParams($request);

        $blockHashes = DB::table('vote')
            ->where('votationId', $votationId)
            ->whereNotNull('blockHash')
            ->distinct()
            ->pluck('blockHash')
            ->all();

        if ($votation->startBlockHash) {
            $blockHashes[] = $votation->startBlockHash;
        }
        if ($votation->endBlockHash) {
            $blockHashes[] = $votation->endBlockHash;
        }

        // Origen de cadena (p. ej. Hardhat: #0 génesis, #1 primer bloque): no suelen aparecer en votos
        // pero sirven de contexto y permiten que la búsqueda por prefijo "0"/"1" encuentre la raíz.
        $chainAnchorHashes = DB::table('block')
            ->whereIn('blockNumber', [0, 1])
            ->pluck('hash')
            ->all();
        $blockHashes = array_merge($blockHashes, $chainAnchorHashes);

        $blockHashes = array_values(array_unique(array_filter($blockHashes)));

        if ($blockHashes === []) {
            return response()->json([
                'data' => [],
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => 0,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }

        $blockNumberPrefix = $this->normalizeDigitPrefix(
            is_string($request->query('blockNumberPrefix')) ? $request->query('blockNumberPrefix') : null,
        );

        $blocksBase = DB::table('block')->whereIn('hash', $blockHashes);
        if ($blockNumberPrefix !== null) {
            $this->applyNumericColumnStartsWithPrefix($blocksBase, 'blockNumber', $blockNumberPrefix);
        }

        $total = (clone $blocksBase)->count();

        $blocksQuery = clone $blocksBase;
        if ($blockNumberPrefix !== null) {
            $blocksQuery->orderBy('blockNumber', 'asc');
        } else {
            $blocksQuery->orderByDesc('blockNumber');
        }

        $blocks = $blocksQuery
            ->offset(($page - 1) * $pageSize)
            ->limit($pageSize)
            ->get()
            ->map(fn ($b) => [
                'hash' => $b->hash,
                'blockNumber' => $b->blockNumber,
                'previousHash' => $b->previousHash,
                'transactions' => $b->transactions,
                'isValid' => (bool) $b->isValid,
                'createdAt' => $b->createdAt ? (string) $b->createdAt : null,
            ])
            ->values()
            ->all();

        return response()->json([
            'data' => $blocks,
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function votationAudit(Request $request, int $votationId): JsonResponse
    {
        if ($deny = $this->assertAdmin()) {
            return $deny;
        }

        if (! Votation::find($votationId)) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        if (! Schema::hasTable('auditory')) {
            return response()->json([
                'data' => [],
                'page' => 1,
                'pageSize' => self::DEFAULT_PAGE_SIZE,
                'total' => 0,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }

        [$page, $pageSize] = $this->paginationParams($request);
        $role = $request->query('role');
        $role = $role !== null && $role !== '' ? (int) $role : null;

        $base = DB::table('auditory as a')
            ->leftJoin('user as u', 'u.id', '=', 'a.userId');

        if ($role !== null) {
            $base->where('u.roleId', $role);
        }

        $total = (clone $base)->count();

        $rows = $base
            ->orderByDesc('a.id')
            ->offset(($page - 1) * $pageSize)
            ->limit($pageSize)
            ->select([
                'a.id',
                'a.userId',
                'a.action',
                'a.description',
                'a.txHash',
                'a.blockHash',
                'a.createdAt',
                'u.nicknamePassword',
                'u.name as userName',
                'u.roleId as userRole',
            ])
            ->get()
            ->map(function ($a) {
                $name = $a->userName ?? null;
                $nickname = $a->nicknamePassword ?? null;
                $displayName = $name !== null && $name !== ''
                    ? $name
                    : ($nickname !== null && $nickname !== '' ? $nickname : null);

                return [
                    'id' => $a->id,
                    'userId' => $a->userId,
                    'userName' => $displayName,
                    'userRole' => $a->userRole,
                    'action' => $a->action,
                    'description' => $a->description,
                    'txHash' => $a->txHash,
                    'blockHash' => $a->blockHash,
                    'createdAt' => (string) $a->createdAt,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'data' => $rows,
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * @return \Illuminate\Support\Collection<int, object>
     */
    private function loadGeoByMunicipalityIds(array $municipalityIds)
    {
        if ($municipalityIds === []) {
            return collect();
        }

        return DB::table('municipality as m')
            ->leftJoin('province as p', 'p.id', '=', 'm.provinceId')
            ->leftJoin('autonomousCommunity as ac', 'ac.id', '=', 'p.autonomousCommunityId')
            ->whereIn('m.id', $municipalityIds)
            ->select([
                'm.id as municipalityId',
                'm.name as municipalityName',
                'p.name as provinceName',
                'ac.name as autonomousCommunityName',
            ])
            ->get()
            ->keyBy('municipalityId');
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMetricsAggregates(int $votationId, Votation $votation): array
    {
        $totalVotes = (int) DB::table('vote')->where('votationId', $votationId)->count();

        $votesByParty = DB::table('vote')
            ->where('votationId', $votationId)
            ->select('partyId', DB::raw('COUNT(*) as c'))
            ->groupBy('partyId')
            ->pluck('c', 'partyId')
            ->map(fn ($c) => (int) $c)
            ->all();

        $votesByMunicipality = DB::table('vote')
            ->where('votationId', $votationId)
            ->select('municipalityId', DB::raw('COUNT(*) as c'))
            ->groupBy('municipalityId')
            ->pluck('c', 'municipalityId')
            ->map(fn ($c) => (int) $c)
            ->all();

        $votesByProvinceName = DB::table('vote as v')
            ->join('municipality as m', 'm.id', '=', 'v.municipalityId')
            ->join('province as p', 'p.id', '=', 'm.provinceId')
            ->where('v.votationId', $votationId)
            ->select('p.name as provinceName', DB::raw('COUNT(*) as c'))
            ->groupBy('p.name')
            ->pluck('c', 'provinceName')
            ->map(fn ($c) => (int) $c)
            ->all();

        $seatsByParty = [];
        if (Schema::hasTable('seat')) {
            $seatsByParty = Seat::query()
                ->where('votationId', $votationId)
                ->get()
                ->groupBy('partyId')
                ->map(fn ($group) => (int) $group->sum('seatsAssigned'))
                ->all();
        }

        $registeredCitizens = (int) DB::table('user')->where('roleId', 2)->count();

        return [
            'votationId' => $votationId,
            'totalVotes' => $totalVotes,
            'votesByParty' => $votesByParty,
            'votesByMunicipality' => $votesByMunicipality,
            'votesByProvinceName' => $votesByProvinceName,
            'seatsByParty' => $seatsByParty,
            'registeredCitizens' => $registeredCitizens,
            'participationRate' => $registeredCitizens > 0
                ? round(($totalVotes / $registeredCitizens) * 100, 2)
                : 0.0,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function votationBundleFull(int $votationId, Votation $votation): JsonResponse
    {
        $votes = DB::table('vote')
            ->where('votationId', $votationId)
            ->orderByDesc('id')
            ->get();

        $partyNames = Party::query()->pluck('name', 'id')->all();

        $municipalityIds = $votes->pluck('municipalityId')->unique()->filter()->values()->all();
        $geoByMunicipalityId = $this->loadGeoByMunicipalityIds($municipalityIds);

        $voteRows = $votes->map(function ($v) use ($partyNames, $geoByMunicipalityId) {
            $geo = $geoByMunicipalityId->get($v->municipalityId);

            return [
                'id' => $v->id,
                'voteHash' => $v->voteHash,
                'partyId' => $v->partyId,
                'partyName' => $partyNames[$v->partyId] ?? ('#'.$v->partyId),
                'municipalityId' => $v->municipalityId,
                'municipalityName' => $geo->municipalityName ?? null,
                'provinceName' => $geo->provinceName ?? null,
                'autonomousCommunityName' => $geo->autonomousCommunityName ?? null,
                'blockHash' => $v->blockHash,
                'txHash' => $v->txHash,
                'createdAt' => (string) $v->createdAt,
            ];
        })->values()->all();

        $blockHashes = $votes->pluck('blockHash')->unique()->filter()->values()->all();
        if ($votation->startBlockHash) {
            $blockHashes[] = $votation->startBlockHash;
        }
        if ($votation->endBlockHash) {
            $blockHashes[] = $votation->endBlockHash;
        }
        $blockHashes = array_unique($blockHashes);

        $blocks = [];
        if ($blockHashes !== []) {
            $blocks = DB::table('block')
                ->whereIn('hash', $blockHashes)
                ->orderByDesc('blockNumber')
                ->get()
                ->map(fn ($b) => [
                    'hash' => $b->hash,
                    'blockNumber' => $b->blockNumber,
                    'previousHash' => $b->previousHash,
                    'transactions' => $b->transactions,
                    'isValid' => (bool) $b->isValid,
                    'createdAt' => $b->createdAt ? (string) $b->createdAt : null,
                ])
                ->values()
                ->all();
        }

        $metrics = $this->buildMetricsAggregates($votationId, $votation);
        $blockFilterOptions = $this->blockFilterOptionsForVotation($votationId, $votation);

        $auditRows = [];
        if (Schema::hasTable('auditory')) {
            $auditRows = DB::table('auditory as a')
                ->leftJoin('user as u', 'u.id', '=', 'a.userId')
                ->orderByDesc('a.id')
                ->limit(10000)
                ->select([
                    'a.id',
                    'a.userId',
                    'a.action',
                    'a.description',
                    'a.txHash',
                    'a.blockHash',
                    'a.createdAt',
                    'u.nicknamePassword',
                    'u.name as userName',
                    'u.roleId as userRole',
                ])
                ->get()
                ->map(function ($a) {
                    $name = $a->userName ?? null;
                    $nickname = $a->nicknamePassword ?? null;
                    $displayName = $name !== null && $name !== ''
                        ? $name
                        : ($nickname !== null && $nickname !== '' ? $nickname : null);

                    return [
                        'id' => $a->id,
                        'userId' => $a->userId,
                        'userName' => $displayName,
                        'userRole' => $a->userRole,
                        'action' => $a->action,
                        'description' => $a->description,
                        'txHash' => $a->txHash,
                        'blockHash' => $a->blockHash,
                        'createdAt' => (string) $a->createdAt,
                    ];
                })
                ->values()
                ->all();
        }

        return response()->json([
            'votation' => $votation,
            'metrics' => $metrics,
            'blockFilterOptions' => $blockFilterOptions,
            'votes' => $voteRows,
            'blocks' => $blocks,
            'audit' => $auditRows,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}
