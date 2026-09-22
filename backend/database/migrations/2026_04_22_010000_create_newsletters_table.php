<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('newsletters', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('publication_date');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('original_filename');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->enum('status', ['draft', 'published'])->default('published');
            $table->timestamps();

            $table->index(['status', 'publication_date'], 'newsletters_status_publication_date_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletters');
    }
};
