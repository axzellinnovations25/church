<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Support\ImageStorage;
use Illuminate\Http\Request;

class EventImageController extends Controller
{
    public function show(Request $request, Event $event)
    {
        abort_unless($event->image_path && ($event->status === 'published' || $event->canBeManagedBy($request->user())), 404);

        return ImageStorage::serve($event->image_path, $event->status === 'published');
    }
}
