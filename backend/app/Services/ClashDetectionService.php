<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ClashDetectionService
{
    /**
     * Generic overlap detection method.
     * Used when checking clashes inside a single model.
     */
    public function hasOverlap(
        string $modelClass,
        string $startColumn,
        string $endColumn,
        string $start,
        string $end,
        ?int $ignoreId = null,
        array $filters = []
    ): bool {

        // Start query for the given model
        $query = $modelClass::query();

        // Apply optional filters (day, location etc.)
        foreach ($filters as $column => $value) {
            if ($value !== null && $value !== '') {
                $query->where($column, $value);
            }
        }

        // Ignore current record when editing
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        // Core overlap logic:
        // newStart < existingEnd AND newEnd > existingStart
        $query->where($startColumn, '<', $end)
              ->where($endColumn, '>', $start);

        return $query->exists();
    }


    /**
     * Check clashes across multiple scheduling models
     * Used for global conflict prevention (Event vs Mass etc.)
     */
    public function hasGlobalOverlap(
        ?string $location,       // location can be null
        string $start,
        string $end,
        ?string $weekday = null, // weekday is needed only when checking Mass vs Event
        ?int $ignoreId = null,
        ?string $ignoreModel = null
    ): bool {

        // If location is empty, skip global clash check
        // Because we only compare conflicts within same location
        if (!$location) {
            return false;
        }

        // --------------------------------------------------
        // Check against Events table (date-based events)
        // --------------------------------------------------
        $eventQuery = \App\Models\Event::query()
            ->where('location', $location)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start);

        // If editing an event, ignore itself
        if ($ignoreModel === 'event' && $ignoreId) {
            $eventQuery->where('id', '!=', $ignoreId);
        }

        if ($eventQuery->exists()) {
            return true;
        }

        // --------------------------------------------------
        // Check against Mass Times table (weekly recurring)
        // --------------------------------------------------

        $massQuery = \App\Models\MassTime::query()
            ->where('location', $location)
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start);

        // Only compare weekday if provided (for Event vs Mass)
        if ($weekday) {
            $massQuery->where('day', $weekday);
        }

        // If editing a mass time, ignore itself
        if ($ignoreModel === 'mass' && $ignoreId) {
            $massQuery->where('id', '!=', $ignoreId);
        }

        if ($massQuery->exists()) {
            return true;
        }

        // If no clashes found
        return false;
    }
}