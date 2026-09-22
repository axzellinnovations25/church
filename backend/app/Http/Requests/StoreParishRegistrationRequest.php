<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreParishRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'nationality' => $this->titleCase($this->nationality),
            'occupation' => $this->titleCase($this->occupation),
            'address_line1' => $this->titleCase($this->address_line1),
            'address_line2' => $this->titleCase($this->address_line2),
            'city' => $this->titleCase($this->city),
            'phone' => is_string($this->phone) ? trim($this->phone) : $this->phone,
            'email' => is_string($this->email) ? strtolower(trim($this->email)) : $this->email,
            'postcode' => is_string($this->postcode) ? strtoupper(trim($this->postcode)) : $this->postcode,
            'partner_name' => $this->titleCase($this->partner_name),
            'signature' => $this->titleCase($this->signature),
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
            'registration_type' => ['required', 'string', 'in:individual,family'],
            'full_name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'string', 'in:male,female'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'address_line1' => ['required', 'string', 'min:5', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'postcode' => ['required', 'string', 'max:20', 'regex:/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/'],
            'phone' => ['required', 'string', 'min:7', 'max:25', 'regex:/^[0-9+\s().-]+$/'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'partner_name' => ['nullable', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'contact_by_phone' => ['sometimes', 'boolean'],
            'contact_by_email' => ['sometimes', 'boolean'],
            'consent_confirmed' => ['accepted'],
            'signature' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'signed_date' => ['required', 'date', 'before_or_equal:today'],
            'children' => ['sometimes', 'array'],
            'children.*.child_name' => ['required_with:children.*.date_of_birth', 'nullable', 'string', 'min:2', 'max:255', 'regex:/^[\pL\pM\s.\'-]+$/u'],
            'children.*.date_of_birth' => ['required_with:children.*.child_name', 'nullable', 'date', 'before_or_equal:today'],
            'interests' => ['sometimes', 'array'],
            'interests.volunteering' => ['sometimes', 'boolean'],
            'interests.parish_groups' => ['sometimes', 'boolean'],
            'interests.sacramental_preparation' => ['sometimes', 'boolean'],
            'interests.weekly_newsletter' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->registration_type === 'individual' && !empty($this->children)) {
                    $validator->errors()->add('children', 'Children can only be added for family registrations.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            '*.regex' => 'This field contains characters that are not allowed.',
            'postcode.regex' => 'Enter a valid UK postcode.',
            'phone.regex' => 'Phone number may only contain numbers, spaces, and common phone symbols.',
            'consent_confirmed.accepted' => 'Consent must be confirmed before registration.',
            'children.*.date_of_birth.before_or_equal' => 'Child date of birth cannot be in the future.',
        ];
    }
}
