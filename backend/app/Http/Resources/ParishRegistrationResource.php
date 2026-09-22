<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParishRegistrationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member_id' => $this->member_id,
            'registration_type' => $this->registration_type,
            'full_name' => $this->full_name,
            'date_of_birth' => $this->date_of_birth,
            'gender' => $this->gender,
            'nationality' => $this->nationality,
            'occupation' => $this->occupation,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'postcode' => $this->postcode,
            'partner_name' => $this->partner_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'contact_by_phone' => (bool) $this->contact_by_phone,
            'contact_by_email' => (bool) $this->contact_by_email,
            'consent_confirmed' => (bool) $this->consent_confirmed,
            'signature' => $this->signature,
            'signed_date' => $this->signed_date,
            'children' => ParishChildResource::collection($this->whenLoaded('children')),
            'interest' => new ParishInterestResource($this->whenLoaded('interest')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
