<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupMemberManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_admin_can_view_and_create_members_for_their_own_group(): void
    {
        $group = Group::create([
            'name' => 'Ushers',
            'slug' => 'ushers',
            'is_active' => true,
        ]);

        $admin = User::factory()->create([
            'group_id' => $group->id,
            'is_main_admin' => false,
        ]);

        GroupMember::create([
            'group_id' => $group->id,
            'name' => 'Mary Helper',
        ]);

        $indexResponse = $this->actingAs($admin)->getJson('/admin/groups');

        $indexResponse->assertOk();
        $indexResponse->assertJsonCount(1, 'groups');
        $indexResponse->assertJsonPath('groups.0.name', 'Ushers');
        $indexResponse->assertJsonPath('groups.0.members.0.name', 'Mary Helper');

        $storeResponse = $this->actingAs($admin)->postJson("/admin/groups/{$group->id}/members", [
            'name' => 'Paul Reader',
            'email' => 'paul@example.com',
            'role' => 'Volunteer',
        ]);

        $storeResponse->assertCreated();
        $storeResponse->assertJsonPath('member.name', 'Paul Reader');
        $this->assertDatabaseHas('group_members', [
            'group_id' => $group->id,
            'name' => 'Paul Reader',
            'email' => 'paul@example.com',
        ]);
    }

    public function test_main_admin_can_see_members_across_all_groups(): void
    {
        $mainAdmin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $choir = Group::create([
            'name' => 'Choir',
            'slug' => 'choir',
            'is_active' => true,
        ]);

        $lectors = Group::create([
            'name' => 'Lectors',
            'slug' => 'lectors',
            'is_active' => true,
        ]);

        GroupMember::create([
            'group_id' => $choir->id,
            'name' => 'Anna Singer',
        ]);

        GroupMember::create([
            'group_id' => $lectors->id,
            'name' => 'James Reader',
        ]);

        $response = $this->actingAs($mainAdmin)->getJson('/admin/groups');

        $response->assertOk();
        $response->assertJsonCount(2, 'groups');
        $response->assertJsonPath('groups.0.members_count', 1);
        $response->assertJsonPath('groups.1.members_count', 1);
    }

    public function test_group_admin_cannot_manage_members_for_a_different_group(): void
    {
        $ownGroup = Group::create([
            'name' => 'Welcomers',
            'slug' => 'welcomers',
            'is_active' => true,
        ]);

        $otherGroup = Group::create([
            'name' => 'Servers',
            'slug' => 'servers',
            'is_active' => true,
        ]);

        $admin = User::factory()->create([
            'group_id' => $ownGroup->id,
            'is_main_admin' => false,
        ]);

        $response = $this->actingAs($admin)->postJson("/admin/groups/{$otherGroup->id}/members", [
            'name' => 'Blocked Member',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('group_members', [
            'group_id' => $otherGroup->id,
            'name' => 'Blocked Member',
        ]);
    }
}
