<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
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
            'description' => $this->description,
            'start_date' => $this->start_date,
            'start_time' => $this->start_time,
            'end_date' => $this->end_date,
            'end_time' => $this->end_time,
            'location' => $this->location,
            'status' => $this->status,
            'category' => $this->category,
            'image_path' => $this->image_path,
            'image_url' => $hasImage ? "/api/v1/events/{$this->id}/image" : null,
            'admin_image_url' => $hasImage ? "/admin/events/{$this->id}/image" : null,
            'image_filename' => $this->image_path ? basename($this->image_path) : null,
            'image_size' => $hasImage ? filesize($imagePath) : null,
            'group_id' => $this->group_id,
            'group_name' => $this->whenLoaded('group', fn () => $this->group?->name),
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_user_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
