<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Seat;
use App\Models\Votation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $base = DB::table('vote')->where('votationId', $votationId);
        if ($blockHash !== null) {
            $base->where('blockHash', $blockHash);
        }

        $total = (clone $base)->count();

        $votes = (clone $base)
            ->orderByDesc('id')
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
        $blockHashes = array_values(array_unique(array_filter($blockHashes)));

        if ($blockHashes === []) {
            return response()->json([
                'data' => [],
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => 0,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }

        $total = DB::table('block')->whereIn('hash', $blockHashes)->count();

        $blocks = DB::table('block')
            ->whereIn('hash', $blockHashes)
            ->orderByDesc('blockNumber')
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
