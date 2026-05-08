<?php

namespace App\Http\Controllers;

use App\Models\Auditory;
use App\Models\Seat;
use App\Models\Votation;
use App\Services\BlockchainService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VotationController extends Controller
{
    public function __construct(
        protected BlockchainService $blockchainService
    ) {
    }

    /**
     * Duración fija (en minutos) de una votación. Se lee desde
     * config/agora.php (variable de entorno VOTATION_DURATION_MINUTES) para
     * que admin y frontend usen el mismo valor sin duplicarlo.
     */
    private function durationMinutes(): int
    {
        $minutes = (int) config('agora.votation.duration_minutes', 5);

        return $minutes > 0 ? $minutes : 5;
    }

    /**
     * Devuelve un texto legible y los componentes (horas/minutos) de la
     * duración configurada para mostrarlos en mensajes y tooltips.
     */
    private function durationDescriptor(): array
    {
        $minutes = $this->durationMinutes();
        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = $hours . ' ' . ($hours === 1 ? 'hora' : 'horas');
        }
        if ($remainingMinutes > 0) {
            $parts[] = $remainingMinutes . ' ' . ($remainingMinutes === 1 ? 'minuto' : 'minutos');
        }

        return [
            'minutes' => $minutes,
            'hours' => $hours,
            'remainingMinutes' => $remainingMinutes,
            'label' => implode(' y ', $parts) ?: '0 minutos',
        ];
    }

    private function hasOverlappingVotation(Carbon $start, Carbon $end, ?int $excludeId = null): bool
    {
        $query = Votation::query()
            ->whereIn('state', ['pending', 'active'])
            ->where('startDate', '<', $end)
            ->whereRaw('COALESCE(endDate, ?) > ?', ['9999-12-31 23:59:59', $start]);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    // READ
    public function index()
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        return response()->json(Votation::all(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Crear votación solo en BD (pending). La cadena se activa por scheduler al llegar startDate
    public function store(Request $request)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string',
            'startDate' => 'required|date',
        ]);

        $start = Carbon::parse($data['startDate']);
        $duration = $this->durationDescriptor();
        $end = $start->copy()->addMinutes($duration['minutes']);

        if ($this->hasOverlappingVotation($start, $end, null)) {
            return response()->json([
                'error' => "Ya existe una votación pendiente o activa que solapa con este horario (ventana de {$duration['label']}).",
            ], 422);
        }

        $votation = Votation::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'startDate' => $start,
            'endDate' => $end,
            'state' => 'pending',
            'startBlockHash' => null,
            'endBlockHash' => null,
            'txHash' => null,
        ]);

        Log::info('Votación creada en BD (pending, sin cadena aún)', [
            'user_id' => Auth::id(),
            'votation_id' => $votation->id,
        ]);

        Auditory::log(
            Auth::id(),
            'CREATE_VOTATION',
            "Creación programada de votación '{$votation->title}' (ID: {$votation->id})",
            null,
            null
        );

        return response()->json([
            'message' => 'Votación creada (pending). Se enviará a blockchain al iniciar la fecha.',
            'votation' => $votation,
        ], 201);
    }

    // Editar solo en BD mientras no esté active. No envía transacciones a blockchain
    public function update(Request $request, $id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::findOrFail($id);

        if ($votation->state === 'active') {
            return response()->json([
                'error' => 'No se puede editar una votación activa.',
            ], 403);
        }

        if (in_array($votation->state, ['finished', 'cancelled'], true)) {
            return response()->json([
                'error' => 'No se puede editar una votación finalizada o cancelada.',
            ], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string',
            'startDate' => 'required|date',
        ]);

        $start = Carbon::parse($data['startDate']);
        $end = $start->copy()->addMinutes($this->durationMinutes());

        if ($this->hasOverlappingVotation($start, $end, (int) $votation->id)) {
            return response()->json([
                'error' => 'Ya existe otra votación que solapa con este horario.',
            ], 422);
        }

        $votation->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? '',
            'startDate' => $start,
            'endDate' => $end,
        ]);

        Log::info('Votación actualizada en BD', ['votation_id' => $id]);

        Auditory::log(
            Auth::id(),
            'UPDATE_VOTATION',
            "Actualización de votación '{$votation->title}' (ID: {$votation->id})",
            null,
            null
        );

        return response()->json([
            'message' => 'Votación actualizada',
            'votation' => $votation->fresh(),
        ]);
    }

    // Cancelar: si ya hay tx en cadena, cancelVotation; si no, solo BD
    public function destroy($id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::findOrFail($id);

        if ($votation->state === 'active') {
            return response()->json([
                'error' => 'No se puede cancelar una votación activa.',
            ], 403);
        }

        if (in_array($votation->state, ['finished', 'cancelled'], true)) {
            return response()->json([
                'error' => 'La votación ya está finalizada o cancelada.',
            ], 403);
        }

        $hasChainRecord = !empty($votation->txHash);

        if (!$hasChainRecord) {
            $votation->update(['state' => 'cancelled']);

            Auditory::log(
                Auth::id(),
                'CANCEL_VOTATION',
                "Cancelación local de votación '{$votation->title}' (ID: {$id})",
                null,
                null
            );

            return response()->json(['message' => 'Votación cancelada']);
        }

        $connection = $this->blockchainService->checkConnection();
        if (!$connection['success']) {
            return response()->json([
                'error' => 'Blockchain no disponible',
                'details' => $connection['error'],
            ], 503);
        }

        DB::beginTransaction();

        try {
            $blockchainResult = $this->blockchainService->cancelVotation(
                $votation->id,
                'Cancelada desde sistema'
            );

            if (!$blockchainResult['success']) {
                DB::rollBack();

                return response()->json([
                    'error' => 'Error cancelando en blockchain: '.$blockchainResult['error'],
                ], 500);
            }

            $this->blockchainService->ensureBlockExists(
                $blockchainResult['blockHash'],
                $blockchainResult['blockNumber'],
                $blockchainResult['parentHash'] ?? null
            );

            $votation->update([
                'txHash' => $blockchainResult['transactionHash'],
                'startBlockHash' => $blockchainResult['blockHash'],
            ]);

            DB::commit();

            Auditory::log(
                Auth::id(),
                'CANCEL_VOTATION',
                "Cancelación en cadena de votación '{$votation->title}' (ID: {$id})",
                $blockchainResult['transactionHash'],
                $blockchainResult['blockHash']
            );

            return response()->json(['message' => 'Votación cancelada (cadena)']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cancelando votación', [
                'votation_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Error cancelando votación'], 500);
        }
    }

    /**
     * Configuración pública (no necesita auth) para que el frontend pueda
     * mostrar la duración exacta en formularios y tooltips sin duplicar el
     * valor en .env del frontend.
     */
    public function config()
    {
        return response()->json([
            'duration' => $this->durationDescriptor(),
        ]);
    }

    // OBTENER VOTACIÓN ACTIVA (para frontend)
    public function active()
    {
        $votation = Votation::votableForCitizens()
            ->orderByDesc('id')
            ->first();

        if (!$votation) {
            $this->logVotationActiveMiss();

            return response()->json(['error' => 'No hay votación activa'], 404);
        }

        return response()->json($votation);
    }

    // DEBUG
    private function logVotationActiveMiss(): void
    {
        $counts = Votation::query()
            ->selectRaw('state, COUNT(*) as c')
            ->groupBy('state')
            ->pluck('c', 'state')
            ->all();

        $latest = Votation::query()->orderByDesc('id')->first();

        Log::warning('votation.active: ninguna fila votable', [
            'counts_by_state' => $counts,
            'latest' => $latest ? $latest->only(['id', 'state', 'txHash', 'startDate', 'endDate']) : null,
            'now_app' => (string) now(),
            'hint' => 'Requiere state=active, o pending con txHash; startDate<=ahora; endDate null o futuro.',
        ]);
    }

    // Listado público de votaciones (p. ej. selector en /resultados y verificación de voto)
    public function publicSummary()
    {
        $rows = Votation::query()
            ->whereIn('state', ['active', 'finished', 'pending'])
            ->orderByDesc('id')
            ->get(['id', 'title', 'state', 'startDate', 'endDate']);

        return response()->json($rows, 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Resultados detallados (escaños y votos por provincia/partido) — solo votación finalizada
    public function results(int $id)
    {
        $votation = Votation::findOrFail($id);

        if ($votation->state !== 'finished') {
            return response()->json([
                'error' => 'Los resultados solo están disponibles cuando la votación está finalizada.',
            ], 403);
        }

        $seats = Seat::query()
            ->with(['province.autonomousCommunity', 'party'])
            ->where('votationId', $id)
            ->orderBy('provinceId')
            ->orderByDesc('seatsAssigned')
            ->get();

        $byProvince = [];
        foreach ($seats as $row) {
            $pName = $row->province->name ?? 'Provincia '.$row->provinceId;
            $ccaaName = $row->province->autonomousCommunity->name ?? null;
            if (! isset($byProvince[$pName])) {
                $byProvince[$pName] = [
                    'provinceId' => $row->provinceId,
                    'provinceName' => $pName,
                    'autonomousCommunityName' => $ccaaName,
                    'parties' => [],
                ];
            }
            $byProvince[$pName]['parties'][] = [
                'partyId' => $row->partyId,
                'partyName' => $row->party->name ?? 'Partido '.$row->partyId,
                'votes' => (int) $row->votes,
                'seatsAssigned' => (int) $row->seatsAssigned,
                'colorBackground' => $row->party->color_background ?? null,
                'colorTitle' => $row->party->color_title ?? null,
            ];
        }

        return response()->json([
            'votation' => $votation->only(['id', 'title', 'state', 'startDate', 'endDate']),
            'byProvince' => array_values($byProvince),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    // Resumen agregado por CCAA y nacional (votos y escaños por partido)
    public function resultsSummary(int $id)
    {
        $votation = Votation::findOrFail($id);

        if ($votation->state !== 'finished') {
            return response()->json([
                'error' => 'Los resultados solo están disponibles cuando la votación está finalizada.',
            ], 403);
        }

        $seats = Seat::query()
            ->with(['province.autonomousCommunity', 'party'])
            ->where('votationId', $id)
            ->get();

        $national = [];
        $byCcaa = [];

        foreach ($seats as $row) {
            $partyName = $row->party->name ?? 'Partido '.$row->partyId;
            $pid = (int) $row->partyId;
            $votes = (int) $row->votes;
            $s = (int) $row->seatsAssigned;

            if (! isset($national[$pid])) {
                $national[$pid] = [
                    'partyId' => $pid,
                    'partyName' => $partyName,
                    'votes' => 0,
                    'seats' => 0,
                    'colorBackground' => $row->party->color_background ?? null,
                    'colorTitle' => $row->party->color_title ?? null,
                ];
            }
            $national[$pid]['votes'] += $votes;
            $national[$pid]['seats'] += $s;

            $ccaa = $row->province->autonomousCommunity->name ?? 'Sin CCAA';
            if (! isset($byCcaa[$ccaa])) {
                $byCcaa[$ccaa] = [];
            }
            if (! isset($byCcaa[$ccaa][$pid])) {
                $byCcaa[$ccaa][$pid] = [
                    'partyId' => $pid,
                    'partyName' => $partyName,
                    'votes' => 0,
                    'seats' => 0,
                    'colorBackground' => $row->party->color_background ?? null,
                    'colorTitle' => $row->party->color_title ?? null,
                ];
            }
            $byCcaa[$ccaa][$pid]['votes'] += $votes;
            $byCcaa[$ccaa][$pid]['seats'] += $s;
        }

        $normalize = fn ($map) => array_values($map);

        $byCcaaOut = [];
        foreach ($byCcaa as $ccaaName => $parties) {
            $byCcaaOut[] = [
                'autonomousCommunityName' => $ccaaName,
                'parties' => $normalize($parties),
            ];
        }

        return response()->json([
            'votation' => $votation->only(['id', 'title', 'state', 'startDate', 'endDate']),
            'national' => $normalize($national),
            'byAutonomousCommunity' => $byCcaaOut,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }
}