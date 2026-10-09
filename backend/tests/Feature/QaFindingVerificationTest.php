<?php

namespace Tests\Feature;

use App\Mail\ParishRegistrationWelcome;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\NewsPost;
use App\Models\Newsletter;
use App\Models\ParishRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Tests\TestCase;

/**
 * Reproduces current behavior in the in-memory test database. Assertions here
 * document observations; QA case Pass/Fail is determined against the case's
 * expected result in docs/qa/TEST_CASES.md.
 */
class QaFindingVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function signupData(string $email = 'public@example.test'): array
    {
        return [
            'name' => 'Public Visitor', 'email' => $email,
            'password' => 'StrongPass12!', 'password_confirmation' => 'StrongPass12!',
        ];
    }

    private function contactData(array $changes = []): array
    {
        return array_replace([
            'name' => 'Maya Jones', 'email' => 'maya@example.test',
            'phone' => '01978263943', 'subject' => 'Visit enquiry',
            'category' => 'general', 'message' => 'Please tell me about visiting the cathedral.',
        ], $changes);
    }

    private function registrationData(): array
    {
        return [
            'registration_type' => 'individual', 'full_name' => 'Maya Jones',
            'date_of_birth' => '1990-01-01', 'gender' => 'female',
            'address_line1' => '1 High Street', 'city' => 'Wrexham',
            'postcode' => 'LL11 1AA', 'phone' => '01978263943',
            'email' => 'maya@example.test', 'consent_confirmed' => true,
            'signature' => 'Maya Jones', 'signed_date' => now()->toDateString(),
        ];
    }

    public function test_first_public_signup_never_receives_main_admin_on_empty_database(): void
    {
        $this->assertDatabaseCount('users', 0);
        $this->postJson('/auth-api/signup', $this->signupData())->assertCreated();
        $this->getJson('/auth-api/me')->assertOk()->assertJsonPath('user.is_main_admin', false);
        $this->getJson('/admin/news')->assertForbidden();
        $this->assertDatabaseHas('users', ['email' => 'public@example.test', 'is_main_admin' => false]);
    }

    public function test_first_blade_registration_never_receives_main_admin_on_empty_database(): void
    {
        $this->post('/register', $this->signupData('blade@example.test'))->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', ['email' => 'blade@example.test', 'is_main_admin' => false]);
        $this->getJson('/admin/overview')->assertForbidden();
    }

    public function test_later_public_signup_cannot_enter_any_admin_route(): void
    {
        User::factory()->create(['is_main_admin' => true]);
        $this->postJson('/auth-api/signup', $this->signupData())->assertCreated();
        $this->getJson('/auth-api/me')->assertJsonPath('user.is_main_admin', false);
        foreach (['/admin/overview', '/admin/header-summary', '/admin/events', '/admin/contact-messages', '/admin/groups', '/admin/news'] as $path) {
            $this->getJson($path)->assertForbidden();
        }
        $this->get('/dashboard')->assertForbidden();
    }

    public function test_main_only_route_matrix_rejects_guest_and_group_user(): void
    {
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $main = User::factory()->create(['is_main_admin' => true]);
        $groupUser = User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $registration = ParishRegistration::factory()->create();
        $contact = ContactMessage::factory()->create();
        $reads = [
            '/admin/mass-times', '/admin/newsletters', '/admin/news',
            '/admin/parish-registrations', '/admin/parish-council-members',
            '/admin/gallery-images',
        ];
        $writes = [
            ['post', '/admin/mass-times'], ['post', '/admin/newsletters'],
            ['post', '/admin/news'], ['post', '/admin/groups'],
            ['post', '/admin/admin-accounts'], ['post', '/admin/gallery-images'],
            ['post', '/admin/parish-council-members'],
            ['put', '/admin/parish-registrations/'.$registration->id],
            ['delete', '/admin/contact-messages/'.$contact->id],
        ];
        foreach ($reads as $path) {
            $this->getJson($path)->assertUnauthorized();
        }
        foreach ($writes as [$method, $path]) {
            $this->{$method.'Json'}($path, [])->assertUnauthorized();
        }
        $this->actingAs($groupUser);
        foreach ($reads as $path) {
            $this->getJson($path)->assertForbidden();
        }
        foreach ($writes as [$method, $path]) {
            $this->{$method.'Json'}($path, [])->assertForbidden();
        }
        $this->assertSame(0, Event::count());
        $this->assertSame(2, User::count());
        $this->assertTrue($main->fresh()->is_main_admin);
    }

    public function test_future_published_news_image_is_hidden_with_the_post(): void
    {
        $directory = storage_path('app/private/news');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        file_put_contents($directory.'/qa-future-news.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));
        $post = NewsPost::create([
            'title' => 'Future Notice', 'type' => 'news', 'status' => 'published',
            'published_at' => now()->addDays(7), 'image_path' => 'news/qa-future-news.png',
        ]);
        $this->getJson('/api/v1/news')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/news/'.$post->id)->assertNotFound();
        $this->get('/api/v1/news/'.$post->id.'/image')->assertNotFound();
    }

    public function test_duplicate_parish_registration_is_saved_twice_and_mails_twice(): void
    {
        Mail::fake();
        $data = $this->registrationData();
        $this->postJson('/api/v1/parish-registrations', $data)->assertOk();
        $this->postJson('/api/v1/parish-registrations', $data)->assertOk();
        $this->assertDatabaseCount(ParishRegistration::class, 2);
        Mail::assertSent(ParishRegistrationWelcome::class, 2);
    }

    public function test_due_newsletter_draft_is_published_during_public_read(): void
    {
        $newsletter = Newsletter::create([
            'title' => 'Due Bulletin', 'publication_date' => now()->toDateString(),
            'status' => 'draft', 'file_path' => 'newsletters/missing.pdf',
            'file_contents' => base64_encode('%PDF-1.4 qa'),
            'original_filename' => 'qa.pdf', 'file_size' => 11,
        ]);
        $this->getJson('/api/v1/newsletters')->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('published', $newsletter->fresh()->status);
    }

    public function test_future_newsletter_stays_private_then_publishes_on_due_read(): void
    {
        $this->travelTo(now()->startOfDay());
        $newsletter = Newsletter::create([
            'title' => 'Next Bulletin', 'publication_date' => now()->addDay()->toDateString(),
            'status' => 'draft', 'file_path' => 'newsletters/not-on-disk.pdf',
            'file_contents' => base64_encode('%PDF-1.4 next'),
            'original_filename' => 'next.pdf', 'file_size' => 13,
        ]);
        $this->getJson('/api/v1/newsletters')->assertOk()->assertJsonCount(0, 'data');
        $this->get('/newsletters/'.$newsletter->id.'/view')->assertNotFound();
        $this->travel(2)->days();
        $this->getJson('/api/v1/newsletters')->assertOk()->assertJsonCount(1, 'data');
        $this->get('/newsletters/'.$newsletter->id.'/view')->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertSame('published', $newsletter->fresh()->status);
    }

    public function test_contact_attendance_radio_is_persisted(): void
    {
        $this->postJson('/api/v1/contact', $this->contactData(['isMember' => 'no']))->assertOk();
        $this->postJson('/api/v1/contact', $this->contactData([
            'email' => 'attends@example.test', 'isMember' => 'yes',
        ]))->assertOk();
        $this->assertDatabaseHas('contact_messages', ['email' => 'maya@example.test', 'is_member' => false]);
        $this->assertDatabaseHas('contact_messages', ['email' => 'attends@example.test', 'is_member' => true]);

        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        $message = ContactMessage::where('email', 'maya@example.test')->firstOrFail();
        $this->getJson('/admin/contact-messages/'.$message->id)
            ->assertOk()->assertJsonPath('message.is_member', false);
    }

    public function test_contact_validation_rejects_short_malformed_and_overlimit_fields_without_persistence(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.10'])
            ->postJson('/api/v1/contact', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'subject', 'message']);
        foreach (array_values([
            ['name' => 'A'],
            ['email' => 'bad-email'],
            ['phone' => '123456'],
            ['message' => 'Too short'],
            ['message' => str_repeat('x', 5001)],
        ]) as $index => $invalid) {
            $field = array_key_first($invalid);
            $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.'.(20 + $index)])
                ->postJson('/api/v1/contact', $this->contactData($invalid))
                ->assertUnprocessable()
                ->assertJsonValidationErrors([$field]);
        }
        $this->assertDatabaseCount(ContactMessage::class, 0);
    }

    public function test_public_contact_limits_repeated_anonymous_posts(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.99']);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/contact', $this->contactData())->assertOk();
        }
        for ($i = 0; $i < 7; $i++) {
            $this->postJson('/api/v1/contact', $this->contactData())->assertTooManyRequests();
        }
        $this->assertDatabaseCount(ContactMessage::class, 5);
    }

    public function test_contact_rejects_inactive_group_and_arbitrary_category(): void
    {
        $group = Group::create(['name' => 'Inactive Choir', 'slug' => 'inactive-choir', 'is_active' => false]);
        $this->postJson('/api/v1/contact', $this->contactData([
            'category' => 'unexpected', 'group_id' => $group->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors(['category', 'group_id']);
        $active = Group::create(['name' => 'Active Choir', 'slug' => 'active-choir', 'is_active' => true]);
        $this->postJson('/api/v1/contact', $this->contactData([
            'category' => 'general', 'group_id' => $active->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('group_id');
        $this->postJson('/api/v1/contact', $this->contactData([
            'category' => 'group_join', 'group_id' => $group->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('group_id');
        $this->assertDatabaseCount(ContactMessage::class, 0);
    }

    public function test_group_name_slug_collision_returns_validation_error_without_creating_second_group(): void
    {
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        $this->postJson('/admin/groups', ['name' => 'St. Mary'])->assertCreated();
        $this->postJson('/admin/groups', ['name' => 'St Mary'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseCount('groups', 1);

        $other = Group::create(['name' => 'Readers', 'slug' => 'readers']);
        $this->postJson('/admin/groups/'.$other->id, ['name' => 'St Mary'])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertSame('readers', $other->fresh()->slug);
    }

    public function test_failed_newsletter_database_update_preserves_old_file_and_removes_staged_replacement(): void
    {
        $directory = storage_path('app/private/newsletters');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        $oldPath = $directory.'/qa-old.pdf';
        file_put_contents($oldPath, '%PDF-1.4 old');
        $newsletter = Newsletter::create([
            'title' => 'Old Bulletin', 'publication_date' => now()->toDateString(),
            'status' => 'published', 'file_path' => 'newsletters/qa-old.pdf',
            'file_contents' => base64_encode('%PDF-1.4 old'),
            'original_filename' => 'old.pdf', 'file_size' => 12,
        ]);
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        Newsletter::updating(static function (): void {
            throw new RuntimeException('QA injected database failure');
        });
        try {
            $this->postJson('/admin/newsletters/'.$newsletter->id, [
                'title' => 'New Bulletin', 'publication_date' => now()->toDateString(),
                'status' => 'published',
                'pdf' => UploadedFile::fake()->createWithContent('replacement.pdf', '%PDF-1.4 replacement'),
            ])->assertStatus(500);
        } finally {
            Newsletter::flushEventListeners();
        }
        $this->assertSame('newsletters/qa-old.pdf', $newsletter->fresh()->file_path);
        $this->assertFileExists($oldPath);
        $this->assertCount(1, glob($directory.'/*.pdf'));
    }

    public function test_group_deletion_cascades_members_and_nulls_other_group_references(): void
    {
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $account = User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $event = Event::create([
            'title' => 'Choir Event', 'start_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'published', 'group_id' => $group->id,
        ]);
        $message = ContactMessage::create($this->contactData(['group_id' => $group->id, 'status' => 'new']));
        $member = GroupMember::create(['group_id' => $group->id, 'name' => 'Maya Jones']);
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        $this->deleteJson('/admin/groups/'.$group->id)->assertOk();
        $this->assertDatabaseMissing('groups', ['id' => $group->id]);
        $this->assertDatabaseMissing('group_members', ['id' => $member->id]);
        $this->assertNull($account->fresh()->group_id);
        $this->assertNull($event->fresh()->group_id);
        $this->assertNull($message->fresh()->group_id);
        $this->getJson('/api/v1/events/'.$event->id)->assertOk();
    }

    public function test_foreign_overview_key_is_rejected_without_changing_preferences(): void
    {
        $own = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $other = Group::create(['name' => 'Readers', 'slug' => 'readers']);
        $event = Event::create([
            'title' => 'Readers Event', 'start_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'draft', 'group_id' => $other->id,
        ]);
        $user = User::factory()->create(['is_main_admin' => false, 'group_id' => $own->id]);
        $this->actingAs($user);
        $this->patchJson('/admin/overview/items/visibility', [
            'item_key' => 'event:'.$event->id, 'visibility' => 'pinned',
        ])->assertUnprocessable()->assertJsonValidationErrors('item_key');
        $this->patchJson('/admin/overview/items/visibility', [
            'item_key' => 'event:999999', 'visibility' => 'pinned',
        ])->assertUnprocessable()->assertJsonValidationErrors('item_key');
        $this->patchJson('/admin/overview/items/visibility', [
            'item_key' => 'invalid-key', 'visibility' => 'pinned',
        ])->assertUnprocessable()->assertJsonValidationErrors('item_key');
        $this->assertNotContains('event:'.$event->id, $user->fresh()->hidden_overview_items['pinned'] ?? []);
        $this->getJson('/admin/overview')->assertOk()->assertJsonCount(0, 'recent.events');
    }

    public function test_unverified_group_admin_can_reach_verified_dashboard_route(): void
    {
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $user = User::factory()->unverified()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $this->actingAs($user);
        $this->get('/dashboard')->assertRedirect(config('app.frontend_url').'/dashboard');
        $this->getJson('/admin/overview')->assertOk();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_five_hundred_admin_news_records_are_retrievable_across_all_pages(): void
    {
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
        for ($batch = 0; $batch < 5; $batch++) {
            $rows = [];
            for ($index = 1; $index <= 100; $index++) {
                $number = $batch * 100 + $index;
                $rows[] = [
                    'title' => sprintf('QA News %03d', $number),
                    'type' => 'news', 'status' => 'published',
                    'created_at' => now(), 'updated_at' => now(),
                ];
            }
            DB::table('news_posts')->insert($rows);
        }
        $ids = [];
        for ($page = 1; $page <= 50; $page++) {
            $response = $this->getJson('/admin/news?page='.$page)->assertOk()
                ->assertJsonPath('meta.total', 500)
                ->assertJsonPath('meta.last_page', 50);
            $ids = [...$ids, ...array_column($response->json('news_posts'), 'id')];
        }
        $this->assertCount(500, $ids);
        $this->assertCount(500, array_unique($ids));
        $this->assertContains(500, $ids);
    }
}
