<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\InsecureUserResolver;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CertAuthController extends Controller
{
    public function login(Request $request, InsecureUserResolver $insecureUsers): JsonResponse
    {
        if ($insecureUsers->enabled()) {
            $user = $insecureUsers->resolveCitizen();

            if (!$user) {
                return response()->json([
                    'error' => $insecureUsers->describeMissingUser('citizen'),
                ], 503, [], JSON_UNESCAPED_UNICODE);
            }

            return response()->json([
                'roleId' => (int) $user->roleId,
                'dni' => $user->dni,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }

        // Para AWS
        // if (env('CERT_AUTH') === 'true') {

            $sslVerified = $request->server('SSL_CLIENT_VERIFY') ?? $request->header('X-SSL-Verified');
            $dn = $request->server('SSL_CLIENT_S_DN') ?? $request->header('X-SSL-Client-S-DN');

            Log::info('CertAuth: incoming', ['SSL_CLIENT_VERIFY' => $sslVerified, 'SSL_CLIENT_S_DN' => $dn]);

            if (!$sslVerified || $sslVerified !== 'SUCCESS') {
                return response()->json(['error' => 'Certificado no válido'], 401);
            }

            if (empty($dn)) {
                return response()->json(['error' => 'No se pudo leer el certificado'], 401);
            }

        
            $dni = null;
            if (preg_match('/serialNumber=IDCES-([0-9]{7,8}[A-Za-z])/', $dn, $matches)) {
                $dni = $matches[1];
            } elseif (preg_match('/serialNumber=([^,\/]+)/', $dn, $matches)) {
                $dni = $matches[1];
            }

            if (!$dni) {
                Log::warning('CertAuth: DNI no extraído', ['dn' => $dn]);
                return response()->json(['error' => 'DNI no encontrado'], 401);
            }

            $dni = strtoupper(trim($dni));

        // } else {
        //     // DESARROLLO LOCAL: usa un dni de pruebas
        //     //$dni = '60840966D'; // citizen
        //     $dni = '38660052L'; // admin
        //     Log::info('CertAuth: modo desarrollo. DNI usado', ['dni' => $dni]);
        // }

       
        $user = User::whereRaw('UPPER(dni) = ?', [strtoupper($dni)])
            ->where('isActive', 1)
            ->first();

        if (!$user) {
            Log::notice('CertAuth: usuario no encontrado o inactivo', ['dni' => $dni]);
            return response()->json(['error' => 'Usuario no autorizado'], 403);
        }

        // sesion Laravel
        Auth::login($user);

        Log::info('CertAuth: login OK', ['dni' => $dni, 'user_id' => $user->id ?? null]);

        // Esto va para react
        return response()->json([
            'roleId' => $user->roleId,
            'dni'    => $user->dni,
        ]);
    }

    public function logout(Request $request)
    {
        if (config('agora.insecure_mode')) {
            return response()->json(['message' => 'Modo inseguro: no hay sesión que cerrar'], 200, [], JSON_UNESCAPED_UNICODE);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada'], 200);
    }
}
