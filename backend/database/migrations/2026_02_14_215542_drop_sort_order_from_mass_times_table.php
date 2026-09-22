<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove sort_order column
     */
    public function up(): void
    {
        Schema::table('mass_times', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }

    /**
     * Add sort_order back if migration is rolled back
     */
    public function down(): void
    {
        Schema::table('mass_times', function (Blueprint $table) {
            $table->integer('sort_order')->nullable();
        });
    }
};
