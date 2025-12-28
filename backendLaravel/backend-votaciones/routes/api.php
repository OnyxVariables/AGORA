<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::get('/login-cert', [CertAuthController::class, 'login']);

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [UserController::class, 'me']);
});