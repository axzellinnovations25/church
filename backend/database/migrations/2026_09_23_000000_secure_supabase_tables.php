<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared(<<<'SQL'
            REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
            REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
            REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
                REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
                REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
            ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
                REVOKE ALL PRIVILEGES ON FUNCTIONS FROM anon, authenticated;
            SQL);
    }

    public function down(): void
    {
        // Intentionally irreversible: rolling back must not reopen private tables
        // to Supabase's browser-facing anon and authenticated roles.
    }
};
