<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateParishRegistrationRequest;
use App\Http\Resources\ParishRegistrationResource;
use App\Models\ParishRegistration;
use App\Support\Audit;
use Illuminate\Http\Request;

class ParishRegistrationController extends Controller
{
    // added: show all registrations
    public function index(Request $request)
    {
        $registrations = ParishRegistration::with(['children', 'interest'])->latest()->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'registrations' => ParishRegistrationResource::collection(collect($registrations->items()))->resolve($request),
                'meta' => [
                    'current_page' => $registrations->currentPage(),
                    'last_page' => $registrations->lastPage(),
                    'per_page' => $registrations->perPage(),
                    'total' => $registrations->total(),
                ],
            ]);
        }

        return view('admin.parish-registrations.index', compact('registrations'));
    }

    // added: show one registration with children and interests
    public function show(Request $request, ParishRegistration $parishRegistration)
    {
        $parishRegistration->load(['children', 'interest']);

        if ($request->expectsJson()) {
            return response()->json([
                'registration' => ParishRegistrationResource::make($parishRegistration)->resolve($request),
            ]);
        }

        return view('admin.parish-registrations.show', compact('parishRegistration'));
    }

    // added: delete registration with children and interest
    public function destroy(Request $request, ParishRegistration $parishRegistration)
    {
        $registrationName = $parishRegistration->full_name;
        // delete children first
        $parishRegistration->children()->delete();

        // delete interest
        if ($parishRegistration->interest) {
            $parishRegistration->interest()->delete();
        }

        // delete main record
        $parishRegistration->delete();
        Audit::log($request, 'deleted registration', $parishRegistration, $registrationName);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Registration deleted successfully.',
            ]);
        }

        return redirect()
            ->route('admin.parish-registrations.index')
            ->with('success', 'Registration deleted successfully.');
    }

    // added: show edit form with children + interest
    public function edit(Request $request, ParishRegistration $parishRegistration)
    {
        $parishRegistration->load('children', 'interest');

        if ($request->expectsJson()) {
            return response()->json([
                'registration' => ParishRegistrationResource::make($parishRegistration)->resolve($request),
            ]);
        }

        return view('admin.parish-registrations.edit', compact('parishRegistration'));
    }

    // added: update registration
    public function update(UpdateParishRegistrationRequest $request, ParishRegistration $parishRegistration)
    {
        $validated = $request->validated();

        // update main details
        $parishRegistration->update([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'partner_name' => $validated['partner_name'] ?? null,
        ]);

        // update children (simple: delete + re-add)
        $parishRegistration->children()->delete();

        if (!empty($validated['children'])) {
            foreach ($validated['children'] as $child) {
                if (!empty($child['child_name'])) {
                    $parishRegistration->children()->create([
                        'child_name' => $child['child_name'],
                        'date_of_birth' => $child['date_of_birth'] ?? null,
                        'age' => $child['age'] ?? null,
                    ]);
                }
            }
        }

        // update interests
        $parishRegistration->interest()->updateOrCreate(
            ['registration_id' => $parishRegistration->id],
            [
                'volunteering' => (bool) ($validated['volunteering'] ?? false),
                'parish_groups' => (bool) ($validated['parish_groups'] ?? false),
                'sacramental_preparation' => (bool) ($validated['sacramental_preparation'] ?? false),
                'weekly_newsletter' => (bool) ($validated['weekly_newsletter'] ?? false),
            ],
        );
        Audit::log($request, 'updated registration', $parishRegistration, $parishRegistration->full_name);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Registration updated successfully.',
                'registration' => ParishRegistrationResource::make($parishRegistration->fresh()->load('children', 'interest'))->resolve($request),
            ]);
        }

        return redirect()
            ->route('admin.parish-registrations.show', $parishRegistration)
            ->with('success', 'Registration updated successfully.');
    }

}
