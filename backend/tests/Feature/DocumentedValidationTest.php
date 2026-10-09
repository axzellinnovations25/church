<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\GalleryImage;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\MassTime;
use App\Models\NewsPost;
use App\Models\ParishCouncilMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DocumentedValidationTest extends TestCase
{
    use RefreshDatabase;

    private function mainAdmin(): User
    {
        $user = User::factory()->create(['is_main_admin' => true]);
        $this->actingAs($user);

        return $user;
    }

    public function test_evt_tc_003_required_time_and_file_boundaries_are_atomic(): void
    {
        $this->mainAdmin();
        $directory = storage_path('app/private/events');
        $before = is_dir($directory) ? glob($directory.'/*') : [];

        $this->post('/admin/events', [
            'title' => '', 'start_date' => 'invalid', 'start_time' => '20:00',
            'end_date' => '2026-11-01', 'end_time' => '19:00', 'status' => 'invalid',
            'image' => UploadedFile::fake()->createWithContent('invalid.png', 'not an image'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'start_date', 'status', 'image']);
        $this->assertDatabaseCount(Event::class, 0);
        $after = is_dir($directory) ? glob($directory.'/*') : [];
        $this->assertSame($before, $after);

        $this->postJson('/admin/events', [
            'title' => 'Overnight Vigil', 'start_date' => '2026-11-01', 'start_time' => '23:00',
            'end_date' => '2026-11-02', 'end_time' => '01:00', 'location' => 'Cathedral',
            'status' => 'published',
        ])->assertCreated();
        $this->assertDatabaseCount(Event::class, 1);
    }

    public function test_mass_tc_002_required_enum_and_time_validation_create_no_record(): void
    {
        $this->mainAdmin();

        $this->postJson('/admin/mass-times', [
            'day' => 'Funday', 'start_time' => '25:99', 'location' => str_repeat('x', 101),
            'status' => 'invalid',
        ])->assertUnprocessable()->assertJsonValidationErrors(['day', 'start_time', 'location', 'status']);
        $this->assertDatabaseCount(MassTime::class, 0);
    }

    public function test_news_tc_002_validation_and_image_bounds_leave_no_row_or_file(): void
    {
        $this->mainAdmin();
        $directory = storage_path('app/private/news');
        $before = is_dir($directory) ? glob($directory.'/*') : [];

        $this->post('/admin/news', [
            'title' => 'x', 'type' => 'invalid', 'status' => 'invalid',
            'image' => UploadedFile::fake()->createWithContent('invalid.png', 'not an image'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'type', 'status', 'image']);
        $this->assertDatabaseCount(NewsPost::class, 0);
        $after = is_dir($directory) ? glob($directory.'/*') : [];
        $this->assertSame($before, $after);
    }

    public function test_gal_tc_002_validation_and_image_bounds_leave_no_row_or_file(): void
    {
        $this->mainAdmin();
        $directory = storage_path('app/private/gallery');
        $before = is_dir($directory) ? glob($directory.'/*') : [];

        $this->post('/admin/gallery-images', [
            'title' => 'x', 'sort_order' => 0,
            'image' => UploadedFile::fake()->createWithContent('invalid.png', 'not an image'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'sort_order', 'image']);
        $this->assertDatabaseCount(GalleryImage::class, 0);
        $after = is_dir($directory) ? glob($directory.'/*') : [];
        $this->assertSame($before, $after);
    }

    public function test_cou_tc_002_validation_and_photo_bounds_leave_no_row_or_file(): void
    {
        $this->mainAdmin();
        $directory = storage_path('app/private/parish-council-members');
        $before = is_dir($directory) ? glob($directory.'/*') : [];

        $this->post('/admin/parish-council-members', [
            'name' => '', 'role' => '', 'sort_order' => -1,
            'photo' => UploadedFile::fake()->createWithContent('invalid.txt', 'not an image'),
        ], ['Accept' => 'application/json'])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'role', 'sort_order', 'photo']);
        $this->assertDatabaseCount(ParishCouncilMember::class, 0);
        $after = is_dir($directory) ? glob($directory.'/*') : [];
        $this->assertSame($before, $after);
    }

    public function test_grp_tc_002_duplicate_and_invalid_group_leave_assignment_unchanged(): void
    {
        $this->mainAdmin();
        $assigned = User::factory()->create(['is_main_admin' => false]);
        $group = Group::create([
            'name' => 'Existing Group', 'slug' => 'existing-group',
            'is_active' => true,
        ]);
        $assigned->update(['group_id' => $group->id]);

        $this->postJson('/admin/groups', [
            'name' => 'Existing Group', 'admin_user_id' => 999999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'admin_user_id']);
        $this->postJson('/admin/groups', ['name' => ''])
            ->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->assertDatabaseCount(Group::class, 1);
        $this->assertSame($group->id, $assigned->fresh()->group_id);
    }

    public function test_mem_tc_002_duplicate_identity_and_invalid_member_are_rejected(): void
    {
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $admin = User::factory()->create(['is_main_admin' => false, 'group_id' => $group->id]);
        $this->actingAs($admin);
        $url = '/admin/groups/'.$group->id.'/members';

        $this->postJson($url, [
            'name' => 'Duplicate Member', 'email' => 'duplicate@example.test', 'phone' => '01978555123',
        ])->assertCreated();
        $this->postJson($url, [
            'name' => 'Duplicate Member', 'email' => 'DUPLICATE@example.test', 'phone' => '01978555123',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->postJson($url, ['name' => '', 'email' => 'invalid'])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'email']);
        $this->assertDatabaseCount(GroupMember::class, 1);
    }

    public function test_acc_tc_002_duplicate_invalid_account_does_not_change_existing_assignment(): void
    {
        $this->mainAdmin();
        $group = Group::create(['name' => 'Choir', 'slug' => 'choir']);
        $existing = User::factory()->create([
            'email' => 'existing@example.test', 'is_main_admin' => false, 'group_id' => $group->id,
        ]);

        $this->postJson('/admin/admin-accounts', [
            'name' => '', 'email' => 'invalid',
            'password' => 'weak', 'password_confirmation' => 'different',
            'group_id' => 999999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password', 'group_id']);

        $this->postJson('/admin/admin-accounts', [
            'name' => 'Duplicate Account', 'email' => 'EXISTING@example.test',
            'password' => 'StrongPassword12!', 'password_confirmation' => 'StrongPassword12!',
            'group_id' => $group->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertDatabaseCount(User::class, 2);
        $this->assertSame($group->id, $existing->fresh()->group_id);
    }
}
