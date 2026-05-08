<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('votation_party')) {
            return;
        }

        Schema::create('votation_party', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('votationId');
            $table->integer('partyId');
            $table->timestamp('createdAt')->useCurrent();

            $table->unique(['votationId', 'partyId']);
            $table->foreign('votationId')->references('id')->on('votation')->cascadeOnDelete();
            $table->foreign('partyId')->references('id')->on('party')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votation_party');
    }
};