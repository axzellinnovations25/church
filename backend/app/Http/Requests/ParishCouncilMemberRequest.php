<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class ParishCouncilMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->titleCase($this->name),
            'role' => $this->titleCase($this->role),
            'bio' => $this->capitalizeFirst($this->bio),
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
        $member = $this->route('parishCouncilMember');

        return [
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['nullable', 'boolean'],
            'photo' => [
                $member ? 'nullable' : 'required',
                'file',
                'max:5120',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->hasFile('photo')) {
                return;
            }

            $photo = $this->file('photo');

            if (! $photo || ! $photo->isValid()) {
                return;
            }

            $extension = strtolower($photo->getClientOriginalExtension());

            if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                $validator->errors()->add('photo', 'The member photo must be a JPG, PNG, or WebP image.');

                return;
            }

            if (@getimagesize($photo->getRealPath()) === false) {
                $validator->errors()->add('photo', 'The member photo must be a valid image file.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Please upload a member photo.',
            'photo.max' => 'The member photo must be 5MB or smaller.',
        ];
    }
}
