<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Seat;
use App\Models\Votation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Admin-only aggregated data for the /metrics dashboard
class MetricsController extends Controller
{
    public function votationBundle(int $votationId): JsonResponse
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::find($votationId);
        if (!$votation) {
            return response()->json(['error' => 'Votación no encontrada'], 404);
        }

        $votes = DB::table('vote')
            ->where('votationId', $votationId)
            ->orderByDesc('id')
            ->get();

        $partyNames = Party::query()->pluck('name', 'id')->all();

        $municipalityIds = $votes->pluck('municipalityId')->unique()->filter()->values()->all();
        $geoByMunicipalityId = collect();
        if ($municipalityIds !== []) {
            $geoByMunicipalityId = DB::table('municipality as m')
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
        // Agrego bloques de creación y finalización de la votación (auditory)
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

        $totalVotes = $votes->count();
        $votesByParty = $votes->groupBy('partyId')->map(fn ($g) => $g->count())->all();
        $votesByMunicipality = $votes->groupBy('municipalityId')->map(fn ($g) => $g->count())->all();

        $municipalities = DB::table('municipality')->select('id', 'provinceId')->get()->keyBy('id');
        $provinceNames = DB::table('province')->pluck('name', 'id');
        $votesByProvinceName = [];
        foreach ($votes as $v) {
            $m = $municipalities->get($v->municipalityId);
            if (!$m) {
                continue;
            }
            $pName = $provinceNames[$m->provinceId] ?? null;
            if ($pName === null || $pName === '') {
                continue;
            }
            $votesByProvinceName[$pName] = ($votesByProvinceName[$pName] ?? 0) + 1;
        }

        $auditRows = [];
        if (Schema::hasTable('auditory')) {
            $auditRows = DB::table('auditory as a')
                ->leftJoin('user as u', 'u.id', '=', 'a.userId')
                ->orderByDesc('a.id')
                ->limit(100)
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

        $seatsByParty = [];
        if (Schema::hasTable('seat')) {
            $seatsByParty = Seat::query()
                ->where('votationId', $votationId)
                ->get()
                ->groupBy('partyId')
                ->map(fn ($group) => (int) $group->sum('seatsAssigned'))
                ->all();
        }

        $registeredCitizens = DB::table('user')->where('roleId', 2)->count();

        return response()->json([
            'votation' => $votation,
            'metrics' => [
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
            ],
            'votes' => $voteRows,
            'blocks' => $blocks,
            'audit' => $auditRows,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}