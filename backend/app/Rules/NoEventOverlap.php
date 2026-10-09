<?php

namespace App\Rules;

use App\Services\ClashDetectionService;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoEventOverlap implements ValidationRule
{
    public function __construct(private ?int $ignoreId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $data = request()->only(['start_date', 'end_date', 'start_time', 'end_time']);
        if ((!is_null(request('location')) && !is_string(request('location'))) || validator($data, [
            'start_date' => 'required|date_format:Y-m-d', 'end_date' => 'nullable|date_format:Y-m-d',
            'start_time' => 'required|date_format:H:i', 'end_time' => 'required|date_format:H:i',
        ])->fails()) {
            return;
        }
        $start = CarbonImmutable::parse($data['start_date'].' '.$data['start_time']);
        $end = CarbonImmutable::parse(($data['end_date'] ?? $data['start_date']).' '.$data['end_time']);
        if ($end <= $start) {
            $fail('End date and time must be after the start date and time.');
            return;
        }
        if (app(ClashDetectionService::class)->eventConflict($start, $end, request('location'), $this->ignoreId)) {
            $fail('This time slot conflicts with another event or Mass at the same location.');
        }
    }
}
