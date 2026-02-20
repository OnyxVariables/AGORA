<?php

namespace App\Http\Controllers;

use App\Models\Votation;
use Illuminate\Http\Request;

class VotationController extends Controller
{
    // READ
    public function index()
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }
        
        return response()->json(Votation::all(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    // CREATE
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
            'state' => 'required|in:active,finished,pending',
        ]);

        $fakeHash = hash('sha256', uniqid());

        // INSERTO bloque de prueba en la tabla 'block' para que la base de datos no se queje de la Foreign Key
        //En el siguiente sprint, la blockchain genera los bloques y se guardan en block en la BBDD donde se referencia aquí
        \DB::table('block')->insertOrIgnore([
            'hash' => $fakeHash,
            'blockNumber' => rand(1, 1000),
            'previousHash' => '0',
            'transactions' => 0,
            'isValid' => 1,
            'createdAt' => now()
        ]);

        $data['startBlockHash'] = $fakeHash;
        $data['endBlockHash'] = $fakeHash;

        $votation = Votation::create($data);

        return response()->json($votation, 201);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        $votation = Votation::findOrFail($id);

        $votation->update($request->all());

        return response()->json($votation, 200);
    }

    // DELETE
    public function destroy($id)
    {
        if (Auth::user()->roleId !== 1) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        Votation::destroy($id);
        return response()->json(null, 204);
    }
}