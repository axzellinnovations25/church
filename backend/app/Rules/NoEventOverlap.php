<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\Event;
use Carbon\Carbon;

class NoEventOverlap implements ValidationRule
{
    // ignoreId is used when editing (so it won't clash with itself)
    public function __construct(private ?int $ignoreId) {}

    private ?string $startDate = null;
    private ?string $endDate = null;
    private ?string $startTime = null;
    private ?string $endTime = null;
    private ?string $location = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Get date + time from request
        $this->startDate = request('start_date');
        $this->endDate   = request('end_date') ?: $this->startDate;
        $this->location = request('location');

        // If time is missing, use safe defaults (for all-day events)
        $startTime = request('start_time') ?: '00:00';
        $endTime   = request('end_time') ?: '23:59';

        // Convert event date to weekday (Sunday, Monday etc.)
        $weekday = Carbon::parse($this->startDate)->format('l');

        // Create full datetime strings
        $this->startTime = $this->normalizeTime($startTime);
        $this->endTime = $this->normalizeTime($endTime);

        // Extra safety: make sure end > start
        if (strtotime($this->endTime) <= strtotime($this->startTime)) {
            $fail('End time must be after start time.');
            return;
        }

        if ($this->scheduleIsUnchanged()) {
            return;
        }

        // First: Check Event vs Event overlap (same date)
        $eventQuery = Event::query()
            ->when($this->ignoreId, fn($q) => $q->where('id', '!=', $this->ignoreId))
            ->whereDate('start_date', '<=', $this->endDate)
            ->whereRaw("COALESCE(end_date, start_date) >= ?", [$this->startDate])
            ->where('start_time', '<', $this->endTime)
            ->where('end_time', '>', $this->startTime);

        if ($this->location) {
            $eventQuery->where('location', $this->location);
        }

        if ($eventQuery->exists()) {
            $fail('This time slot is already booked for another event at the same location.');
            return;
        }

        if ($this->hasMassOverlap($weekday)) {
            $fail('This event conflicts with an existing Mass time at the same location.');
        }
    }

    private function normalizeTime(string $value): string
    {
        return substr_count($value, ':') === 1 ? "{$value}:00" : $value;
    }

    private function scheduleIsUnchanged(): bool
    {
        if (! $this->ignoreId) {
            return false;
        }

        $event = Event::find($this->ignoreId);

        if (! $event) {
            return false;
        }

        $existingStartDate = $this->normalizeDate($event->start_date);
        $existingEndDate = $this->normalizeDate($event->end_date) ?: $existingStartDate;
        $existingStartTime = $this->normalizeTime((string) ($event->start_time ?: '00:00'));
        $existingEndTime = $this->normalizeTime((string) ($event->end_time ?: '23:59'));

        return $existingStartDate === $this->startDate
            && $existingEndDate === $this->endDate
            && $existingStartTime === $this->startTime
            && $existingEndTime === $this->endTime
            && $this->normalizeLocation($event->location) === $this->normalizeLocation($this->location);
    }

    private function normalizeDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Carbon::parse($value)->format('Y-m-d');
    }

    private function normalizeLocation(?string $value): string
    {
        return mb_strtolower(trim((string) $value), 'UTF-8');
    }

    private function hasMassOverlap(string $weekday): bool
    {
        if (! $this->location) {
            return false;
        }

        return \App\Models\MassTime::query()
            ->where('location', $this->location)
            ->where('day', $weekday)
            ->where('start_time', '<', $this->endTime)
            ->where('end_time', '>', $this->startTime)
            ->exists();
    }
}
