<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventApiController extends Controller
{
    /**
     * --------------------------------------------------------------------------
     * GET /api/v1/events
     * --------------------------------------------------------------------------
     * Returns a list of published events.
     * Used by the public website (React frontend).
     */

    public function index(Request $request): JsonResponse
    {
        // Fetch published events ordered by upcoming date and time

        $events = Event::query()
            ->with('group')
            ->where('status', 'published')        // Only published events
            ->orderBy('start_date', 'asc')        // Upcoming events first
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($events)->resolve($request),
        ]);
    }


    /**
     * --------------------------------------------------------------------------
     * GET /api/v1/events/{id}
     * --------------------------------------------------------------------------
     * Returns a single published event.
     */

    public function show(Request $request, int $id): JsonResponse
    {
        // Find the event only if it is published

        $event = Event::query()
            ->with('group')
            ->where('id', $id)
            ->where('status', 'published')
            ->first();

        // Return 404 if event does not exist

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event not found'
            ], 404);
        }

        // Return event data

        return response()->json([
            'success' => true,
            'data' => EventResource::make($event)->resolve($request),
        ]);
    }

    public function image(Request $request, int $id)
    {
        $event = Event::query()->find($id);

        abort_unless($event && ($event->status === 'published' || $request->user()), 404);
        abort_unless($event->image_path, 404);

        $path = storage_path("app/private/{$event->image_path}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            },
        ]);
    }
}
