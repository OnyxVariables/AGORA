<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La sesión guarda el id del modelo User, que usa la tabla `user`, no `users`.
     * La FK por defecto de Laravel (user_id → users.id) rompe Auth::login en prod.
     */
    public function up(): void
    {
        if (! Schema::hasTable('sessions')) {
            return;
        }

        try {
            Schema::table('sessions', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        } catch (\Throwable) {
            // Sin FK o nombre distinto según versión / dumps manuales.
        }
    }

    public function down(): void
    {
        // No recreamos la FK hacia `users`: sería incorrecto para esta aplicación.
    }
};