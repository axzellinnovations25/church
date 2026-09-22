<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class NewsletterRequest extends FormRequest
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

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $newsletter = $this->route('newsletter');

        return [
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'publication_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'pdf' => [
                $newsletter ? 'nullable' : 'required',
                'file',
                'extensions:pdf',
                'max:20480',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $publicationDate = $this->input('publication_date');
            $status = $this->input('status');

            if ($publicationDate && $status === 'published') {
                $date = Carbon::parse($publicationDate)->startOfDay();

                if ($date->greaterThan(now()->startOfDay())) {
                    $validator->errors()->add('status', 'Future-dated newsletters must be saved as drafts. They will publish automatically on the publication date.');
                }
            }

            if (! $this->hasFile('pdf')) {
                return;
            }

            $file = $this->file('pdf');

            if (! $file || ! $file->isValid()) {
                return;
            }

            $handle = @fopen($file->getRealPath(), 'rb');

            if (! $handle) {
                $validator->errors()->add('pdf', 'The newsletter file could not be read.');
                return;
            }

            $signature = fread($handle, 5);
            fclose($handle);

            if ($signature !== '%PDF-') {
                $validator->errors()->add('pdf', 'The newsletter file must be a valid PDF.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'pdf.required' => 'Please upload a newsletter PDF.',
            'pdf.extensions' => 'The newsletter file must use the .pdf extension.',
            'pdf.max' => 'The newsletter PDF must be 20MB or smaller.',
        ];
    }
}
