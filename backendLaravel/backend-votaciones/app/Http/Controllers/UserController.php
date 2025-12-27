<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class UserController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user(); //Usuario autenticado por Sanctum

        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $user->load('municipality.province.autonomouscommunity');

        $fullName = trim($user->name);
        $parts = preg_split('/\s+/', $fullName);

        $nombre = $parts[0] ?? null;
        $apellidos = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : null;

        return response()->json([
            'nombre' => $nombre,
            'apellidos' => $apellidos,
            'dni' => $user->dni,
            'nickname' => $user->nicknamePassword ?? "Sin nickname",
            'municipio' => $user->municipality->name ?? null,
            'provincia' => $user->municipality->province->name ?? null,
            'comunidad' => $user->municipality->province->autonomouscommunity->name ?? null,
            'nacion' => 'España',
        ] , 200, [], JSON_UNESCAPED_UNICODE); //Para forzar utf-8 sin escape cuando devuelve el json
    }
}