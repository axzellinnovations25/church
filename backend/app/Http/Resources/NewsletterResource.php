<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsletterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'publication_date' => $this->publication_date,
            'description' => $this->description,
            'original_filename' => $this->original_filename,
            'file_size' => $this->file_size,
            'status' => $this->status,
            'is_future' => (bool) $this->is_future,
            'is_due_for_publication' => (bool) $this->is_due_for_publication,
            'publishes_within_one_week' => (bool) $this->publishes_within_one_week,
            'view_url' => "/newsletters/{$this->id}/view",
            'download_url' => "/newsletters/{$this->id}/download",
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
