<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * --------------------------------------------------------------------------
     * Run the migrations
     * --------------------------------------------------------------------------
     * This creates the contact_messages table used by the public contact form.
     */

    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {

            $table->id();

            // Name of the person sending the message
            $table->string('name');

            // Email address of the sender
            $table->string('email');

            // Phone number (optional field from the form)
            $table->string('phone')->nullable();

            // Subject of the message
            $table->string('subject');

            // Actual message content
            $table->text('message');

            // Created at / Updated at timestamps
            $table->timestamps();
        });
    }

    /**
     * --------------------------------------------------------------------------
     * Reverse the migrations
     * --------------------------------------------------------------------------
     * This removes the contact_messages table if migration is rolled back.
     */

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};