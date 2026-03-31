<?php

namespace App\Http\Controllers;

use App\Models\Votation;
use App\Services\BlockchainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class VotationController extends Controller
{
    protected $blockchainService;

    public function __construct(BlockchainService $blockchainService)
    {
        $this->blockchainService = $blockchainService;
    }

    // READ
    public function index()
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        return response()->json(Votation::all(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    // CREATE (BD (pending) + Blockchain)
    public function store(Request $request)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string',
            'startDate' => 'required|date',
            'endDate' => 'nullable|date',
        ]);

        // Primero verificar conexión blockchain antes de iniciar transacción
        $connection = $this->blockchainService->checkConnection();
        if (!$connection['success']) {
            return response()->json([
                'error' => 'Blockchain no disponible',
                'details' => $connection['error']
            ], 503);
        }

        DB::beginTransaction();

        try {
            // Enviar transacción a blockchain
            $blockchainResult = $this->blockchainService->createVotation(
                $data['title'],
                $data['description'] ?? '',
                $data['startDate'],
                $data['endDate'] ?? $data['startDate']
            );

            if (!$blockchainResult['success']) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Error en blockchain: ' . $blockchainResult['error']
                ], 500);
            }

            // Guardar en BD como PENDING
            $votation = Votation::create([
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'startDate' => $data['startDate'],
                'endDate' => $data['endDate'] ?? null,
                'state' => 'pending',
                'startBlockHash' => null,
                'endBlockHash' => null,
                'blockchainId' => $blockchainResult['votationId'] ?? null,
                'txHash' => $blockchainResult['transactionHash']
            ]);

            DB::commit();

            Log::info('Votación creada (pending)', [
                'user_id' => Auth::id(),
                'votation_id' => $votation->id,
                'txHash' => $blockchainResult['transactionHash']
            ]);

            return response()->json([
                'message' => 'Votación enviada a blockchain (pending)',
                'votation' => $votation
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creando votación', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error creando votación'
            ], 500);
        }
    }

    // UPDATE (BD (pending) + Blockchain)
    //All (Oliver): pensar en algo para poder seguir votando si actualizo / cancelo ya que pasa a pending y solo se puede votar cuando esta active
    public function update(Request $request, $id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::findOrFail($id);

        // Primero verificar conexión blockchain antes de iniciar transacción
        $connection = $this->blockchainService->checkConnection();
        if (!$connection['success']) {
            return response()->json([
                'error' => 'Blockchain no disponible',
                'details' => $connection['error']
            ], 503);
        }

        $data = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'nullable|string',
            'startDate' => 'required|date',
            'endDate' => 'nullable|date',
        ]);

        DB::beginTransaction();

        try {
            // Enviar actualización a blockchain
            $blockchainResult = $this->blockchainService->updateVotation(
                $votation->blockchainId,
                $data['title'],
                $data['description'] ?? '',
                $data['startDate'],
                $data['endDate'] ?? $data['startDate'],
                'pending'
            );

            if (!$blockchainResult['success']) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Error actualizando en blockchain: ' . $blockchainResult['error']
                ], 500);
            }

            // Actualizar BD local como PENDING
            $votation->update(array_merge($data, [
                'state' => 'pending',
                'txHash' => $blockchainResult['transactionHash']
            ]));

            DB::commit();

            Log::info('Votación actualizada (pending)', [
                'votation_id' => $id,
                'txHash' => $blockchainResult['transactionHash']
            ]);

            return response()->json([
                'message' => 'Votación actualizada (pending)',
                'votation' => $votation
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error actualizando votación', [
                'votation_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error actualizando votación'
            ], 500);
        }
    }

    // CANCEL (BD (pending) + Blockchain)
    public function destroy($id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::findOrFail($id);

        // Primero verificar conexión blockchain antes de iniciar transacción
        $connection = $this->blockchainService->checkConnection();
        if (!$connection['success']) {
            return response()->json([
                'error' => 'Blockchain no disponible',
                'details' => $connection['error']
            ], 503);
        }

        DB::beginTransaction();

        try {
            // Cancelar en blockchain
            $blockchainResult = $this->blockchainService->cancelVotation(
                $votation->blockchainId,
                'Cancelada desde sistema'
            );

            if (!$blockchainResult['success']) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Error cancelando en blockchain: ' . $blockchainResult['error']
                ], 500);
            }

            // Marcar BD como pending hasta que Spring Boot confirme
            $votation->update([
                'state' => 'pending',
                'txHash' => $blockchainResult['transactionHash']
            ]);

            DB::commit();

            Log::info('Votación cancelada (pending)', [
                'votation_id' => $id,
                'txHash' => $blockchainResult['transactionHash']
            ]);

            return response()->json([
                'message' => 'Votación cancelada (pending)'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error cancelando votación', [
                'votation_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Error cancelando votación'
            ], 500);
        }
    }

    //All (Oliver): pensar en algo que automaticamente cambie el estado de la votación a finished cuando endDate sea menor a now() y lo haga
    // desde Spring Boot escuchando el evento

    // OBTENER VOTACIÓN ACTIVA (para frontend)
    public function active()
    {
        $votation = Votation::where('state', 'active')
            ->where('endDate', '>', now())
            ->first();

        if (!$votation) {
            return response()->json(['error' => 'No hay votación activa'], 404);
        }

        return response()->json($votation);
    }
}