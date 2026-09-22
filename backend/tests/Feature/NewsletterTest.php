<?php

namespace Tests\Feature;

use App\Models\Newsletter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    private function fakePdf(string $name = 'newsletter.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        );
    }

    protected function tearDown(): void
    {
        foreach (glob(storage_path('app/private/newsletters/*.pdf')) ?: [] as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    public function test_admin_can_upload_a_newsletter_pdf(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/admin/newsletters', [
            'title' => 'Palm Sunday Newsletter',
            'publication_date' => '2026-03-29',
            'description' => 'Holy Week notices.',
            'status' => 'published',
            'pdf' => $this->fakePdf('palm-sunday.pdf'),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('newsletter.title', 'Palm Sunday Newsletter');
        $response->assertJsonPath('newsletter.status', 'published');

        $newsletter = Newsletter::first();
        $this->assertNotNull($newsletter);
        $this->assertFileExists(storage_path("app/private/{$newsletter->file_path}"));
    }

    public function test_admin_cannot_upload_a_non_pdf_newsletter(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/admin/newsletters', [
            'title' => 'Wrong File Newsletter',
            'publication_date' => '2026-03-29',
            'status' => 'published',
            'pdf' => UploadedFile::fake()->createWithContent('wrong.pdf', 'not a pdf'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('pdf');

        $this->assertDatabaseCount(Newsletter::class, 0);
    }

    public function test_public_newsletter_api_only_returns_published_newsletters(): void
    {
        Newsletter::create([
            'title' => 'Published Newsletter',
            'publication_date' => '2026-03-29',
            'file_path' => 'newsletters/published.pdf',
            'original_filename' => 'published.pdf',
            'file_size' => 123,
            'status' => 'published',
        ]);

        Newsletter::create([
            'title' => 'Draft Newsletter',
            'publication_date' => '2026-03-30',
            'file_path' => 'newsletters/draft.pdf',
            'original_filename' => 'draft.pdf',
            'file_size' => 123,
            'status' => 'draft',
        ]);

        $response = $this->getJson('/api/v1/newsletters');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.title', 'Published Newsletter');
        $response->assertJsonPath('data.0.view_url', '/newsletters/1/view');
        $response->assertJsonPath('data.0.download_url', '/newsletters/1/download');
    }

    public function test_admin_can_update_newsletter_metadata_without_replacing_pdf(): void
    {
        $user = User::factory()->create();

        $directory = storage_path('app/private/newsletters');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(storage_path('app/private/newsletters/original.pdf'), 'PDF content');

        $newsletter = Newsletter::create([
            'title' => 'Original Title',
            'publication_date' => '2026-03-29',
            'file_path' => 'newsletters/original.pdf',
            'original_filename' => 'original.pdf',
            'file_size' => 123,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($user)->postJson("/admin/newsletters/{$newsletter->id}", [
            'title' => 'Updated Title',
            'publication_date' => '2026-04-05',
            'description' => 'Updated notes.',
            'status' => 'published',
        ]);

        $response->assertOk();
        $response->assertJsonPath('newsletter.title', 'Updated Title');
        $this->assertDatabaseHas(Newsletter::class, [
            'id' => $newsletter->id,
            'title' => 'Updated Title',
            'file_path' => 'newsletters/original.pdf',
        ]);
        $this->assertFileExists(storage_path('app/private/newsletters/original.pdf'));
    }
}
