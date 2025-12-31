<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CertAuthController extends Controller
{
    public function login(): JsonResponse
    {
        //Para AWS
        if (env('CERT_AUTH') === 'true') {

            if (
                !isset($_SERVER['SSL_CLIENT_VERIFY']) ||
                $_SERVER['SSL_CLIENT_VERIFY'] !== 'SUCCESS'
            ) {
                return response()->json(['error' => 'Certificado no válido'], 401);
            }

            if (!isset($_SERVER['SSL_CLIENT_S_DN'])) {
                return response()->json(['error' => 'No se pudo leer el certificado'], 401);
            }

            $dn = $_SERVER['SSL_CLIENT_S_DN'];

            if (!preg_match('/serialNumber=([0-9]+)[A-Z]/', $dn, $matches)) {
                return response()->json(['error' => 'DNI no encontrado'], 401);
            }

            $dni = $matches[1];

        } else {
            // DESARROLLO LOCAL
            //$dni = '60840966D'; // citizen
            $dni = '38660052L'; // admin
        }

        $user = User::where('dni', $dni)
            ->where('isActive', 1)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no autorizado'], 403);
        }

        //sesion Laravel
        Auth::login($user);

        //Esto va para React
        return response()->json([
            'roleId' => $user->roleId,
            'dni'    => $user->dni,
        ]);
    }
}