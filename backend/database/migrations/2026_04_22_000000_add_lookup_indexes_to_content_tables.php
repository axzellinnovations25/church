<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->index(['status', 'start_date'], 'events_status_start_date_index');
            $table->index('created_at', 'events_created_at_index');
        });

        Schema::table('mass_times', function (Blueprint $table) {
            $table->index(['status', 'day', 'start_time'], 'mass_times_status_day_start_time_index');
        });

        Schema::table('parish_registrations', function (Blueprint $table) {
            $table->index('email', 'parish_registrations_email_index');
            $table->index('signed_date', 'parish_registrations_signed_date_index');
            $table->index('created_at', 'parish_registrations_created_at_index');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->index('created_at', 'contact_messages_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_status_start_date_index');
            $table->dropIndex('events_created_at_index');
        });

        Schema::table('mass_times', function (Blueprint $table) {
            $table->dropIndex('mass_times_status_day_start_time_index');
        });

        Schema::table('parish_registrations', function (Blueprint $table) {
            $table->dropIndex('parish_registrations_email_index');
            $table->dropIndex('parish_registrations_signed_date_index');
            $table->dropIndex('parish_registrations_created_at_index');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex('contact_messages_created_at_index');
        });
    }
};
