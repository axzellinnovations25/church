<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('parish_registrations')) {
            return;
        }

        $registrations = DB::table('parish_registrations')
            ->select('id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        foreach ($registrations as $registration) {
            DB::table('parish_registrations')
                ->where('id', $registration->id)
                ->update(['member_id' => "SMC_TMP_{$registration->id}"]);
        }

        foreach ($registrations->values() as $index => $registration) {
            DB::table('parish_registrations')
                ->where('id', $registration->id)
                ->update(['member_id' => 'SMC' . str_pad($index + 1, 4, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        // Member IDs are intentionally not restored to previously inconsistent values.
    }
};
