<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VotationController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\AdminHealthController;

Route::get('/login-cert', [CertAuthController::class, 'login']);
Route::get('/parties', [PartyController::class, 'index']);
Route::get('/parties/catalog', [PartyController::class, 'publicCatalog']);
Route::get('/parties/image/{filename}', [PartyController::class, 'showImage'])
    ->where('filename', '[A-Za-z0-9._-]+');

// Ruta pública - no requiere autenticación (por ahora)
Route::get('/votation/active', [VotationController::class, 'active']);
Route::get('/votations/config', [VotationController::class, 'config']);
Route::get('/votations/summary', [VotationController::class, 'publicSummary']);
Route::get('/votations/{id}/results', [VotationController::class, 'results']);
Route::get('/votations/{id}/results/summary', [VotationController::class, 'resultsSummary']);
Route::get('/votations/{id}/votes-timeseries', [MetricsController::class, 'votationTimeseriesPublic']);

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
    Route::get('/admin/parties', [PartyController::class, 'adminIndex']);
    Route::post('/admin/parties', [PartyController::class, 'store']);
    Route::post('/admin/parties/upload-image', [PartyController::class, 'uploadImage']);
    Route::put('/admin/parties/{id}', [PartyController::class, 'update']);
    Route::delete('/admin/parties/{id}', [PartyController::class, 'destroy']);
    Route::get('/votes/metrics/{votationId}', [VoteController::class, 'metrics']);
    Route::get('/metrics/votation/{votationId}', [MetricsController::class, 'votationBundle']);
    Route::get('/metrics/votation/{votationId}/votes', [MetricsController::class, 'votationVotes']);
    Route::get('/metrics/votation/{votationId}/blocks', [MetricsController::class, 'votationBlocks']);
    Route::get('/metrics/votation/{votationId}/audit', [MetricsController::class, 'votationAudit']);
    Route::get('/metrics/votation/{votationId}/timeseries', [MetricsController::class, 'votationTimeseries']);
    Route::get('/admin/health/db', [AdminHealthController::class, 'database']);
    Route::get('/admin/health/blockchain', [AdminHealthController::class, 'blockchain']);
});
