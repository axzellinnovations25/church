<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imagePath = $this->image_path ? storage_path("app/private/{$this->image_path}") : null;
        $hasImage = $imagePath && is_file($imagePath);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'image_url' => $hasImage ? "/api/v1/gallery-images/{$this->id}/image" : null,
            'admin_image_url' => $hasImage ? "/admin/gallery-images/{$this->id}/image" : null,
            'image_filename' => $this->image_filename,
            'image_size' => $hasImage ? filesize($imagePath) : $this->image_size,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_user_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
