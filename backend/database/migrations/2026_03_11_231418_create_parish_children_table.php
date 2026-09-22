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
        Schema::create('parish_children', function (Blueprint $table) {
            
            $table->id();

            $table->foreignId('registration_id')
                ->constrained('parish_registrations')
                ->cascadeOnDelete();

            $table->string('child_name');
            $table->integer('age')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parish_children');
    }
};
