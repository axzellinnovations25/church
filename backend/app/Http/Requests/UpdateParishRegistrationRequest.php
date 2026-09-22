<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class UpdateParishRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    protected function prepareForValidation(): void
    {
        $children = collect($this->input('children', []))
            ->map(function ($child) {
                if (! is_array($child)) {
                    return $child;
                }

                $child['child_name'] = $this->titleCase($child['child_name'] ?? null);

                return $child;
            })
            ->all();

        $this->merge([
            'full_name' => $this->titleCase($this->full_name),
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
            'phone' => is_string($this->phone) ? trim($this->phone) : $this->phone,
            'partner_name' => $this->titleCase($this->partner_name),
            'children' => $children,
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

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'min:7', 'max:25', 'regex:/^[0-9+\s().-]+$/'],
            'partner_name' => ['nullable', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'children' => ['sometimes', 'array'],
            'children.*.child_name' => ['required_with:children.*.date_of_birth', 'nullable', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'children.*.date_of_birth' => ['required_with:children.*.child_name', 'nullable', 'date', 'before_or_equal:today'],
            'volunteering' => ['sometimes', 'boolean'],
            'parish_groups' => ['sometimes', 'boolean'],
            'sacramental_preparation' => ['sometimes', 'boolean'],
            'weekly_newsletter' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $registration = $this->route('parishRegistration');

                if ($registration?->registration_type === 'individual' && !empty($this->children)) {
                    $validator->errors()->add('children', 'Children can only be added for family registrations.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            '*.regex' => 'This field contains characters that are not allowed.',
            'phone.regex' => 'Phone number may only contain numbers, spaces, and common phone symbols.',
            'children.*.date_of_birth.before_or_equal' => 'Child date of birth cannot be in the future.',
        ];
    }
}
