<?php

namespace Tests\Feature;

use App\Models\Newsletter;
use App\Models\User;
use App\Support\ImageStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SupabaseMediaStorageTest extends TestCase
{
    use RefreshDatabase;

    private function fakeBucket(array &$objects): void
    {
        config()->set('services.supabase_storage.url', 'https://storage.example.test');
        config()->set('services.supabase_storage.key', 'test-service-key');
        config()->set('services.supabase_storage.bucket', 'cathedral-images');

        Http::fake(function (Request $request) use (&$objects) {
            $urlPath = rawurldecode((string) parse_url($request->url(), PHP_URL_PATH));
            $path = preg_replace('~^/storage/v1/object/(?:authenticated/)?cathedral-images/~', '', $urlPath);

            if ($request->method() === 'POST') {
                $objects[$path] = $request->body();
                return Http::response(['Key' => $path], 200);
            }

            if ($request->method() === 'DELETE') {
                foreach ($request->data()['prefixes'] ?? [] as $prefix) {
                    unset($objects[$prefix]);
                }
                return Http::response([], 200);
            }

            if (! array_key_exists($path, $objects)) {
                return Http::response([], 404);
            }

            return Http::response($request->method() === 'HEAD' ? '' : $objects[$path], 200, [
                'Content-Type' => str_ends_with($path, '.pdf') ? 'application/pdf' : 'image/png',
            ]);
        });
    }

    public function test_newsletter_upload_and_download_use_only_supabase(): void
    {
        $objects = [];
        $this->fakeBucket($objects);
        $admin = User::factory()->create(['is_main_admin' => true]);
        $pdf = "%PDF-1.4\nStorage test\n%%EOF";

        $id = $this->actingAs($admin)->postJson('/admin/newsletters', [
            'title' => 'Weekly Newsletter',
            'publication_date' => now()->toDateString(),
            'status' => 'published',
            'pdf' => UploadedFile::fake()->createWithContent('weekly.pdf', $pdf),
        ])->assertCreated()->json('newsletter.id');

        $newsletter = Newsletter::findOrFail($id);
        $this->assertStringStartsWith('remote/newsletters/', $newsletter->file_path);
        $this->assertNull($newsletter->file_contents);
        $this->assertSame($pdf, $objects[$newsletter->file_path]);
        $this->assertFileDoesNotExist(storage_path('app/private/'.$newsletter->file_path));

        $this->get('/newsletters/'.$id.'/view')->assertOk()->assertContent($pdf);
        $this->get('/newsletters/'.$id.'/download')->assertOk()->assertDownload('weekly.pdf');
    }

    public function test_images_have_no_local_fallback(): void
    {
        $objects = [];
        $this->fakeBucket($objects);
        $image = UploadedFile::fake()->createWithContent('photo.png', 'image-bytes');

        $path = ImageStorage::store($image, 'gallery-images');

        $this->assertStringStartsWith('remote/gallery-images/', $path);
        $this->assertSame('image-bytes', $objects[$path]);
        $this->assertFileDoesNotExist(storage_path('app/private/'.$path));
        $this->assertSame('image-bytes', ImageStorage::serve($path)->getContent());

        ImageStorage::delete($path);
        $this->assertArrayNotHasKey($path, $objects);
    }

    public function test_legacy_database_pdf_can_be_migrated_to_bucket(): void
    {
        $objects = [];
        $this->fakeBucket($objects);
        $pdf = "%PDF-1.4\nLegacy edition\n%%EOF";
        $newsletter = Newsletter::create([
            'title' => 'Legacy Edition',
            'publication_date' => now()->toDateString(),
            'file_path' => 'newsletters/legacy.pdf',
            'file_contents' => base64_encode($pdf),
            'original_filename' => 'legacy.pdf',
            'file_size' => strlen($pdf),
            'status' => 'published',
        ]);

        $this->artisan('storage:migrate-newsletters')->assertExitCode(0);

        $this->assertSame($pdf, $objects['newsletters/legacy.pdf']);
        $this->assertNull($newsletter->fresh()->file_contents);
        $this->get('/newsletters/'.$newsletter->id.'/view')->assertOk()->assertContent($pdf);
    }
}
