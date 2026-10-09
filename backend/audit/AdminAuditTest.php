<?php

namespace Tests\Audit;

use App\Models\{Event, Group, MassTime, Newsletter, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

// Run explicitly against an isolated database and upload directory.
class AdminAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        if (getenv('DB_CONNECTION') !== 'sqlite' || getenv('DB_DATABASE') !== ':memory:'
            || !str_contains((string) getenv('LARAVEL_STORAGE_PATH'), 'admin-audit-isolated')) {
            throw new \RuntimeException('Run with the isolated audit environment; see run-audit.ps1.');
        }
        parent::setUp();
        $this->travelTo(\Carbon\Carbon::parse('2026-09-26 12:00:00'));
    }

    private function admin(): User
    {
        return User::factory()->create(['is_main_admin' => true]);
    }

    private function eventData(array $extra = []): array
    {
        return array_replace(['title' => 'Audit Event', 'start_date' => '2026-10-05',
            'end_date' => '2026-10-05', 'start_time' => '10:00', 'end_time' => '11:00',
            'location' => 'Cathedral', 'status' => 'published'], $extra);
    }

    public function test_main_admin_lists_and_header_load(): void
    {
        $this->actingAs($this->admin());
        foreach (['overview', 'header-summary', 'events', 'mass-times', 'news', 'newsletters',
            'gallery-images', 'parish-registrations', 'contact-messages', 'groups'] as $path) {
            $this->getJson('/admin/'.$path)->assertOk();
        }
    }

    public function test_unassigned_account_events_list_should_not_crash(): void
    {
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => null]))
            ->getJson('/admin/events')->assertOk();
    }

    public function test_unassigned_account_cannot_read_ungrouped_event(): void
    {
        $event = Event::create($this->eventData());
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => null]))
            ->getJson('/admin/events/'.$event->id.'/edit')->assertForbidden();
    }

    public function test_unassigned_account_cannot_delete_ungrouped_event(): void
    {
        $event = Event::create($this->eventData());
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => null]))
            ->deleteJson('/admin/events/'.$event->id)->assertForbidden();
    }

    public function test_group_event_create_edit_delete_and_other_group_restriction(): void
    {
        $group = Group::create(['name' => 'Audit Choir', 'slug' => 'audit-choir']);
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]));
        $id = $this->postJson('/admin/events', $this->eventData())->assertCreated()
            ->assertJsonPath('event.status', 'draft')->json('event.id');
        $this->putJson('/admin/events/'.$id, $this->eventData(['title' => 'Updated']))->assertOk();
        $other = Event::create($this->eventData(['start_date' => '2026-10-07']));
        $this->getJson('/admin/events/'.$other->id.'/edit')->assertForbidden();
        $this->deleteJson('/admin/events/'.$id)->assertOk();
    }

    public function test_mass_time_crud_and_duplicate_rejection(): void
    {
        $this->actingAs($this->admin());
        $data = ['day' => 'Monday', 'start_time' => '10:00', 'location' => 'Cathedral', 'status' => 'published'];
        $id = $this->postJson('/admin/mass-times', $data)->assertCreated()->json('mass_time.id');
        $this->postJson('/admin/mass-times', $data)->assertUnprocessable();
        $this->putJson('/admin/mass-times/'.$id, array_replace($data, ['start_time' => '11:00']))->assertOk();
        $this->getJson('/admin/mass-times/by-day?day=Monday')->assertOk()->assertJsonCount(1);
        $this->deleteJson('/admin/mass-times/'.$id)->assertOk();
    }

    public function test_mass_should_not_clash_with_event_on_different_weekday(): void
    {
        Event::create($this->eventData()); // Monday
        $this->actingAs($this->admin())->postJson('/admin/mass-times', [
            'day' => 'Tuesday', 'start_time' => '10:00', 'location' => 'Cathedral', 'status' => 'published',
        ])->assertCreated();
    }

    public function test_event_should_detect_mass_created_through_admin(): void
    {
        $this->actingAs($this->admin());
        $this->postJson('/admin/mass-times', ['day' => 'Monday', 'start_time' => '10:00',
            'location' => 'Cathedral', 'status' => 'published'])->assertCreated();
        $this->postJson('/admin/events', $this->eventData())->assertUnprocessable();
    }

    public function test_event_should_detect_existing_event_at_same_location(): void
    {
        $this->actingAs($this->admin());
        $data = $this->eventData(['location' => 'Cathedral Hall']);
        $this->postJson('/admin/events', $data)->assertCreated();
        $this->postJson('/admin/events', $data)->assertUnprocessable();
    }

    public function test_news_crud_and_publication(): void
    {
        $this->actingAs($this->admin());
        $data = ['title' => 'Audit News', 'type' => 'news', 'status' => 'draft', 'content' => 'Audit content'];
        $id = $this->postJson('/admin/news', $data)->assertCreated()->json('news_post.id');
        $this->getJson('/admin/news/'.$id.'/edit')->assertOk();
        $image = UploadedFile::fake()->createWithContent('news.png', base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));
        $this->post('/admin/news/'.$id, [...$data, 'status' => 'published', 'image' => $image],
            ['Accept' => 'application/json'])->assertOk();
        $this->getJson('/api/v1/news/'.$id)->assertOk();
        $this->get('/api/v1/news/'.$id.'/image')->assertOk();
        $this->deleteJson('/admin/news/'.$id)->assertOk();
    }

    public function test_gallery_upload_visibility_update_and_delete(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin);
        $image = UploadedFile::fake()->createWithContent('audit.png', base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));
        $data = ['title' => 'Audit Gallery', 'caption' => 'Audit', 'sort_order' => 1, 'is_active' => false];
        $id = $this->post('/admin/gallery-images', [...$data, 'image' => $image], ['Accept' => 'application/json'])
            ->assertCreated()->json('gallery_image.id');
        $this->get('/admin/gallery-images/'.$id.'/image')->assertOk();
        auth()->logout();
        $this->get('/api/v1/gallery-images/'.$id.'/image')->assertNotFound();
        $this->actingAs($admin);
        $this->postJson('/admin/gallery-images/'.$id, [...$data, 'is_active' => true])->assertOk();
        $this->get('/api/v1/gallery-images/'.$id.'/image')->assertOk();
        $this->deleteJson('/admin/gallery-images/'.$id)->assertOk();
    }

    public function test_groups_and_admin_account_crud(): void
    {
        $this->actingAs($this->admin());
        $groupId = $this->postJson('/admin/groups', ['name' => 'Audit Choir', 'is_active' => true])
            ->assertCreated()->json('group.id');
        $this->postJson('/admin/admin-accounts', ['name' => 'Audit Admin', 'email' => 'audit@example.com',
            'password' => 'AuditPassword123!', 'password_confirmation' => 'AuditPassword123!',
            'group_id' => $groupId])->assertCreated();
        $user = User::where('email', 'audit@example.com')->firstOrFail();
        $this->putJson('/admin/admin-accounts/'.$user->id, ['name' => 'Updated Admin',
            'email' => 'audit@example.com', 'group_id' => $groupId])->assertOk();
        $this->postJson('/admin/groups/'.$groupId, ['name' => 'Updated Choir', 'admin_user_id' => $user->id])->assertOk();
        $this->getJson('/admin/groups/'.$groupId.'/edit')->assertOk();
        $this->deleteJson('/admin/admin-accounts/'.$user->id)->assertOk();
        $this->deleteJson('/admin/groups/'.$groupId)->assertOk();
    }

    public function test_main_admin_pages_reject_group_admin(): void
    {
        $this->actingAs(User::factory()->create(['is_main_admin' => false]));
        foreach (['mass-times', 'news', 'newsletters', 'gallery-images', 'parish-registrations', 'parish-council-members'] as $path) {
            $this->getJson('/admin/'.$path)->assertForbidden();
        }
        $this->postJson('/admin/admin-accounts', [])->assertForbidden();
    }

    public function test_newsletter_replace_preview_download_delete_and_scheduling(): void
    {
        $this->actingAs($this->admin());
        $pdf = fn () => UploadedFile::fake()->createWithContent('audit.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
        $data = ['title' => 'Audit Newsletter', 'publication_date' => now()->addDay()->toDateString(), 'status' => 'draft'];
        $id = $this->post('/admin/newsletters', [...$data, 'pdf' => $pdf()], ['Accept' => 'application/json'])
            ->assertCreated()->json('newsletter.id');
        $this->get('/newsletters/'.$id.'/view')->assertOk();
        $this->get('/newsletters/'.$id.'/download')->assertOk();
        $oldPath = Newsletter::findOrFail($id)->file_path;
        $this->post('/admin/newsletters/'.$id, [...$data, 'pdf' => $pdf()], ['Accept' => 'application/json'])->assertOk();
        $this->assertFileDoesNotExist(storage_path('app/private/'.$oldPath));
        $this->travel(2)->days();
        $this->getJson('/admin/newsletters')->assertOk();
        $this->assertSame('published', Newsletter::findOrFail($id)->status);
        $this->deleteJson('/admin/newsletters/'.$id)->assertOk();
        $this->assertDatabaseMissing('newsletters', ['id' => $id]);
        $this->travelBack();
    }

    public function test_group_member_update_and_delete(): void
    {
        $group = Group::create(['name' => 'Audit Choir', 'slug' => 'audit-choir']);
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]));
        $url = '/admin/groups/'.$group->id.'/members';
        $data = ['name' => 'Audit Member', 'email' => 'member@example.com', 'role' => 'Singer'];
        $id = $this->postJson($url, $data)->assertCreated()->json('member.id');
        $this->putJson($url.'/'.$id, [...$data, 'role' => 'Leader'])->assertOk()->assertJsonPath('member.role', 'Leader');
        $this->deleteJson($url.'/'.$id)->assertOk();
        $this->assertDatabaseMissing('group_members', ['id' => $id]);
    }

    public function test_api_login_session_and_logout(): void
    {
        $admin = $this->admin();
        $this->getJson('/auth-api/csrf-token')->assertOk()->assertJsonStructure(['csrf_token']);
        $this->postJson('/auth-api/login', ['email' => $admin->email, 'password' => 'password'])->assertOk();
        $this->getJson('/auth-api/me')->assertOk()->assertJsonPath('user.id', $admin->id);
        $this->postJson('/auth-api/logout')->assertOk();
        $this->getJson('/auth-api/me')->assertUnauthorized();
    }

    public function test_registration_detail_and_delete_children_and_interests(): void
    {
        $this->actingAs($this->admin());
        $registration = \App\Models\ParishRegistration::create([
            'registration_type' => 'family', 'full_name' => 'Audit Family', 'date_of_birth' => '1990-01-01',
            'gender' => 'female', 'address_line1' => '1 High Street', 'city' => 'Wrexham', 'postcode' => 'LL11 1AA',
            'phone' => '01978263943', 'email' => 'family@example.com', 'consent_confirmed' => true,
            'signature' => 'Audit Family', 'signed_date' => '2026-04-01',
        ]);
        $registration->children()->create(['child_name' => 'Audit Child', 'date_of_birth' => '2015-01-01']);
        $registration->interest()->create(['volunteering' => true]);
        $this->getJson('/admin/parish-registrations/'.$registration->id)->assertOk()->assertJsonCount(1, 'registration.children');
        $this->deleteJson('/admin/parish-registrations/'.$registration->id)->assertOk();
        $this->assertDatabaseMissing('parish_registrations', ['id' => $registration->id]);
        $this->assertSame(0, $registration->children()->count());
        $this->assertSame(0, $registration->interest()->count());
    }

    public function test_pinned_overview_event_stays_after_newer_events_arrive(): void
    {
        $event = Event::create($this->eventData());
        $admin = $this->admin();
        $this->actingAs($admin)->getJson('/admin/overview')->assertOk();
        $this->patchJson('/admin/overview/items/visibility', ['item_key' => 'event:'.$event->id, 'visibility' => 'pinned'])->assertOk();
        foreach ([6, 7, 8, 9] as $day) {
            Event::create($this->eventData(['start_date' => '2026-10-0'.$day]));
        }
        $ids = array_column($this->getJson('/admin/overview')->assertOk()->json('recent.events'), 'id');
        $this->assertContains($event->id, $ids);
    }
}
