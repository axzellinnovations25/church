<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\NoEventOverlap;
use Illuminate\Support\Facades\Auth;

class EventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->titleCase($this->title),
            'description' => $this->capitalizeFirst($this->description),
            'location' => $this->titleCase($this->location),
            'category' => $this->titleCase($this->category),
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
        $eventId = $this->route('event')?->id;

        return [
            'title' => ['required', 'string', 'max:255'],

            'description' => ['nullable', 'string'],

            'start_date' => [
                'required',
                'date',
                new NoEventOverlap($eventId),
            ],

            'start_time' => ['required', 'date_format:H:i'],
            'end_time'   => ['required', 'date_format:H:i'],

            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],

            'location' => ['nullable', 'string', 'max:255'],

            'status' => ['required', 'in:draft,published'],

            'category' => ['nullable', 'string', 'max:255'],

            'all_day' => ['nullable', 'boolean'],
            'image' => ['nullable', 'file', 'extensions:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->wordCount((string) $this->input('title')) > 50) {
                $validator->errors()->add('title', 'Title must be 50 words or fewer.');
            }

            if ($this->wordCount((string) $this->input('description')) > 250) {
                $validator->errors()->add('description', 'Description must be 250 words or fewer.');
            }

            if ($this->start_time && $this->end_time) {

                if ($this->end_time <= $this->start_time) {
                    $validator->errors()->add('end_time', 'End time must be after start time.');
                }
            }

            if (! $this->hasFile('image')) {
                return;
            }

            $image = $this->file('image');

            if (! $image || ! $image->isValid()) {
                return;
            }

            if (@getimagesize($image->getRealPath()) === false) {
                $validator->errors()->add('image', 'The event image must be a valid JPG, PNG, or WebP image.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'image.file' => 'The event image must be a valid image file.',
            'image.extensions' => 'The event image must be a JPG, PNG, or WebP image.',
            'image.max' => 'The event image must be 5MB or smaller.',
            'image.uploaded' => 'The event image must be 5MB or smaller.',
        ];
    }

    private function wordCount(string $value): int
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            return 0;
        }

        preg_match_all('/\S+/u', $trimmed, $matches);

        return count($matches[0]);
    }
}
