<?php

namespace Tests\Feature;

use App\Models\{Event, Group, MassTime, Newsletter, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(\Carbon\Carbon::parse('2026-09-26 12:00:00'));
    }

    private function eventData(array $changes = []): array
    {
        return array_replace(['title' => 'Parish Gathering', 'start_date' => '2026-10-05',
            'end_date' => '2026-10-05', 'start_time' => '10:00', 'end_time' => '11:00',
            'location' => 'Cathedral Hall', 'status' => 'published'], $changes);
    }

    private function mainAdmin(): void
    {
        $this->actingAs(User::factory()->create(['is_main_admin' => true]));
    }

    public function test_unassigned_accounts_cannot_read_update_delete_or_preview_events(): void
    {
        $event = Event::create($this->eventData(['status' => 'draft']));
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => null]));
        $this->getJson('/admin/events')->assertForbidden();
        $this->getJson('/admin/events/'.$event->id)->assertForbidden();
        $this->getJson('/admin/events/'.$event->id.'/edit')->assertForbidden();
        $this->putJson('/admin/events/'.$event->id, $this->eventData())->assertForbidden();
        $this->deleteJson('/admin/events/'.$event->id)->assertForbidden();
        $this->getJson('/admin/events/by-date?date=2026-10-05')->assertForbidden();
        $this->assertDatabaseHas('events', ['id' => $event->id, 'status' => 'draft']);
    }

    public function test_group_date_preview_only_returns_own_group(): void
    {
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $own = Event::create($this->eventData(['group_id' => $group->id]));
        Event::create($this->eventData(['status' => 'draft']));
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]));
        $this->getJson('/admin/events/by-date?date=2026-10-05')->assertOk()
            ->assertJsonCount(1)->assertJsonPath('0.id', $own->id);
    }

    public function test_main_admin_cannot_delete_their_profile(): void
    {
        $this->mainAdmin();
        $id = auth()->id();
        $this->deleteJson('/profile', ['password' => 'password'])->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $id, 'is_main_admin' => true]);
        $this->assertAuthenticated();
    }

    public function test_overnight_events_and_adjacent_non_overlapping_events(): void
    {
        $this->mainAdmin();
        $this->postJson('/admin/events', $this->eventData([
            'start_time' => '22:00', 'end_date' => '2026-10-06', 'end_time' => '02:00',
        ]))->assertCreated();
        $this->postJson('/admin/events', $this->eventData([
            'start_date' => '2026-10-06', 'end_date' => '2026-10-06', 'start_time' => '01:00', 'end_time' => '03:00',
        ]))->assertUnprocessable();
        $this->postJson('/admin/events', $this->eventData([
            'start_date' => '2026-10-06', 'end_date' => '2026-10-06', 'start_time' => '02:00', 'end_time' => '03:00',
        ]))->assertCreated();
    }

    public function test_multi_day_event_checks_mass_on_later_days(): void
    {
        MassTime::create(['day' => 'Tuesday', 'start_time' => '10:00', 'location' => 'Cathedral hall', 'status' => 'published']);
        $this->mainAdmin();
        $this->postJson('/admin/events', $this->eventData(['end_date' => '2026-10-07']))->assertUnprocessable();
    }

    public function test_mass_overlap_includes_legacy_null_end_time_and_midnight(): void
    {
        MassTime::create(['day' => 'Sunday', 'start_time' => '23:30', 'location' => 'Cathedral hall', 'status' => 'published']);
        $this->mainAdmin();
        $this->postJson('/admin/mass-times', ['day' => 'Monday', 'start_time' => '00:00',
            'location' => 'Cathedral Hall', 'status' => 'published'])->assertUnprocessable();
        $this->postJson('/admin/mass-times', ['day' => 'Monday', 'start_time' => '00:30',
            'location' => 'Cathedral Hall', 'status' => 'published'])->assertCreated();
        $mass = MassTime::where('day', 'Monday')->firstOrFail();
        $this->assertSame('01:30:00', $mass->getRawOriginal('end_time'));
    }

    public function test_mass_allows_other_weekdays_but_rejects_actual_event_overlap(): void
    {
        Event::create($this->eventData());
        $this->mainAdmin();
        $data = ['day' => 'Tuesday', 'start_time' => '10:00', 'location' => 'Cathedral Hall', 'status' => 'published'];
        $this->postJson('/admin/mass-times', $data)->assertCreated();
        $this->postJson('/admin/mass-times', [...$data, 'day' => 'Monday'])->assertUnprocessable();
    }

    public function test_event_location_matching_ignores_case_and_edit_ignores_itself(): void
    {
        $event = Event::create($this->eventData(['location' => 'cathedral hall']));
        $this->mainAdmin();
        $this->postJson('/admin/events', $this->eventData())->assertUnprocessable();
        $this->putJson('/admin/events/'.$event->id, $this->eventData(['title' => 'Changed title']))->assertOk();
        $this->postJson('/admin/events', $this->eventData(['location' => 'Other Hall']))->assertCreated();
    }

    public function test_invalid_schedules_return_validation_errors_instead_of_server_errors(): void
    {
        $this->mainAdmin();
        $this->postJson('/admin/events', $this->eventData(['start_date' => 'invalid']))->assertUnprocessable();
        $this->postJson('/admin/events', $this->eventData(['end_time' => '25:99']))->assertUnprocessable();
        $this->postJson('/admin/mass-times', ['start_time' => '10:00', 'status' => 'published'])->assertUnprocessable();
        $this->postJson('/admin/mass-times', ['day' => 'Monday', 'start_time' => 'bad', 'status' => 'published'])->assertUnprocessable();
        $this->postJson('/admin/mass-times', ['day' => ['Monday'], 'start_time' => ['10:00'], 'status' => 'published'])->assertUnprocessable();
    }

    public function test_pinned_records_survive_newer_items_and_stay_group_scoped(): void
    {
        $own = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $other = Event::create($this->eventData());
        $event = Event::create($this->eventData(['group_id' => $own->id]));
        $this->actingAs(User::factory()->create(['is_main_admin' => false, 'group_id' => $own->id]));
        $this->getJson('/admin/overview')->assertOk();
        $this->patchJson('/admin/overview/items/visibility', [
            'item_key' => 'event:'.$event->id, 'visibility' => 'pinned',
        ])->assertOk();
        $this->patchJson('/admin/overview/items/visibility', [
            'item_key' => 'event:'.$other->id, 'visibility' => 'pinned',
        ])->assertUnprocessable()->assertJsonValidationErrors('item_key');
        foreach ([6, 7, 8, 9] as $day) {
            Event::create($this->eventData(['group_id' => $own->id, 'start_date' => '2026-10-0'.$day]));
        }
        $response = $this->getJson('/admin/overview')->assertOk();
        $ids = array_column($response->json('recent.events'), 'id');
        $this->assertContains($event->id, $ids);
        $this->assertNotContains($other->id, $ids);
        $this->patchJson('/admin/overview/items/visibility', ['item_key' => 'event:'.$event->id, 'visibility' => 'dismissed'])->assertOk();
        $this->assertNotContains($event->id, array_column($this->getJson('/admin/overview')->json('recent.events'), 'id'));
    }

    public function test_mass_and_group_mutations_record_audit_activity(): void
    {
        $this->mainAdmin();
        $data = ['day' => 'Monday', 'start_time' => '10:00', 'location' => 'Cathedral', 'status' => 'published'];
        $id = $this->postJson('/admin/mass-times', $data)->assertCreated()->json('mass_time.id');
        $this->putJson('/admin/mass-times/'.$id, $data)->assertOk();
        $this->deleteJson('/admin/mass-times/'.$id)->assertOk();
        $group = $this->postJson('/admin/groups', ['name' => 'Choir'])->assertCreated()->json('group.id');
        $this->postJson('/admin/groups/'.$group, ['name' => 'Choir Updated'])->assertOk();
        $this->deleteJson('/admin/groups/'.$group)->assertOk();
        foreach (['created', 'updated', 'deleted'] as $verb) {
            foreach (['mass time', 'group'] as $type) {
                $this->assertDatabaseHas('audit_logs', ['action' => $verb.' '.$type]);
            }
        }
    }

    public function test_draft_files_are_not_available_to_unassigned_users(): void
    {
        $directory = storage_path('app/private');
        if (!is_dir($directory)) mkdir($directory, 0755, true);
        $file = tempnam($directory, 'permission-test-');
        file_put_contents($file, 'private file');
        try {
            $event = Event::create($this->eventData(['status' => 'draft', 'image_path' => basename($file)]));
            $newsletter = Newsletter::create(['title' => 'Future issue', 'publication_date' => '2026-10-10',
                'status' => 'draft', 'file_path' => basename($file), 'original_filename' => 'issue.pdf', 'file_size' => 12]);
            $user = User::factory()->create(['is_main_admin' => false]);
            $this->actingAs($user);
            $this->get('/events/'.$event->id.'/image')->assertNotFound();
            $this->get('/api/v1/events/'.$event->id.'/image')->assertNotFound();
            $this->get('/newsletters/'.$newsletter->id.'/view')->assertNotFound();
            $this->mainAdmin();
            $this->get('/events/'.$event->id.'/image')->assertOk();
            $this->get('/api/v1/events/'.$event->id.'/image')->assertOk();
            $this->get('/newsletters/'.$newsletter->id.'/view')->assertOk();
        } finally {
            unlink($file);
        }
    }
}
