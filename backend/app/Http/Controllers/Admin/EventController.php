<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;          // Base controller class
use App\Http\Resources\EventResource;
use App\Models\Event;                         // Our Event model (database table)
use App\Http\Requests\EventRequest;           // Event validation request (clash prevention)
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    /**
     * Display a list of events (Admin: /admin/events).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get events from database, newest first (latest created at top)
        $events = (! $user->is_main_admin && ! $user->group_id)
            ? collect()
            : Event::with(['group', 'creator'])
                ->when(! $user->is_main_admin, fn ($query) => $query->where('group_id', $user->group_id))
                ->orderBy('start_date', 'desc')
                ->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'events' => EventResource::collection(collect($events->items()))->resolve($request),
                'meta' => [
                    'current_page' => $events->currentPage(),
                    'last_page' => $events->lastPage(),
                    'per_page' => $events->perPage(),
                    'total' => $events->total(),
                ],
            ]);
        }

        // Return the admin list page and pass the events data to it
        return view('admin.events.index', compact('events'));
    }

    /**
     * Show the form to create a new event (Admin: /admin/events/create).
     */
    public function create()
    {
        // Just show the create form page
        return view('admin.events.create');
    }

    /**
     * Store a newly created event in the database (POST /admin/events).
     */
    public function store(EventRequest $request)
    {
        $user = $request->user();
        // Validate input coming from the create form (security + correctness)
        $validated = $request->validated();

        // If event is marked as all day, set full-day time range
        if ($request->boolean('all_day')) {
            $validated['start_time'] = '00:00';
            $validated['end_time'] = '23:59';
        }

        // Capitalise selected fields
        $validated['title'] = ucfirst(strtolower($validated['title']));

        if (!empty($validated['location'])) {
            $validated['location'] = ucfirst(strtolower($validated['location']));
        }

        if (!empty($validated['category'])) {
            $validated['category'] = ucfirst(strtolower($validated['category']));
        }

        if ($user->is_main_admin) {
            $validated['status'] = $validated['status'] ?? 'published';
            $validated['group_id'] = $validated['group_id'] ?? null;
        } else {
            abort_if(! $user->group_id, 403, 'Your account has not been assigned to a group yet.');
            $validated['status'] = 'draft';
            $validated['group_id'] = $user->group_id;
        }

        $validated['created_by_user_id'] = $user->id;
        $validated['image_path'] = $request->hasFile('image') ? $this->storeImage($request) : null;

        // Create the event in the database using validated data
        $event = Event::create($validated);
        Audit::log($request, 'created event', $event, $event->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Event created successfully.',
                'event' => EventResource::make($event)->resolve($request),
            ], 201);
        }

        // Redirect back to events list with a success message
        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event created successfully.');
    }

    /**
     * Display a single event (Admin: /admin/events/{event}).
     * (Optional - we may not use this much, but resource route includes it.)
     */
    public function show(Event $event)
    {
        // Show a simple view page for one event (we will create it if needed)
        return view('admin.events.show', compact('event'));
    }

    /**
     * Show the form to edit an existing event (Admin: /admin/events/{event}/edit).
     */
    public function edit(Request $request, Event $event)
    {
        $this->authorizeEventAccess($request, $event);

        if ($request->expectsJson()) {
            return response()->json([
                'event' => EventResource::make($event->loadMissing(['group', 'creator']))->resolve($request),
            ]);
        }

        // Show edit form and send the selected event data
        return view('admin.events.edit', compact('event'));
    }

    /**
     * Update an existing event (PUT/PATCH /admin/events/{event}).
     */
    public function update(EventRequest $request, Event $event)
    {
        $user = $request->user();
        $this->authorizeEventAccess($request, $event);

        // Validate input coming from the edit form
        $validated = $request->validated();

        // If event is marked as all day, set full-day time range
        if ($request->boolean('all_day')) {
            $validated['start_time'] = '00:00';
            $validated['end_time'] = '23:59';
        }

        // Capitalise fields
        $validated['title'] = ucfirst(strtolower($validated['title']));

        if (!empty($validated['location'])) {
            $validated['location'] = ucfirst(strtolower($validated['location']));
        }

        if (!empty($validated['category'])) {
            $validated['category'] = ucfirst(strtolower($validated['category']));
        }

        if ($user->is_main_admin) {
            $validated['status'] = $validated['status'] ?? $event->status;
        } else {
            $validated['status'] = 'draft';
            $validated['group_id'] = $user->group_id;
            $validated['created_by_user_id'] = $event->created_by_user_id ?: $user->id;
        }

        if ($request->boolean('remove_image') && $event->image_path) {
            $this->deleteImage($event->image_path);
            $validated['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteImage($event->image_path);
            $validated['image_path'] = $this->storeImage($request);
        }

        // Update the event using validated data
        $event->update($validated);
        Audit::log($request, 'updated event', $event, $event->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Event updated successfully.',
                'event' => EventResource::make($event->fresh())->resolve($request),
            ]);
        }

        // Redirect back to list with success message
        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event updated successfully.');
    }

    /**
     * Return events for a selected date (used in create/edit preview box).
     */
    public function byDate(Request $request)
    {
        // Get date from query string
        $date = $request->query('date');

        if (!$date) {
            return response()->json([]);
        }

        // Get events that are happening on that date (including multi-day events)
        $events = Event::whereDate('start_date', '<=', $date)
            ->whereRaw("COALESCE(end_date, start_date) >= ?", [$date])
            ->orderByRaw("COALESCE(start_time, '00:00') ASC")
            ->get(['id', 'title', 'start_date', 'start_time', 'end_date', 'end_time']);

        return response()->json($events);
    }

    public function image(Request $request, Event $event)
    {
        $this->authorizeEventAccess($request, $event);
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

    /**
     * Delete an event (DELETE /admin/events/{event}).
     */
    public function destroy(Request $request, Event $event)
    {
        $this->authorizeEventAccess($request, $event);
        $this->deleteImage($event->image_path);
        $eventTitle = $event->title;

        // Delete the selected event from database
        $event->delete();
        Audit::log($request, 'deleted event', $event, $eventTitle);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Event deleted successfully.',
            ]);
        }

        // Redirect back with success message
        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event deleted successfully.');
    }

    private function authorizeEventAccess(Request $request, Event $event): void
    {
        $user = $request->user();

        if (! $user->is_main_admin && $event->group_id !== $user->group_id) {
            abort(403, 'You do not have access to this event.');
        }
    }

    private function storeImage(EventRequest $request): string
    {
        $image = $request->file('image');
        $extension = strtolower($image->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;
        $path = "events/{$filename}";
        $directory = storage_path('app/private/events');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        copy($image->getRealPath(), storage_path("app/private/{$path}"));

        return $path;
    }

    private function deleteImage(?string $path): void
    {
        if (! $path) {
            return;
        }

        $fullPath = storage_path("app/private/{$path}");

        if (is_file($fullPath)) {
            unlink($fullPath);
        }
    }
}
