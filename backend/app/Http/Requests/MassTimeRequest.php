<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoMassTimeOverlap;
use Illuminate\Support\Facades\Auth;

class MassTimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'location' => $this->titleCase($this->location),
            'language' => $this->titleCase($this->language),
            'notes' => $this->capitalizeFirst($this->notes),
        ]);
    }

    private function titleCase(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        if ($value === '') {
            return $value;
        }

        return preg_replace_callback(
            "/\b(\p{Ll})([\p{L}\p{M}\p{N}_'’-]*)/u",
            fn ($match) => mb_strtoupper($match[1], 'UTF-8') . $match[2],
            $value
        );
    }

    private function capitalizeFirst(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        if ($value === '') {
            return $value;
        }

        return mb_strtoupper(mb_substr($value, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($value, 1, null, 'UTF-8');
    }

    public function rules(): array
    {
        $massTimeId = $this->route('mass_time')?->id;

        return [

            'day' => ['required', 'string', 'max:20'],

            'start_time' => [
                'required',
                'date_format:H:i',
                new NoMassTimeOverlap(
                    day: $this->day,
                    location: $this->location,
                    startTime: $this->start_time,
                    ignoreId: $massTimeId
                ),
            ],

            'location' => ['nullable', 'string', 'max:100'],
            'language' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],

            'status' => ['required', 'in:draft,published'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_time.required' => 'Please select a Start Time.',
        ];
    }
}
