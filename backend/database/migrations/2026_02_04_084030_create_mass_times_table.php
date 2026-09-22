<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mass_times', function (Blueprint $table) {
            $table->id();

            // Day name (Sunday, Monday etc.) - simple for non-technical admin users
            $table->string('day'); 

            // Time of Mass (stored as TIME in MySQL)
            $table->time('time');

            // Optional - e.g., "St Mary's Cathedral" or "Chapel"
            $table->string('location')->nullable();

            // Optional - e.g., "English", "Polish", "Family Mass"
            $table->string('language')->nullable();

            // Optional notes - e.g., "Every 1st Sunday only"
            $table->text('notes')->nullable();

            // Status - allow draft/published like your Events system
            $table->enum('status', ['draft', 'published'])->default('draft');

            // Keep track of sorting (so admin can control display order)
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mass_times');
    }
};
