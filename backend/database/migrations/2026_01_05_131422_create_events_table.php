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
    // Create the "events" table in the database
    Schema::create('events', function (Blueprint $table) {

        // Primary key (auto-incrementing ID)
        $table->id();

        // Event title (e.g. "Christmas Mass")
        $table->string('title');

        // Full description of the event (optional)
        $table->text('description')->nullable();

        // Date when the event starts
        $table->date('start_date');

        // Time when the event starts (optional)
        $table->time('start_time')->nullable();

        // Date when the event ends (optional)
        $table->date('end_date')->nullable();

        // Time when the event ends (optional)
        $table->time('end_time')->nullable();

        // Location of the event (e.g. Cathedral, Hall)
        $table->string('location')->nullable();

        // Status to control visibility on the website
        // draft = not visible to public
        // published = visible to public
        $table->enum('status', ['draft', 'published'])->default('published');

        // Category for grouping events (optional, future use)
        $table->string('category')->nullable();

        // Optional image path for event banner
        $table->string('image_path')->nullable();

        // Laravel timestamps (created_at & updated_at)
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
