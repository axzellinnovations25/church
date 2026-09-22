<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class NewsPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && (bool) Auth::user()?->is_main_admin;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->titleCase($this->title),
            'summary' => $this->capitalizeFirst($this->summary),
            'content' => $this->capitalizeFirst($this->content),
            'type' => is_string($this->type) ? strtolower(trim($this->type)) : $this->type,
        ]);
    }

    public function rules(): array
    {
        $newsPost = $this->route('news_post') ?? $this->route('newsPost');

        return [
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'type' => ['required', Rule::in(['news', 'announcement'])],
            'summary' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string', 'max:10000'],
            'published_at' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'image' => [
                $newsPost ? 'nullable' : 'nullable',
                'file',
                'extensions:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'remove_image' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (! $this->hasFile('image')) {
                return;
            }

            $image = $this->file('image');

            if (! $image || ! $image->isValid()) {
                return;
            }

            if (@getimagesize($image->getRealPath()) === false) {
                $validator->errors()->add('image', 'The news image must be a valid JPG, PNG, or WebP image.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'image.file' => 'The news image must be a valid image file.',
            'image.extensions' => 'The news image must be a JPG, PNG, or WebP image.',
            'image.max' => 'The news image must be 2MB or smaller.',
            'image.uploaded' => 'The news image must be 2MB or smaller.',
        ];
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
}
