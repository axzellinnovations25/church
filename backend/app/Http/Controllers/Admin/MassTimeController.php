<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MassTimeRequest;
use App\Http\Resources\MassTimeResource;
use App\Models\MassTime;
use Illuminate\Http\Request;

class MassTimeController extends Controller
{
    public function index(Request $request)
    {
        $dayOrderSql = "
            CASE day
                WHEN 'Sunday' THEN 1
                WHEN 'Monday' THEN 2
                WHEN 'Tuesday' THEN 3
                WHEN 'Wednesday' THEN 4
                WHEN 'Thursday' THEN 5
                WHEN 'Friday' THEN 6
                WHEN 'Saturday' THEN 7
                ELSE 8
            END
        ";

        $massTimes = MassTime::orderByRaw($dayOrderSql)
            ->orderBy('start_time')
            ->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'mass_times' => MassTimeResource::collection(collect($massTimes->items()))->resolve($request),
                'meta' => [
                    'current_page' => $massTimes->currentPage(),
                    'last_page' => $massTimes->lastPage(),
                    'per_page' => $massTimes->perPage(),
                    'total' => $massTimes->total(),
                ],
            ]);
        }

        return view('admin.mass-times.index', compact('massTimes'));
    }

    public function create()
    {
        return view('admin.mass-times.create');
    }

    public function store(MassTimeRequest $request)
    {
        $massTime = MassTime::create($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Mass time created successfully.',
                'mass_time' => MassTimeResource::make($massTime)->resolve($request),
            ], 201);
        }

        return redirect()
            ->route('admin.mass-times.index')
            ->with('success', 'Mass time created successfully.');
    }

    public function edit(Request $request, MassTime $massTime)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'mass_time' => MassTimeResource::make($massTime)->resolve($request),
            ]);
        }

        return view('admin.mass-times.edit', compact('massTime'));
    }

    public function update(MassTimeRequest $request, MassTime $massTime)
    {
        $massTime->update($request->validated());

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Mass time updated successfully.',
                'mass_time' => MassTimeResource::make($massTime)->resolve($request),
            ]);
        }

        return redirect()
            ->route('admin.mass-times.index')
            ->with('success', 'Mass time updated successfully.');
    }

    public function destroy(Request $request, MassTime $massTime)
    {
        $massTime->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Mass time deleted successfully.',
            ]);
        }

        return redirect()
            ->route('admin.mass-times.index')
            ->with('success', 'Mass time deleted successfully.');
    }

    public function byDay(Request $request)
    {
        $day = $request->query('day');
        $location = $request->query('location');

        $massTimes = MassTime::query()
            ->when($day, fn($q) => $q->where('day', $day))
            ->when($location, fn($q) => $q->where('location', $location))
            ->orderBy('start_time')
            ->get(['id', 'day', 'location', 'start_time', 'language'])
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'day' => $m->day,
                    'location' => $m->location,
                    'start_time' => \Carbon\Carbon::parse($m->start_time)->format('H:i'),
                    'language' => $m->language,
                ];
            });

        return response()->json($massTimes);
    }
}
