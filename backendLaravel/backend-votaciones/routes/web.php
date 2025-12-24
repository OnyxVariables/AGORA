<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CertAuthController;

Route::get('/test-db', function () {
    return User::all(); //Prueba para que me muestre todos los usuarios de BBDD
});
