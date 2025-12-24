<?php

use App\Http\Controllers\CertAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/login-cert', [CertAuthController::class, 'login']);