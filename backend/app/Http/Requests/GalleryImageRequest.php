<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class GalleryImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && (bool) Auth::user()?->is_main_admin;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->titleCase($this->title),
            'caption' => $this->capitalizeFirst($this->caption),
        ]);
    }

    public function rules(): array
    {
        $galleryImage = $this->route('galleryImage') ?? $this->route('gallery_image');

        return [
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['required', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'image' => [
                $galleryImage ? 'nullable' : 'required',
                'file',
                'extensions:jpg,jpeg,jfif,png,webp',
                'max:5120',
            ],
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
                $validator->errors()->add('image', 'The gallery image must be a valid JPG, PNG, or WebP image.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'image.required' => 'Please upload a gallery image.',
            'image.file' => 'The gallery image must be a valid image file.',
            'image.extensions' => 'The gallery image must be a JPG, JFIF, PNG, or WebP image.',
            'image.max' => 'The gallery image must be 5MB or smaller.',
            'image.uploaded' => 'The gallery image must be 5MB or smaller.',
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
            "/\b(\p{Ll})([\p{L}\p{M}\p{N}_'â€™-]*)/u",
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
