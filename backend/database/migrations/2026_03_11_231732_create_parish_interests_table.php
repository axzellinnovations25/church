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
        Schema::create('parish_interests', function (Blueprint $table) {

            $table->id();

            $table->foreignId('registration_id')
                ->constrained('parish_registrations')
                ->cascadeOnDelete();

            $table->boolean('volunteering')->default(false);
            $table->boolean('parish_groups')->default(false);
            $table->boolean('sacramental_preparation')->default(false);
            $table->boolean('weekly_newsletter')->default(false);

            $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parish_interests');
    }
};
