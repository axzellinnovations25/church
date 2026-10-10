<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParishCouncilMemberRequest;
use App\Http\Resources\ParishCouncilMemberResource;
use App\Models\ParishCouncilMember;
use Illuminate\Http\Request;
use App\Support\Audit;
use App\Support\ImageStorage;

class ParishCouncilMemberController extends Controller
{
    public function index(Request $request)
    {
        $members = ParishCouncilMember::orderByRaw('CASE WHEN sort_order <= 0 THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->orderBy('id')->paginate(10);

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

        Audit::log($request, 'created parish council member', $member, $member->name);

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
        abort_unless($parishCouncilMember->photo_path, 404);
        return ImageStorage::serve($parishCouncilMember->photo_path);
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

        $oldPhotoPath = $parishCouncilMember->photo_path;
        if ($request->hasFile('photo')) {
            $data = [
                ...$data,
                ...$this->storePhoto($request),
            ];
        }

        $parishCouncilMember->update($data);
        if ($request->hasFile('photo')) {
            rescue(fn () => $this->deletePhoto($oldPhotoPath), report: true);
        }

        Audit::log($request, 'updated parish council member', $parishCouncilMember, $parishCouncilMember->name);

        return response()->json([
            'message' => 'Parish council member updated successfully.',
            'member' => ParishCouncilMemberResource::make($parishCouncilMember->fresh())->resolve($request),
        ]);
    }

    public function destroy(Request $request, ParishCouncilMember $parishCouncilMember)
    {
        $this->deletePhoto($parishCouncilMember->photo_path);
        $parishCouncilMember->delete();

        Audit::log($request, 'deleted parish council member', $parishCouncilMember, $parishCouncilMember->name);

        return response()->json([
            'message' => 'Parish council member deleted successfully.',
        ]);
    }

    private function storePhoto(ParishCouncilMemberRequest $request): array
    {
        $photo = $request->file('photo');
        $path = ImageStorage::store($photo, 'parish-council-members');

        return [
            'photo_path' => $path,
            'photo_filename' => $photo->getClientOriginalName(),
            'photo_size' => $photo->getSize() ?: 0,
        ];
    }

    private function deletePhoto(?string $path): void
    {
        ImageStorage::delete($path);
    }
}
