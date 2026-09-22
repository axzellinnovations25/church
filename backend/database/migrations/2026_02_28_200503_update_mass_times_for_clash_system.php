<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void

    {
    Schema::table('mass_times', function (Blueprint $table) {

        // Rename 'time' column to 'start_time'
        $table->renameColumn('time', 'start_time');

        // Add end_time column for clash detection
        $table->time('end_time')->nullable()->after('start_time');
    });
    }

public function down(): void
   {
    Schema::table('mass_times', function (Blueprint $table) {

        // Remove end_time if rolled back
        $table->dropColumn('end_time');

        // Rename back to original
        $table->renameColumn('start_time', 'time');
    });
   }
};
