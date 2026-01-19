<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VotationController;

Route::get('/login-cert', [CertAuthController::class, 'login']);

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [UserController::class, 'me']);
    Route::post('/nickname', [UserController::class, 'setNickname']);
});

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/votations', [VotationController::class, 'index']);
    Route::post('/votations', [VotationController::class, 'store']);
    Route::put('/votations/{id}', [VotationController::class, 'update']);
    Route::delete('/votations/{id}', [VotationController::class, 'destroy']);
});
