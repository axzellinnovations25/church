<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParishInterestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration_id' => $this->registration_id,
            'volunteering' => (bool) $this->volunteering,
            'parish_groups' => (bool) $this->parish_groups,
            'sacramental_preparation' => (bool) $this->sacramental_preparation,
            'weekly_newsletter' => (bool) $this->weekly_newsletter,
        ];
    }
}
