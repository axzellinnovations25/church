<?php

namespace App\Rules;

use App\Services\ClashDetectionService;
use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use App\Models\MassTime;

class NoMassTimeOverlap implements ValidationRule
{
    public function __construct(
        private readonly string $day,
        private readonly ?string $location,
        private readonly ?string $startTime,
        private readonly ?int $ignoreId = null
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$this->startTime) {
            return;
        }

        $exists = MassTime::query()
            ->where('day', $this->day)
            ->where('start_time', $this->startTime)
            ->when($this->location, fn($q) => $q->where('location', $this->location))
            ->when($this->ignoreId, fn($q) => $q->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('A Mass Time already exists for this day and time.');
            return;
        }

        $start = Carbon::createFromFormat('H:i', $this->startTime)
            ->format('H:i:s');

        $end = Carbon::createFromFormat('H:i', $this->startTime)
            ->addHour()
            ->format('H:i:s');

        $service = app(ClashDetectionService::class);

        $hasOverlap = $service->hasGlobalOverlap(
            location: $this->location,
            start: $start,
            end: $end,
            ignoreId: $this->ignoreId,
            ignoreModel: 'mass'
        );

        if ($hasOverlap) {

            $locationText = $this->location
                ? " at {$this->location}"
                : '';

            $fail("This Mass Time conflicts with another scheduled activity{$locationText}.");
        }
    }
}