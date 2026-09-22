<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GroupMemberRequest;
use App\Http\Resources\GroupMemberResource;
use App\Models\Group;
use App\Models\GroupMember;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class GroupMemberController extends Controller
{
    public function store(GroupMemberRequest $request, Group $group): JsonResponse
    {
        $this->authorizeGroupAccess($request, $group);
        $validated = $request->validated();
        $this->ensureMemberIsUnique($group, $validated);

        $member = $group->groupMembers()->create([
            ...$validated,
            'created_by_user_id' => $request->user()->id,
        ]);
        Audit::log($request, 'created group member', $member, $member->name, ['group' => $group->name]);

        return response()->json([
            'message' => 'Group member saved successfully.',
            'member' => GroupMemberResource::make($member->loadMissing('group'))->resolve($request),
        ], 201);
    }

    public function update(GroupMemberRequest $request, Group $group, GroupMember $groupMember): JsonResponse
    {
        $this->authorizeGroupAccess($request, $group);
        $this->ensureMemberBelongsToGroup($group, $groupMember);
        $validated = $request->validated();

        if (! $request->user()->is_main_admin) {
            $validated = [
                ...$validated,
                'name' => $groupMember->name,
                'email' => $groupMember->email,
                'phone' => $groupMember->phone,
            ];
        }

        $this->ensureMemberIsUnique($group, $validated, $groupMember->id);

        $groupMember->update($request->user()->is_main_admin ? $validated : [
            'role' => $validated['role'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);
        Audit::log($request, 'updated group member', $groupMember, $groupMember->name, ['group' => $group->name]);

        return response()->json([
            'message' => 'Group member updated successfully.',
            'member' => GroupMemberResource::make($groupMember->fresh()->loadMissing('group'))->resolve($request),
        ]);
    }

    public function destroy(Request $request, Group $group, GroupMember $groupMember): JsonResponse
    {
        $this->authorizeGroupAccess($request, $group);
        $this->ensureMemberBelongsToGroup($group, $groupMember);
        $memberName = $groupMember->name;

        $groupMember->delete();
        Audit::log($request, 'deleted group member', $groupMember, $memberName, ['group' => $group->name]);

        return response()->json([
            'message' => 'Group member deleted successfully.',
        ]);
    }

    private function authorizeGroupAccess(Request $request, Group $group): void
    {
        $user = $request->user();

        if (! $user->is_main_admin && (int) $user->group_id !== (int) $group->id) {
            abort(403, 'You do not have access to this group.');
        }
    }

    private function ensureMemberBelongsToGroup(Group $group, GroupMember $groupMember): void
    {
        if ((int) $groupMember->group_id !== (int) $group->id) {
            abort(404);
        }
    }

    private function ensureMemberIsUnique(Group $group, array $data, ?int $ignoreMemberId = null): void
    {
        $query = $group->groupMembers()
            ->when($ignoreMemberId, fn ($memberQuery) => $memberQuery->where('id', '!=', $ignoreMemberId))
            ->where(function ($memberQuery) use ($data) {
                if (! empty($data['email'])) {
                    $memberQuery->orWhere('email', strtolower($data['email']));
                }

                if (! empty($data['phone'])) {
                    $memberQuery->orWhere('phone', $data['phone']);
                }

                if (! empty($data['name'])) {
                    $memberQuery->orWhere('name', $data['name']);
                }
            });

        if (! $query->exists()) {
            return;
        }

        throw ValidationException::withMessages([
            'name' => ['This person is already in this group.'],
        ]);
    }
}
