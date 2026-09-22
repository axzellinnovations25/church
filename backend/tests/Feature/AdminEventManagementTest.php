<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminEventManagementTest extends TestCase
{
    use RefreshDatabase;

    private function fakeImage(string $name = 'poster.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII=')
        );
    }

    protected function tearDown(): void
    {
        foreach (glob(storage_path('app/private/events/*')) ?: [] as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    public function test_main_admin_can_create_update_and_delete_an_event_with_an_uploaded_image(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $createResponse = $this->actingAs($admin)->post('/admin/events', [
            'title' => 'Youth Night',
            'description' => 'An evening for parish youth.',
            'start_date' => '2026-05-10',
            'start_time' => '18:30',
            'end_date' => '2026-05-10',
            'end_time' => '20:00',
            'location' => 'Cathedral Hall',
            'status' => 'published',
            'category' => 'Youth',
            'image' => $this->fakeImage('youth-night.png'),
        ], ['Accept' => 'application/json']);

        $createResponse->assertCreated();
        $createResponse->assertJsonPath('event.image_url', fn ($value) => is_string($value) && $value !== '');

        $event = Event::first();
        $this->assertNotNull($event);
        $this->assertNotNull($event->image_path);
        $this->assertFileExists(storage_path("app/private/{$event->image_path}"));

        $originalImagePath = $event->image_path;

        $updateResponse = $this->actingAs($admin)->post("/admin/events/{$event->id}", [
            '_method' => 'PUT',
            'title' => 'Youth Night Updated',
            'description' => 'Updated evening for parish youth.',
            'start_date' => '2026-05-10',
            'start_time' => '18:30',
            'end_date' => '2026-05-10',
            'end_time' => '20:30',
            'location' => 'Cathedral',
            'status' => 'published',
            'category' => 'Youth',
            'image' => $this->fakeImage('updated-poster.png'),
        ], ['Accept' => 'application/json']);

        $updateResponse->assertOk();
        $updateResponse->assertJsonPath('event.title', 'Youth night updated');

        $event->refresh();
        $this->assertNotSame($originalImagePath, $event->image_path);
        $this->assertFileDoesNotExist(storage_path("app/private/{$originalImagePath}"));
        $this->assertFileExists(storage_path("app/private/{$event->image_path}"));

        $deleteResponse = $this->actingAs($admin)->deleteJson("/admin/events/{$event->id}");

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('events', [
            'id' => $event->id,
        ]);
        $this->assertFileDoesNotExist(storage_path("app/private/{$event->image_path}"));
    }

    public function test_event_validation_rejects_titles_and_descriptions_that_exceed_word_limits(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $title = implode(' ', array_fill(0, 51, 'Title'));
        $description = implode(' ', array_fill(0, 251, 'Description'));

        $response = $this->actingAs($admin)->postJson('/admin/events', [
            'title' => $title,
            'description' => $description,
            'start_date' => '2026-05-10',
            'start_time' => '18:30',
            'end_date' => '2026-05-10',
            'end_time' => '20:00',
            'location' => 'Cathedral Hall',
            'status' => 'published',
            'category' => 'Youth',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'description']);
    }
}
