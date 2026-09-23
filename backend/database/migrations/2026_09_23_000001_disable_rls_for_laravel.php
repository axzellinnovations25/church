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
            DO $security$
            DECLARE
                table_record record;
            BEGIN
                FOR table_record IN
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE format(
                        'ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',
                        table_record.tablename
                    );
                END LOOP;
            END
            $security$;
            SQL);
    }

    public function down(): void
    {
        // Intentionally left empty as RLS should remain disabled for standard Laravel DB access
    }
};
