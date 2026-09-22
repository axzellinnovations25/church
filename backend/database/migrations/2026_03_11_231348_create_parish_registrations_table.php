<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parish_registrations', function (Blueprint $table) {

            $table->id();

            // Registration type (individual / family)
            $table->string('registration_type');

            // Unique member ID (for future church database migration)
            $table->string('member_id')->unique()->nullable();

            // Personal information
            $table->string('full_name');
            $table->date('date_of_birth');
            $table->string('gender');
            $table->string('nationality')->nullable();
            $table->string('occupation')->nullable();

            // Address & contact
            $table->string('address_line1');
            $table->string('address_line2')->nullable();
            $table->string('city');
            $table->string('postcode');
            $table->string('phone');
            $table->string('email');

            // Partner information
            $table->string('partner_name')->nullable();

            // Communication preferences
            $table->boolean('contact_by_phone')->default(false);
            $table->boolean('contact_by_email')->default(false);

            // Consent
            $table->boolean('consent_confirmed');

            // Signature
            $table->string('signature');

            $table->date('signed_date');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parish_registrations');
    }
};