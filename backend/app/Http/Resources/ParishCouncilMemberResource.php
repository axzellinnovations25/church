<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParishCouncilMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $photoPath = $this->photo_path ? storage_path("app/private/{$this->photo_path}") : null;
        $hasPhoto = $photoPath && is_file($photoPath);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->role,
            'bio' => $this->bio,
            'photo_url' => $hasPhoto ? "/api/v1/parish-council-members/{$this->id}/photo" : null,
            'admin_photo_url' => $hasPhoto ? "/admin/parish-council-members/{$this->id}/photo" : null,
            'photo_filename' => $this->photo_filename,
            'photo_size' => $hasPhoto ? filesize($photoPath) : null,
            'sort_order' => $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
