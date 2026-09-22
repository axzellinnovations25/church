<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->titleCase($this->name),
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
            'phone' => is_string($this->phone) ? trim($this->phone) : $this->phone,
            'subject' => $this->titleCase($this->subject),
            'category' => is_string($this->category) ? trim($this->category) : ($this->category ?: 'general'),
            'message' => $this->capitalizeFirst($this->message),
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
        return [
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'min:7', 'max:25', 'regex:/^[0-9+\s().-]+$/'],
            'subject' => ['required', 'string', 'min:3', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'group_id' => ['nullable', 'integer', 'exists:groups,id', 'required_if:category,group_join'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'Name may only contain letters, spaces, apostrophes, hyphens, and full stops.',
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Phone number may only contain numbers, spaces, and common phone symbols.',
            'message.min' => 'Message must be at least 10 characters.',
        ];
    }
}
