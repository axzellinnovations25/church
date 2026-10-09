<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\GalleryImage;
use App\Models\Group;
use App\Models\NewsPost;
use App\Models\Newsletter;
use App\Models\ParishCouncilMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DocumentedContentSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function mainAdmin(): User
    {
        $user = User::factory()->create(['is_main_admin' => true]);
        $this->actingAs($user);

        return $user;
    }

    private function writePrivateFile(string $path, string $contents): void
    {
        $fullPath = storage_path('app/private/'.$path);
        $directory = dirname($fullPath);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        file_put_contents($fullPath, $contents);
    }

    private function pngUpload(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII=')
        );
    }

    private function pdfUpload(string $name, string $marker = 'synthetic'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n{$marker}\n%%EOF");
    }

    public function test_nwl_tc_001_upload_persists_pdf_serves_both_dispositions_and_audits(): void
    {
        $this->mainAdmin();
        $id = $this->post('/admin/newsletters', [
            'title' => 'Weekly Edition',
            'publication_date' => now()->toDateString(),
            'description' => 'Parish updates.',
            'status' => 'published',
            'pdf' => $this->pdfUpload('weekly.pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('newsletter.id');

        $newsletter = Newsletter::findOrFail($id);
        $this->assertFileExists(storage_path('app/private/'.$newsletter->file_path));
        $this->assertNotNull($newsletter->file_contents);
        $this->assertDatabaseHas('audit_logs', ['action' => 'created newsletter', 'subject_id' => $id]);
        $this->get('/newsletters/'.$id.'/view')->assertOk()
            ->assertHeader('content-disposition', 'inline; filename="weekly.pdf"');
        $this->get('/newsletters/'.$id.'/download')->assertOk()->assertDownload('weekly.pdf');
    }

    public function test_nwl_tc_002_invalid_pdf_date_and_required_fields_leave_no_orphans(): void
    {
        $this->mainAdmin();
        $directory = storage_path('app/private/newsletters');
        $before = is_dir($directory) ? glob($directory.'/*') : [];

        $this->post('/admin/newsletters', [
            'title' => '',
            'publication_date' => now()->addDay()->toDateString(),
            'status' => 'published',
            'pdf' => UploadedFile::fake()->createWithContent('invalid.pdf', 'not a pdf'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors(['title', 'status', 'pdf']);

        $this->assertDatabaseCount(Newsletter::class, 0);
        $after = is_dir($directory) ? glob($directory.'/*') : [];
        $this->assertSame($before, $after);
    }

    public function test_nwl_tc_003_future_draft_is_private_then_auto_publishes_and_downloads_when_due(): void
    {
        $admin = $this->mainAdmin();
        $id = $this->post('/admin/newsletters', [
            'title' => 'Scheduled Edition',
            'publication_date' => now()->addDay()->toDateString(),
            'status' => 'draft',
            'pdf' => $this->pdfUpload('scheduled.pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('newsletter.id');

        Auth::guard('web')->logout();
        $this->getJson('/api/v1/newsletters')->assertOk()->assertJsonCount(0, 'data');
        $this->get('/newsletters/'.$id.'/view')->assertNotFound();
        $this->get('/newsletters/'.$id.'/download')->assertNotFound();

        $this->travel(1)->day();
        $this->getJson('/api/v1/newsletters')->assertOk()
            ->assertJsonPath('data.0.id', $id)
            ->assertJsonPath('data.0.status', 'published');
        $this->get('/newsletters/'.$id.'/download')->assertOk()->assertDownload('scheduled.pdf');
        $this->assertSame('published', Newsletter::findOrFail($id)->status);
        $this->travelBack();
        $this->assertNotNull($admin);
    }

    public function test_nwl_tc_004_metadata_and_pdf_replacement_removes_old_file_and_missing_id_is_404(): void
    {
        $this->mainAdmin();
        $id = $this->post('/admin/newsletters', [
            'title' => 'Original Edition',
            'publication_date' => now()->toDateString(),
            'status' => 'published',
            'pdf' => $this->pdfUpload('original.pdf', 'original'),
        ], ['Accept' => 'application/json'])->assertCreated()->json('newsletter.id');
        $oldPath = Newsletter::findOrFail($id)->file_path;

        $this->post('/admin/newsletters/'.$id, [
            'title' => 'Replacement Edition',
            'publication_date' => now()->toDateString(),
            'description' => 'Updated metadata.',
            'status' => 'published',
            'pdf' => $this->pdfUpload('replacement.pdf', 'replacement'),
        ], ['Accept' => 'application/json'])->assertOk();

        $updated = Newsletter::findOrFail($id);
        $this->assertSame('Replacement Edition', $updated->title);
        $this->assertSame('replacement.pdf', $updated->original_filename);
        $this->assertNotSame($oldPath, $updated->file_path);
        $this->assertFileDoesNotExist(storage_path('app/private/'.$oldPath));
        $this->assertFileExists(storage_path('app/private/'.$updated->file_path));
        $this->getJson('/admin/newsletters/999999/edit')->assertNotFound();
        $this->postJson('/admin/newsletters/999999', [
            'title' => 'Missing', 'publication_date' => now()->toDateString(), 'status' => 'draft',
        ])->assertNotFound();
    }

    public function test_cnt_tc_008_newsletter_view_download_headers_and_future_denial(): void
    {
        $pdf = "%PDF-1.4\nsynthetic QA PDF\n%%EOF";
        $published = Newsletter::create([
            'title' => 'Published Edition',
            'publication_date' => now()->toDateString(),
            'file_path' => 'newsletters/missing-published.pdf',
            'file_contents' => base64_encode($pdf),
            'original_filename' => 'published.pdf',
            'file_size' => strlen($pdf),
            'status' => 'published',
        ]);
        $future = Newsletter::create([
            'title' => 'Future Edition',
            'publication_date' => now()->addDay()->toDateString(),
            'file_path' => 'newsletters/future.pdf',
            'file_contents' => base64_encode($pdf),
            'original_filename' => 'future.pdf',
            'file_size' => strlen($pdf),
            'status' => 'draft',
        ]);

        $this->get('/newsletters/'.$published->id.'/view')->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertHeader('content-disposition', 'inline; filename="published.pdf"');
        $this->get('/newsletters/'.$published->id.'/download')->assertOk()
            ->assertHeader('content-type', 'application/pdf')
            ->assertDownload('published.pdf');
        $this->get('/newsletters/'.$future->id.'/view')->assertNotFound();
        $this->get('/newsletters/'.$future->id.'/download')->assertNotFound();
    }

    public function test_cnt_tc_010_public_groups_and_council_only_return_active_ordered_records(): void
    {
        Group::create(['name' => 'Zulu Active', 'slug' => 'zulu-active', 'is_active' => true]);
        Group::create(['name' => 'Alpha Active', 'slug' => 'alpha-active', 'is_active' => true]);
        Group::create(['name' => 'Hidden Group', 'slug' => 'hidden-group', 'is_active' => false]);

        $this->writePrivateFile('council/active.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));
        $this->writePrivateFile('council/inactive.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));
        $later = ParishCouncilMember::create([
            'name' => 'Later Member', 'role' => 'Member', 'sort_order' => 2,
            'is_active' => true, 'photo_path' => 'council/active.png',
        ]);
        $first = ParishCouncilMember::create([
            'name' => 'First Member', 'role' => 'Chair', 'sort_order' => 1,
            'is_active' => true, 'photo_path' => 'council/active.png',
        ]);
        $inactive = ParishCouncilMember::create([
            'name' => 'Hidden Member', 'role' => 'Former', 'sort_order' => 0,
            'is_active' => false, 'photo_path' => 'council/inactive.png',
        ]);

        $groups = $this->getJson('/api/v1/groups')->assertOk()->json('data');
        $this->assertSame(['Alpha Active', 'Zulu Active'], array_column($groups, 'name'));
        $members = $this->getJson('/api/v1/parish-council-members')->assertOk()->json('data');
        $this->assertSame([$first->id, $later->id], array_column($members, 'id'));
        $this->get('/api/v1/parish-council-members/'.$first->id.'/photo')->assertOk()
            ->assertHeader('content-type', 'image/png');
        $this->get('/api/v1/parish-council-members/'.$inactive->id.'/photo')->assertNotFound();
    }

    public function test_news_tc_007_duplicate_titles_remain_separately_addressable(): void
    {
        $this->mainAdmin();
        $payload = [
            'title' => 'Shared Headline', 'type' => 'news',
            'summary' => 'Synthetic summary.', 'content' => 'Synthetic content.',
            'published_at' => now()->toDateString(), 'status' => 'published',
        ];
        $first = $this->postJson('/admin/news', $payload)->assertCreated()->json('news_post.id');
        $second = $this->postJson('/admin/news', $payload)->assertCreated()->json('news_post.id');

        $this->assertNotSame($first, $second);
        $this->assertDatabaseCount(NewsPost::class, 2);
        $this->getJson('/api/v1/news/'.$first)->assertOk()->assertJsonPath('data.title', 'Shared Headline');
        $this->getJson('/api/v1/news/'.$second)->assertOk()->assertJsonPath('data.title', 'Shared Headline');
    }

    public function test_nwl_tc_007_duplicate_edition_metadata_keeps_distinct_ids_and_files(): void
    {
        $this->mainAdmin();
        $payload = [
            'title' => 'Shared Edition',
            'publication_date' => now()->toDateString(),
            'description' => 'Synthetic edition.',
            'status' => 'published',
        ];
        $first = $this->postJson('/admin/newsletters', [
            ...$payload,
            'pdf' => UploadedFile::fake()->createWithContent('first.pdf', '%PDF-1.4 first %%EOF'),
        ])->assertCreated()->json('newsletter.id');
        $second = $this->postJson('/admin/newsletters', [
            ...$payload,
            'pdf' => UploadedFile::fake()->createWithContent('second.pdf', '%PDF-1.4 second %%EOF'),
        ])->assertCreated()->json('newsletter.id');

        $this->assertNotSame($first, $second);
        $records = Newsletter::query()->orderBy('id')->get();
        $this->assertCount(2, $records);
        $this->assertNotSame($records[0]->file_path, $records[1]->file_path);
        $this->get('/newsletters/'.$first.'/view')->assertOk();
        $this->get('/newsletters/'.$second.'/view')->assertOk();
    }

    public function test_gal_tc_006_duplicate_title_and_order_keep_distinct_images(): void
    {
        $this->mainAdmin();
        $payload = ['title' => 'Shared Gallery Title', 'caption' => 'Synthetic image.', 'sort_order' => 4, 'is_active' => true];
        $first = $this->postJson('/admin/gallery-images', [
            ...$payload, 'image' => $this->pngUpload('first.png'),
        ])->assertCreated()->json('gallery_image.id');
        $second = $this->postJson('/admin/gallery-images', [
            ...$payload, 'image' => $this->pngUpload('second.png'),
        ])->assertCreated()->json('gallery_image.id');

        $records = GalleryImage::query()->orderBy('id')->get();
        $this->assertSame([$first, $second], $records->pluck('id')->all());
        $this->assertNotSame($records[0]->image_path, $records[1]->image_path);
        $publicIds = array_column($this->getJson('/api/v1/gallery-images')->assertOk()->json('data'), 'id');
        $this->assertEqualsCanonicalizing([$first, $second], $publicIds);
    }

    public function test_cou_tc_006_duplicate_person_and_order_keep_distinct_records(): void
    {
        $this->mainAdmin();
        $payload = ['name' => 'Shared Person', 'role' => 'Member', 'sort_order' => 3, 'is_active' => true];
        $first = $this->postJson('/admin/parish-council-members', [
            ...$payload, 'photo' => $this->pngUpload('first.png'),
        ])->assertCreated()->json('member.id');
        $second = $this->postJson('/admin/parish-council-members', [
            ...$payload, 'photo' => $this->pngUpload('second.png'),
        ])->assertCreated()->json('member.id');

        $this->assertNotSame($first, $second);
        $this->assertDatabaseCount(ParishCouncilMember::class, 2);
        $publicIds = array_column($this->getJson('/api/v1/parish-council-members')->assertOk()->json('data'), 'id');
        $this->assertEqualsCanonicalizing([$first, $second], $publicIds);
    }

    public function test_sec_tc_003_private_media_routes_enforce_visibility_mime_and_missing_files(): void
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII=');
        $this->writePrivateFile('events/public.png', $png);
        $publicEvent = Event::create([
            'title' => 'Public Event', 'start_date' => '2026-11-01',
            'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'published',
            'image_path' => 'events/public.png',
        ]);
        $draftEvent = Event::create([
            'title' => 'Draft Event', 'start_date' => '2026-11-02',
            'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'draft',
            'image_path' => 'events/public.png',
        ]);
        $missingEvent = Event::create([
            'title' => 'Missing File Event', 'start_date' => '2026-11-03',
            'start_time' => '10:00', 'end_time' => '11:00', 'status' => 'published',
            'image_path' => 'events/missing.png',
        ]);
        $this->get('/api/v1/events/'.$publicEvent->id.'/image')->assertOk()->assertHeader('content-type', 'image/png');
        $this->get('/api/v1/events/'.$draftEvent->id.'/image')->assertNotFound();
        $this->get('/api/v1/events/'.$missingEvent->id.'/image')->assertNotFound();
        $this->get('/api/v1/events/999999/image')->assertNotFound();

        $futureNews = NewsPost::create([
            'title' => 'Future News', 'type' => 'news', 'status' => 'published',
            'published_at' => now()->addDay(), 'image_path' => 'events/public.png',
        ]);
        $this->get('/api/v1/news/'.$futureNews->id.'/image')->assertNotFound();
        $this->get('/api/v1/news/..%2F.env/image')->assertNotFound();
    }
}
