<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        if (!in_array($request->user()->roleId, $roles)) {
            return response()->json(['error' => 'No tienes permiso'], 403);
        }

        return $next($request);
    }
}