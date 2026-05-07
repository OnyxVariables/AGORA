<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('block', 'chain_timestamp')) {
            return;
        }
        Schema::table('block', function (Blueprint $table) {
            $table->unsignedInteger('chain_timestamp')->nullable()->after('isValid');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('block', 'chain_timestamp')) {
            return;
        }
        Schema::table('block', function (Blueprint $table) {
            $table->dropColumn('chain_timestamp');
        });
    }
};