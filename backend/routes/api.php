<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VotationController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\MetricsController;

Route::get('/login-cert', [CertAuthController::class, 'login']);
Route::get('/parties', [PartyController::class, 'index']);

// Ruta pública - no requiere autenticación (por ahora)
Route::get('/votation/active', [VotationController::class, 'active']);
Route::get('/votations/summary', [VotationController::class, 'publicSummary']);

// Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [UserController::class, 'me']);
    Route::post('/nickname', [UserController::class, 'setNickname']);
    Route::post('/vote', [VoteController::class, 'send']);
    Route::post('/vote/verify', [VoteController::class, 'verify']);
    Route::post('/logout', [CertAuthController::class, 'logout']);
});
    
    // Ruta protegida por Sanctum donde solo puede acceder usuario autenticado
Route::middleware('auth:sanctum', 'role:1')->group(function () {
    Route::get('/votations', [VotationController::class, 'index']);
    Route::post('/votations', [VotationController::class, 'store']);
    Route::put('/votations/{id}', [VotationController::class, 'update']);
    Route::delete('/votations/{id}', [VotationController::class, 'destroy']);
    Route::get('/votes/metrics/{votationId}', [VoteController::class, 'metrics']);
    Route::get('/metrics/votation/{votationId}', [MetricsController::class, 'votationBundle']);
});
