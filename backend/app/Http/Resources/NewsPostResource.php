<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsPostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imagePath = $this->image_path ? storage_path("app/private/{$this->image_path}") : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'type' => $this->type,
            'summary' => $this->summary,
            'content' => $this->content,
            'published_at' => $this->published_at?->format('Y-m-d'),
            'status' => $this->status,
            'image_path' => $this->image_path,
            'image_url' => $this->image_path ? "/api/v1/news/{$this->id}/image" : null,
            'image_filename' => $this->image_path ? basename($this->image_path) : null,
            'image_size' => ($imagePath && is_file($imagePath)) ? filesize($imagePath) : null,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_user_name' => $this->whenLoaded('creator', fn () => $this->creator?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
