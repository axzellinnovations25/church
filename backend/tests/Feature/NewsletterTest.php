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
        $user = User::factory()->create(['is_main_admin' => true]);

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
        $this->assertNotNull($newsletter->file_contents);
    }

    public function test_published_newsletter_remains_public_when_local_pdf_is_lost(): void
    {
        $user = User::factory()->create(['is_main_admin' => true]);
        $pdfContents = "%PDF-1.4\ndurable newsletter\n%%EOF";

        $this->actingAs($user)->postJson('/admin/newsletters', [
            'title' => 'Durable Newsletter',
            'publication_date' => '2026-03-29',
            'status' => 'published',
            'pdf' => UploadedFile::fake()->createWithContent('durable.pdf', $pdfContents),
        ])->assertCreated();

        $newsletter = Newsletter::firstOrFail();
        @unlink(storage_path("app/private/{$newsletter->file_path}"));

        $this->getJson('/api/v1/newsletters')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Durable Newsletter');

        $this->get("/newsletters/{$newsletter->id}/view")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertContent($pdfContents);

        $this->get("/newsletters/{$newsletter->id}/download")
            ->assertOk()
            ->assertDownload('durable.pdf');
    }

    public function test_existing_newsletters_receive_sample_pdfs_during_backfill(): void
    {
        $newsletter = Newsletter::create([
            'title' => 'Existing Parish Newsletter',
            'publication_date' => '2026-03-29',
            'file_path' => 'newsletters/missing.pdf',
            'original_filename' => 'missing.pdf',
            'file_size' => 0,
            'status' => 'published',
        ]);

        $migration = require database_path('migrations/2026_10_09_000001_backfill_newsletter_pdfs.php');
        $migration->up();

        $newsletter->refresh();
        $pdfContents = $newsletter->pdfContents();
        $this->assertNotNull($newsletter->file_contents);
        $this->assertStringStartsWith('%PDF-1.4', $pdfContents);
        $this->assertMatchesRegularExpression('/startxref\n(\d+)\n%%EOF\n$/', $pdfContents);
        preg_match('/startxref\n(\d+)\n%%EOF\n$/', $pdfContents, $xrefMatch);
        $this->assertSame('xref', substr($pdfContents, (int) $xrefMatch[1], 4));

        $this->getJson('/api/v1/newsletters')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Existing Parish Newsletter');

        $this->get("/newsletters/{$newsletter->id}/view")
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_admin_cannot_upload_a_non_pdf_newsletter(): void
    {
        $user = User::factory()->create(['is_main_admin' => true]);

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
        $directory = storage_path('app/private/newsletters');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(storage_path('app/private/newsletters/published.pdf'), 'PDF content');

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
        $user = User::factory()->create(['is_main_admin' => true]);

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

    public function test_successful_pdf_replacement_commits_new_file_before_removing_old_file(): void
    {
        $user = User::factory()->create(['is_main_admin' => true]);
        $directory = storage_path('app/private/newsletters');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        $oldPath = storage_path('app/private/newsletters/replace-old.pdf');
        file_put_contents($oldPath, '%PDF-1.4 old');
        $newsletter = Newsletter::create([
            'title' => 'Replace Me', 'publication_date' => '2026-04-05',
            'status' => 'draft', 'file_path' => 'newsletters/replace-old.pdf',
            'file_contents' => base64_encode('%PDF-1.4 old'),
            'original_filename' => 'replace-old.pdf', 'file_size' => 12,
        ]);

        $this->actingAs($user)->postJson('/admin/newsletters/'.$newsletter->id, [
            'title' => 'Replaced', 'publication_date' => '2026-04-05', 'status' => 'published',
            'pdf' => $this->fakePdf('replacement.pdf'),
        ])->assertOk();

        $newsletter->refresh();
        $this->assertNotSame('newsletters/replace-old.pdf', $newsletter->file_path);
        $this->assertFileDoesNotExist($oldPath);
        $this->assertFileExists(storage_path('app/private/'.$newsletter->file_path));
    }
}
