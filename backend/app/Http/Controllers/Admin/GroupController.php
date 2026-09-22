<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GroupRequest;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $groups = Group::with([
            'users' => function ($query) {
                $query->select('id', 'name', 'email', 'group_id', 'is_main_admin')
                    ->where('is_main_admin', false)
                    ->orderBy('name');
            },
            'groupMembers' => function ($query) {
                $query->orderBy('name');
            },
        ])
            ->withCount('groupMembers')
            ->when(! $user->is_main_admin, fn ($query) => $query->whereKey($user->group_id))
            ->orderBy('name')
            ->get();

        $availableAdmins = $user->is_main_admin
            ? User::where('is_main_admin', false)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'group_id'])
            : collect();

        return response()->json([
            'groups' => $groups->map(fn (Group $group) => $this->serializeGroup($group, $request))->values()->all(),
            'available_admins' => $availableAdmins->map(fn (User $admin) => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'group_id' => $admin->group_id,
            ])->values()->all(),
        ]);
    }

    public function store(GroupRequest $request)
    {
        $validated = $request->validated();

        $group = Group::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        $this->assignAdminUser($validated['admin_user_id'] ?? null, $group);

        return response()->json([
            'message' => 'Group saved successfully.',
            'group' => $this->serializeGroup($group->fresh(['users', 'groupMembers'])->loadCount('groupMembers'), $request),
        ], 201);
    }

    public function edit(Request $request, Group $group)
    {
        $user = $request->user();

        if (! $user->is_main_admin && (int) $user->group_id !== (int) $group->id) {
            abort(403, 'You do not have access to this group.');
        }

        $group->loadMissing([
            'users' => fn ($query) => $query->select('id', 'name', 'email', 'group_id', 'is_main_admin')
                ->where('is_main_admin', false)
                ->orderBy('name'),
            'groupMembers' => fn ($query) => $query->orderBy('name'),
        ])->loadCount('groupMembers');

        return response()->json([
            'group' => $this->serializeGroup($group, $request),
        ]);
    }

    public function update(GroupRequest $request, Group $group)
    {
        $validated = $request->validated();

        $group->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        User::where('group_id', $group->id)
            ->where('is_main_admin', false)
            ->update(['group_id' => null]);

        $this->assignAdminUser($validated['admin_user_id'] ?? null, $group);

        return response()->json([
            'message' => 'Group updated successfully.',
            'group' => $this->serializeGroup($group->fresh(['users', 'groupMembers'])->loadCount('groupMembers'), $request),
        ]);
    }

    public function destroy(Request $request, Group $group)
    {
        User::where('group_id', $group->id)->update(['group_id' => null]);
        $group->delete();

        return response()->json([
            'message' => 'Group deleted successfully.',
        ]);
    }

    private function assignAdminUser(?int $userId, Group $group): void
    {
        if (! $userId) {
            return;
        }

        User::where('id', $userId)
            ->where('is_main_admin', false)
            ->update(['group_id' => $group->id]);
    }

    private function serializeGroup(Group $group, Request $request): array
    {
        $adminUser = $group->users->first();

        return [
            ...GroupResource::make($group)->resolve($request),
            'admin_user_id' => $adminUser?->id,
            'admin_user' => $adminUser ? [
                'id' => $adminUser->id,
                'name' => $adminUser->name,
                'email' => $adminUser->email,
            ] : null,
            'members_count' => $group->group_members_count ?? $group->groupMembers->count(),
            'members' => GroupMemberResource::collection($group->groupMembers)->resolve($request),
        ];
    }
}
