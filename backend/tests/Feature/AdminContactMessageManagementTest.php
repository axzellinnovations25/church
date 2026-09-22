<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminContactMessageManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_main_admin_can_delete_a_contact_message(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $message = ContactMessage::create([
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'subject' => 'Question',
            'message' => 'Hello there',
        ]);

        $response = $this->actingAs($admin)->deleteJson("/admin/contact-messages/{$message->id}");

        $response->assertOk();
        $response->assertJsonPath('message', 'Contact message deleted successfully.');
        $this->assertDatabaseMissing('contact_messages', [
            'id' => $message->id,
        ]);
    }

    public function test_group_admin_can_update_status_for_their_contact_message(): void
    {
        $group = Group::create([
            'name' => 'Youth Group',
            'slug' => 'youth-group',
            'is_active' => true,
        ]);

        $groupAdmin = User::factory()->create([
            'is_main_admin' => false,
            'group_id' => $group->id,
        ]);

        $message = ContactMessage::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'subject' => 'Help',
            'category' => 'general',
            'status' => 'new',
            'message' => 'Please call me back',
            'group_id' => $group->id,
        ]);

        $response = $this->actingAs($groupAdmin)->patchJson("/admin/contact-messages/{$message->id}", [
            'status' => 'resolved',
        ]);

        $response->assertOk();
        $response->assertJsonPath('contact_message.status', 'resolved');
        $this->assertDatabaseHas('contact_messages', [
            'id' => $message->id,
            'status' => 'resolved',
        ]);
    }

    public function test_group_admin_cannot_delete_a_contact_message(): void
    {
        $group = Group::create([
            'name' => 'Youth Group',
            'slug' => 'youth-group',
            'is_active' => true,
        ]);

        $groupAdmin = User::factory()->create([
            'is_main_admin' => false,
            'group_id' => $group->id,
        ]);

        $message = ContactMessage::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'subject' => 'Help',
            'message' => 'Please call me back',
            'group_id' => $group->id,
        ]);

        $response = $this->actingAs($groupAdmin)->deleteJson("/admin/contact-messages/{$message->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('contact_messages', [
            'id' => $message->id,
        ]);
    }
}
