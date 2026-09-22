<?php

namespace Tests\Feature;

use App\Models\ParishCouncilMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ParishCouncilMemberManagementTest extends TestCase
{
    use RefreshDatabase;

    private function fakeImage(string $name = 'member.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII=')
        );
    }

    protected function tearDown(): void
    {
        foreach (glob(storage_path('app/private/parish-council-members/*')) ?: [] as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    public function test_main_admin_can_create_a_parish_council_member(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $response = $this->actingAs($admin)->postJson('/admin/parish-council-members', [
            'name' => 'Mary Roberts',
            'role' => 'Chairperson',
            'bio' => 'Supports parish formation and outreach.',
            'sort_order' => 1,
            'is_active' => true,
            'photo' => $this->fakeImage(),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('member.name', 'Mary Roberts');
        $response->assertJsonPath('member.role', 'Chairperson');
        $response->assertJsonPath('member.is_active', true);

        $member = ParishCouncilMember::first();
        $this->assertNotNull($member);
        $this->assertFileExists(storage_path("app/private/{$member->photo_path}"));

        $this->get("/api/v1/parish-council-members/{$member->id}/photo")
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    public function test_admin_photo_route_serves_hidden_member_photos(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $directory = storage_path('app/private/parish-council-members');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(
            storage_path('app/private/parish-council-members/hidden.png'),
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII=')
        );

        $member = ParishCouncilMember::create([
            'name' => 'Hidden Member',
            'role' => 'Advisor',
            'photo_path' => 'parish-council-members/hidden.png',
            'photo_filename' => 'hidden.png',
            'photo_size' => 68,
            'is_active' => false,
        ]);

        $this->get("/api/v1/parish-council-members/{$member->id}/photo")
            ->assertNotFound();

        $this->actingAs($admin)
            ->get("/admin/parish-council-members/{$member->id}/photo")
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    public function test_main_admin_can_update_and_delete_a_parish_council_member(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $directory = storage_path('app/private/parish-council-members');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(storage_path('app/private/parish-council-members/original.jpg'), 'image');

        $member = ParishCouncilMember::create([
            'name' => 'John Davies',
            'role' => 'Secretary',
            'bio' => 'Original bio.',
            'photo_path' => 'parish-council-members/original.jpg',
            'photo_filename' => 'original.jpg',
            'photo_size' => 5,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $updateResponse = $this->actingAs($admin)->postJson("/admin/parish-council-members/{$member->id}", [
            'name' => 'John Davies',
            'role' => 'Vice Chair',
            'bio' => 'Updated bio.',
            'sort_order' => 4,
            'is_active' => false,
        ]);

        $updateResponse->assertOk();
        $updateResponse->assertJsonPath('member.role', 'Vice Chair');
        $updateResponse->assertJsonPath('member.is_active', false);

        $this->assertDatabaseHas(ParishCouncilMember::class, [
            'id' => $member->id,
            'role' => 'Vice Chair',
            'sort_order' => 4,
            'is_active' => false,
            'photo_path' => 'parish-council-members/original.jpg',
        ]);

        $deleteResponse = $this->actingAs($admin)->deleteJson("/admin/parish-council-members/{$member->id}");

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing(ParishCouncilMember::class, [
            'id' => $member->id,
        ]);
        $this->assertFileDoesNotExist(storage_path('app/private/parish-council-members/original.jpg'));
    }

    public function test_non_main_admin_cannot_manage_parish_council_members(): void
    {
        $groupAdmin = User::factory()->create([
            'is_main_admin' => false,
        ]);

        $response = $this->actingAs($groupAdmin)->postJson('/admin/parish-council-members', [
            'name' => 'Blocked User',
            'role' => 'Member',
            'photo' => $this->fakeImage(),
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount(ParishCouncilMember::class, 0);
    }
}
