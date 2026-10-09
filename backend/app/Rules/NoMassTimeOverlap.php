<?php

namespace App\Rules;

use App\Services\ClashDetectionService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoMassTimeOverlap implements ValidationRule
{
    public function __construct(
        private readonly mixed $day,
        private readonly mixed $location,
        private readonly mixed $startTime,
        private readonly ?int $ignoreId = null
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ((!is_null($this->location) && !is_string($this->location))
            || !in_array($this->day, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], true)
            || !is_string($this->startTime) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $this->startTime)) {
            return;
        }
        if (app(ClashDetectionService::class)->massConflict($this->day, $this->startTime, $this->location, $this->ignoreId)) {
            $fail('This Mass time conflicts with another scheduled activity at the same location.');
        }
    }
}
