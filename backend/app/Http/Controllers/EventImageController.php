<?php

namespace App\Http\Controllers;

use App\Models\Event;

class EventImageController extends Controller
{
    public function show(Event $event)
    {
        abort_unless($event->image_path && ($event->status === 'published' || auth()->check()), 404);

        $path = storage_path("app/private/{$event->image_path}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => $this->contentTypeFor($path),
        ]);
    }

    private function contentTypeFor(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'image/png',
        };
    }
}
