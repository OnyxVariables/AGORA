<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal schema for PHPUnit (sqlite). Run with:
 * php artisan migrate:fresh --path=database/migrations/testing
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 30);
        });

        Schema::create('autonomousCommunity', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('name', 100);
        });

        Schema::create('province', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('ineId');
            $table->unsignedInteger('autonomousCommunityId');
            $table->string('name', 100)->nullable();
        });

        Schema::create('municipality', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('ineId');
            $table->unsignedInteger('provinceId');
            $table->string('name', 100)->nullable();
        });

        Schema::create('user', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 100);
            $table->string('nicknamePassword', 130)->nullable();
            $table->unsignedInteger('roleId');
            $table->timestamp('registerDate')->useCurrent();
            $table->boolean('isActive')->default(true);
            $table->string('dni', 30);
            $table->unsignedInteger('municipalityId');
        });

        Schema::create('block', function (Blueprint $table) {
            $table->string('hash', 130)->primary();
            $table->integer('blockNumber');
            $table->string('previousHash', 130)->nullable();
            $table->timestamp('createdAt')->nullable();
            $table->integer('transactions')->default(1);
            $table->boolean('isValid')->default(true);
        });

        Schema::create('votation', function (Blueprint $table) {
            $table->increments('id');
            $table->string('txHash', 130)->nullable();
            $table->string('startBlockHash', 130)->nullable();
            $table->string('endBlockHash', 130)->nullable();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->dateTime('startDate');
            $table->dateTime('endDate')->nullable();
            $table->string('state', 20);
        });

        Schema::create('party', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('color_background')->nullable();
            $table->string('color_title')->nullable();
            $table->boolean('active')->default(true);
        });

        Schema::create('vote', function (Blueprint $table) {
            $table->increments('id');
            $table->string('voteHash', 130)->unique();
            $table->unsignedInteger('votationId');
            $table->unsignedInteger('partyId');
            $table->unsignedInteger('municipalityId');
            $table->string('blockHash', 130);
            $table->string('txHash', 130);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('vote_intent', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('userId');
            $table->string('voteHash', 130)->unique();
            $table->unsignedInteger('votationId');
            $table->timestamp('createdAt')->useCurrent();
        });
<<<<<<< Updated upstream
=======

        Schema::create('auditory', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('userId');
            $table->string('action', 50);
            $table->text('description')->nullable();
            $table->string('txHash', 130)->nullable();
            $table->string('blockHash', 130)->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
>>>>>>> Stashed changes
    }

    public function down(): void
    {
<<<<<<< Updated upstream
=======
        Schema::dropIfExists('auditory');
>>>>>>> Stashed changes
        Schema::dropIfExists('vote_intent');
        Schema::dropIfExists('vote');
        Schema::dropIfExists('party');
        Schema::dropIfExists('votation');
        Schema::dropIfExists('block');
        Schema::dropIfExists('user');
        Schema::dropIfExists('municipality');
        Schema::dropIfExists('province');
        Schema::dropIfExists('autonomousCommunity');
        Schema::dropIfExists('role');
    }
};
