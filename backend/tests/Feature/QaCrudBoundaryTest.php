<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\MassTime;
use App\Models\NewsPost;
use App\Models\ParishRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QaCrudBoundaryTest extends TestCase
{
    use RefreshDatabase;

    private function group(string $name): Group
    {
        return Group::create(['name' => $name, 'slug' => strtolower($name), 'is_active' => true]);
    }

    public function test_registration_missing_ids_and_group_role_are_rejected(): void
    {
        $main = User::factory()->create(['is_main_admin' => true]);
        $group = $this->group('Choir');
        $groupUser = User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $registration = ParishRegistration::factory()->create();
        $this->actingAs($main);
        $this->getJson('/admin/parish-registrations/999999')->assertNotFound();
        $this->putJson('/admin/parish-registrations/999999', [])->assertNotFound();
        $this->deleteJson('/admin/parish-registrations/999999')->assertNotFound();
        $this->actingAs($groupUser);
        $this->getJson('/admin/parish-registrations')->assertForbidden();
        $this->getJson('/admin/parish-registrations/'.$registration->id)->assertForbidden();
        $this->getJson('/admin/parish-registrations/'.$registration->id.'/edit')->assertForbidden();
        $this->putJson('/admin/parish-registrations/'.$registration->id, [])->assertForbidden();
        $this->deleteJson('/admin/parish-registrations/'.$registration->id)->assertForbidden();
        $this->assertDatabaseHas('parish_registrations', ['id' => $registration->id]);
    }

    public function test_group_member_nested_id_and_cross_group_access_are_rejected(): void
    {
        $main = User::factory()->create(['is_main_admin' => true]);
        $a = $this->group('Choir');
        $b = $this->group('Readers');
        $member = GroupMember::create(['group_id' => $b->id, 'name' => 'Maya Jones']);
        $this->actingAs($main);
        $this->putJson("/admin/groups/{$a->id}/members/{$member->id}", ['name' => 'Changed'])->assertNotFound();
        $this->deleteJson("/admin/groups/{$a->id}/members/{$member->id}")->assertNotFound();
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $a->id]));
        $this->postJson("/admin/groups/{$b->id}/members", ['name' => 'Unauthorized'])->assertForbidden();
        $this->putJson("/admin/groups/{$b->id}/members/{$member->id}", ['name' => 'Changed'])->assertForbidden();
        $this->deleteJson("/admin/groups/{$b->id}/members/{$member->id}")->assertForbidden();
        $this->assertDatabaseHas('group_members', ['id' => $member->id, 'name' => 'Maya Jones']);
    }

    public function test_contact_status_lifecycle_rejects_invalid_value_and_audits_changes(): void
    {
        $group = $this->group('Choir');
        $admin = User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $message = ContactMessage::factory()->create(['group_id' => $group->id, 'status' => 'new']);
        $this->actingAs($admin);
        $this->patchJson('/admin/contact-messages/'.$message->id, ['status' => 'in_progress'])->assertOk();
        $this->patchJson('/admin/contact-messages/'.$message->id, ['status' => 'resolved'])->assertOk();
        $this->patchJson('/admin/contact-messages/'.$message->id, ['status' => 'closed'])->assertUnprocessable();
        $this->assertDatabaseHas('contact_messages', ['id' => $message->id, 'status' => 'resolved']);
        $this->assertSame(2, AuditLog::where('action', 'updated contact status')->count());
    }

    public function test_main_admin_account_is_protected_and_missing_account_returns_404(): void
    {
        $main = User::factory()->create(['is_main_admin' => true]);
        $this->actingAs($main);
        $this->putJson('/admin/admin-accounts/'.$main->id, [])->assertForbidden();
        $this->deleteJson('/admin/admin-accounts/'.$main->id)->assertForbidden();
        $this->putJson('/admin/admin-accounts/999999', [])->assertNotFound();
        $this->deleteJson('/admin/admin-accounts/999999')->assertNotFound();
        $this->assertDatabaseHas('users', ['id' => $main->id, 'is_main_admin' => true]);
    }

    public function test_group_missing_id_and_main_only_mutations_are_rejected(): void
    {
        $main = User::factory()->create(['is_main_admin' => true]);
        $a = $this->group('Choir');
        $b = $this->group('Readers');
        $this->actingAs($main)->getJson('/admin/groups/999999/edit')->assertNotFound();
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $a->id]));
        $this->postJson('/admin/groups/'.$a->id, ['name' => 'Changed'])->assertForbidden();
        $this->deleteJson('/admin/groups/'.$a->id)->assertForbidden();
        $this->getJson('/admin/groups/'.$b->id.'/edit')->assertForbidden();
        $this->getJson('/admin/groups/'.$a->id.'/edit')->assertOk();
        $this->assertDatabaseHas('groups', ['id' => $a->id, 'name' => 'Choir']);
    }

    public function test_mass_edit_by_day_publication_and_missing_ids(): void
    {
        $mass = MassTime::create(['day' => 'Monday', 'start_time' => '09:00', 'location' => 'Cathedral', 'status' => 'published']);
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        $this->getJson('/admin/mass-times/'.$mass->id.'/edit')->assertOk();
        $this->getJson('/admin/mass-times/by-day?day=Monday')->assertOk();
        $this->putJson('/admin/mass-times/'.$mass->id, [
            'day' => 'Tuesday', 'start_time' => '11:00', 'location' => 'Cathedral', 'status' => 'draft',
        ])->assertOk();
        $this->assertDatabaseHas('mass_times', ['id' => $mass->id, 'day' => 'Tuesday', 'status' => 'draft']);
        $this->getJson('/api/v1/mass-times')->assertJsonCount(0, 'data');
        $this->putJson('/admin/mass-times/999999', [])->assertNotFound();
        $this->deleteJson('/admin/mass-times/999999')->assertNotFound();
    }

    public function test_public_event_and_news_collections_reject_write_methods(): void
    {
        foreach (['events', 'news'] as $resource) {
            foreach (['post', 'put', 'delete'] as $method) {
                $response = $this->{$method.'Json'}('/api/v1/'.$resource, ['title' => 'Synthetic']);
                $this->assertContains($response->status(), [404, 405]);
            }
        }
        $this->assertDatabaseCount('events', 0);
        $this->assertDatabaseCount('news_posts', 0);
    }

    public function test_draft_and_missing_event_and_news_media_are_not_public(): void
    {
        foreach (['events', 'news'] as $folder) {
            $directory = storage_path('app/private/'.$folder);
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            file_put_contents($directory.'/qa-hidden.png', 'synthetic image bytes');
        }
        $event = Event::create([
            'title' => 'Hidden Event', 'start_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00', 'end_time' => '11:00',
            'status' => 'draft', 'image_path' => 'events/qa-hidden.png',
        ]);
        $news = NewsPost::create([
            'title' => 'Hidden News', 'type' => 'news',
            'status' => 'draft', 'image_path' => 'news/qa-hidden.png',
        ]);
        foreach ([
            '/api/v1/events/'.$event->id,
            '/api/v1/events/'.$event->id.'/image',
            '/api/v1/events/999999',
            '/api/v1/events/999999/image',
            '/api/v1/news/'.$news->id,
            '/api/v1/news/'.$news->id.'/image',
            '/api/v1/news/999999',
            '/api/v1/news/999999/image',
        ] as $path) {
            $this->getJson($path)->assertNotFound();
        }
    }

    public function test_password_confirmation_requires_authentication_and_sets_session_only_for_correct_password(): void
    {
        $this->get('/confirm-password')->assertRedirect('/login');
        $this->post('/confirm-password', ['password' => 'password'])->assertRedirect('/login');
        $user = User::factory()->create();
        $this->actingAs($user)->get('/confirm-password')->assertOk();
        $this->post('/confirm-password', ['password' => 'WrongPass'])
            ->assertSessionHasErrors('password');
        $this->assertNull(session('auth.password_confirmed_at'));
        $this->post('/confirm-password', ['password' => 'password'])
            ->assertRedirect()
            ->assertSessionHas('auth.password_confirmed_at');
        $this->assertIsInt(session('auth.password_confirmed_at'));
    }
}
