<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CertAuthController;

Route::get('/test-db', function () {
    return User::all(); //Prueba para que me muestre todos los usuarios de BBDD
});

Route::get('/login', fn() => 'AGORA')->name('login'); //Si no hay usuario autenticado en api/me redirige automaticamente Laravel a login y si no creo la ruta da error
//por esa razon esta linea de codigo
