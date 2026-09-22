<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParishCouncilMemberRequest;
use App\Http\Resources\ParishCouncilMemberResource;
use App\Models\ParishCouncilMember;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ParishCouncilMemberController extends Controller
{
    public function index(Request $request)
    {
        $members = ParishCouncilMember::orderByRaw('CASE WHEN sort_order <= 0 THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(10);

        return response()->json([
            'members' => ParishCouncilMemberResource::collection(collect($members->items()))->resolve($request),
            'meta' => [
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
            ],
        ]);
    }

    public function store(ParishCouncilMemberRequest $request)
    {
        $validated = $request->validated();
        $photoData = $this->storePhoto($request);

        $member = ParishCouncilMember::create([
            'name' => $validated['name'],
            'role' => $validated['role'],
            'bio' => $validated['bio'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            ...$photoData,
        ]);

        return response()->json([
            'message' => 'Parish council member saved successfully.',
            'member' => ParishCouncilMemberResource::make($member)->resolve($request),
        ], 201);
    }

    public function edit(Request $request, ParishCouncilMember $parishCouncilMember)
    {
        return response()->json([
            'member' => ParishCouncilMemberResource::make($parishCouncilMember)->resolve($request),
        ]);
    }

    public function photo(ParishCouncilMember $parishCouncilMember)
    {
        $path = storage_path("app/private/{$parishCouncilMember->photo_path}");
        abort_unless($parishCouncilMember->photo_path && is_file($path), 404);

        return response()->file($path);
    }

    public function update(ParishCouncilMemberRequest $request, ParishCouncilMember $parishCouncilMember)
    {
        $validated = $request->validated();

        $data = [
            'name' => $validated['name'],
            'role' => $validated['role'],
            'bio' => $validated['bio'] ?? null,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ];

        if ($request->hasFile('photo')) {
            $this->deletePhoto($parishCouncilMember->photo_path);
            $data = [
                ...$data,
                ...$this->storePhoto($request),
            ];
        }

        $parishCouncilMember->update($data);

        return response()->json([
            'message' => 'Parish council member updated successfully.',
            'member' => ParishCouncilMemberResource::make($parishCouncilMember->fresh())->resolve($request),
        ]);
    }

    public function destroy(Request $request, ParishCouncilMember $parishCouncilMember)
    {
        $this->deletePhoto($parishCouncilMember->photo_path);
        $parishCouncilMember->delete();

        return response()->json([
            'message' => 'Parish council member deleted successfully.',
        ]);
    }

    private function storePhoto(ParishCouncilMemberRequest $request): array
    {
        $photo = $request->file('photo');
        $extension = strtolower($photo->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;
        $path = "parish-council-members/{$filename}";
        $directory = storage_path('app/private/parish-council-members');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        copy($photo->getRealPath(), storage_path("app/private/{$path}"));

        return [
            'photo_path' => $path,
            'photo_filename' => $photo->getClientOriginalName(),
            'photo_size' => $photo->getSize() ?: 0,
        ];
    }

    private function deletePhoto(?string $path): void
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
