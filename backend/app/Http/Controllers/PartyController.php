<?php

namespace App\Http\Controllers;

use App\Models\Auditory;
use App\Models\Party;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PartyController extends Controller
{
    private const IMAGE_DISK = 'public';
    private const IMAGE_DIRECTORY = 'parties';
    private const IMAGE_PUBLIC_PREFIX = '/api/parties/image/';
    private const IMAGE_MAX_KB = 4096;
    private const IMAGE_ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    private const DESCRIPTION_MIN_LENGTH = 500;

    public function index()
    {
        $votationId = request()->integer('votationId');
        $query = Party::query()
            ->where('active', true)
            ->select(
                'id',
                'name',
                'description',
                'code',
                'image',
                'color_background',
                'color_title'
            );

        if ($votationId > 0 && DB::table('votation_party')->where('votationId', $votationId)->exists()) {
            $query->whereHas('votations', fn ($q) => $q->where('votation.id', $votationId));
        }

        return $query
            ->orderBy('id')
            ->get();
    }

    /**
     * Catálogo público de partidos para la página /home: incluye tanto los
     * activos como los inactivos y los devuelve en orden alfabético por
     * nombre. No depende de votación alguna; es la presentación general
     * de partidos registrados en el sistema.
     */
    public function publicCatalog()
    {
        return Party::query()
            ->select(
                'id',
                'name',
                'description',
                'code',
                'image',
                'color_background',
                'color_title',
                'active'
            )
            ->orderBy('name')
            ->get();
    }

    public function adminIndex()
    {
        return Party::query()
            ->with(['votations:id,title,state'])
            ->orderBy('id')
            ->get()
            ->map(function (Party $party) {
                $activeVotations = $party->votations->filter(
                    fn ($votation) => $votation->state === 'active'
                )->values();

                return [
                    'id' => $party->id,
                    'name' => $party->name,
                    'code' => $party->code,
                    'description' => $party->description,
                    'image' => $party->image,
                    'color_background' => $party->color_background,
                    'color_title' => $party->color_title,
                    'active' => $party->active,
                    'votationIds' => $party->votations->pluck('id')->values(),
                    'votations' => $party->votations->map(fn ($votation) => [
                        'id' => $votation->id,
                        'title' => $votation->title,
                        'state' => $votation->state,
                    ])->values(),
                    // Bloqueo de edición/borrado mientras alguna votación
                    // asociada esté activa: el frontend usa este flag para
                    // deshabilitar los botones y mostrar el motivo.
                    'lockedByActiveVotation' => $activeVotations->isNotEmpty(),
                    'activeVotations' => $activeVotations->map(fn ($votation) => [
                        'id' => $votation->id,
                        'title' => $votation->title,
                    ])->values(),
                ];
            });
    }

    public function store(Request $request)
    {
        $data = $this->validateParty($request);
        $votationIds = $data['votationIds'] ?? [];
        unset($data['votationIds']);

        $party = Party::create($data);
        $party->votations()->sync($votationIds);

        Auditory::log(
            Auth::id(),
            'CREATE_PARTY',
            "Creación de partido '{$party->name}' (ID: {$party->id})",
            null,
            null
        );

        return response()->json([
            'message' => 'Partido creado',
            'party' => $party,
        ], 201, [], JSON_UNESCAPED_UNICODE);
    }

    public function update(Request $request, int $id)
    {
        $party = Party::findOrFail($id);

        if ($activeVotation = $this->findActiveVotation($party)) {
            return $this->lockedByActiveVotationResponse($activeVotation, 'modificar');
        }

        $data = $this->validateParty($request, $party->id);
        $votationIds = $data['votationIds'] ?? [];
        unset($data['votationIds']);

        $party->update($data);
        $party->votations()->sync($votationIds);

        Auditory::log(
            Auth::id(),
            'UPDATE_PARTY',
            "Actualización de partido '{$party->name}' (ID: {$party->id})",
            null,
            null
        );

        return response()->json([
            'message' => 'Partido actualizado',
            'party' => $party->fresh(),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function destroy(int $id)
    {
        $party = Party::findOrFail($id);

        if ($activeVotation = $this->findActiveVotation($party)) {
            return $this->lockedByActiveVotationResponse($activeVotation, 'eliminar');
        }

        $party->update(['active' => false]);

        Auditory::log(
            Auth::id(),
            'DISABLE_PARTY',
            "Desactivación de partido '{$party->name}' (ID: {$party->id})",
            null,
            null
        );

        return response()->json([
            'message' => 'Partido desactivado',
            'party' => $party->fresh(),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    private function findActiveVotation(Party $party): ?object
    {
        return $party->votations()
            ->where('state', 'active')
            ->select('votation.id', 'votation.title')
            ->first();
    }

    private function lockedByActiveVotationResponse(object $votation, string $action)
    {
        return response()->json([
            'error' => "No se puede {$action} el partido mientras esté asociado a la votación activa \"{$votation->title}\" (ID {$votation->id}).",
            'lockedBy' => [
                'votationId' => $votation->id,
                'votationTitle' => $votation->title,
            ],
        ], Response::HTTP_CONFLICT, [], JSON_UNESCAPED_UNICODE);
    }

    private function validateParty(Request $request, ?int $partyId = null): array
    {
        return $request->validate(
            [
                'name' => 'required|string|max:100',
                'code' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('party', 'code')->ignore($partyId),
                ],
                'description' => 'required|string|min:' . self::DESCRIPTION_MIN_LENGTH,
                'image' => 'required|string|max:255',
                'color_background' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
                'color_title' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
                'active' => 'required|boolean',
                'votationIds' => 'nullable|array',
                'votationIds.*' => 'integer|exists:votation,id',
            ],
            [
                'description.required' => 'La descripción es obligatoria.',
                'description.min' => 'La descripción debe tener al menos :min caracteres.',
                'image.required' => 'La imagen es obligatoria (URL o archivo subido).',
                'color_background.required' => 'El color de fondo es obligatorio.',
                'color_background.regex' => 'El color de fondo debe estar en formato hexadecimal (#RRGGBB).',
                'color_title.required' => 'El color del título es obligatorio.',
                'color_title.regex' => 'El color del título debe estar en formato hexadecimal (#RRGGBB).',
            ]
        );
    }

    /**
     * Recibe un archivo desde el formulario de admin y lo guarda en
     * storage/app/public/parties con un nombre único. Devuelve la URL pública
     * que el frontend debe almacenar en la columna `image`.
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'max:' . self::IMAGE_MAX_KB,
                'mimetypes:' . implode(',', self::IMAGE_ALLOWED_MIME),
            ],
        ]);

        $file = $request->file('image');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $safeBase = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'party';
        $filename = $safeBase . '_' . Str::random(8) . '.' . $extension;

        $stored = $file->storeAs(self::IMAGE_DIRECTORY, $filename, self::IMAGE_DISK);
        if ($stored === false) {
            return response()->json(['message' => 'No se pudo guardar la imagen'], 500);
        }

        return response()->json([
            'filename' => $filename,
            'url' => self::IMAGE_PUBLIC_PREFIX . $filename,
        ], 201);
    }

    /**
     * Sirve la imagen subida desde el storage privado del backend. Es una ruta
     * pública (los logos de partido no son secretos) y aplica una caché corta
     * para reducir consumo en cargas repetidas.
     */
    public function showImage(string $filename)
    {
        if (!preg_match('/^[A-Za-z0-9._-]+$/', $filename)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $path = self::IMAGE_DIRECTORY . '/' . $filename;
        if (!Storage::disk(self::IMAGE_DISK)->exists($path)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $absolutePath = Storage::disk(self::IMAGE_DISK)->path($path);
        $mime = Storage::disk(self::IMAGE_DISK)->mimeType($path) ?: 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}