<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VotationController;
use App\Http\Controllers\VoteController;

Route::get('/login-cert', [CertAuthController::class, 'login']);

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [UserController::class, 'me']);
    Route::post('/nickname', [UserController::class, 'setNickname']);
    Route::post('/vote', [VoteController::class, 'send']);
});

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum', 'role:1')->group(function () {
    Route::get('/votations', [VotationController::class, 'index']);
    Route::post('/votations', [VotationController::class, 'store']);
    Route::put('/votations/{id}', [VotationController::class, 'update']);
    Route::delete('/votations/{id}', [VotationController::class, 'destroy']);
});
