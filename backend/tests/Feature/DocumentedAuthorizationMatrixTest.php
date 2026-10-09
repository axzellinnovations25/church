<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\ContactMessage;
use App\Models\GalleryImage;
use App\Models\MassTime;
use App\Models\NewsPost;
use App\Models\Newsletter;
use App\Models\ParishCouncilMember;
use App\Models\ParishRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DocumentedAuthorizationMatrixTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<int, array{0: string, 1: string}> */
    private function mainOnlyRequests(): array
    {
        return [
            ['GET', '/admin/mass-times'], ['POST', '/admin/mass-times'],
            ['PUT', '/admin/mass-times/1'], ['DELETE', '/admin/mass-times/1'],
            ['GET', '/admin/news'], ['POST', '/admin/news'],
            ['POST', '/admin/news/1'], ['DELETE', '/admin/news/1'],
            ['GET', '/admin/newsletters'], ['POST', '/admin/newsletters'],
            ['POST', '/admin/newsletters/1'], ['DELETE', '/admin/newsletters/1'],
            ['GET', '/admin/gallery-images'], ['POST', '/admin/gallery-images'],
            ['POST', '/admin/gallery-images/1'], ['DELETE', '/admin/gallery-images/1'],
            ['GET', '/admin/parish-council-members'], ['POST', '/admin/parish-council-members'],
            ['POST', '/admin/parish-council-members/1'], ['DELETE', '/admin/parish-council-members/1'],
            ['GET', '/admin/parish-registrations'], ['GET', '/admin/parish-registrations/1'],
            ['PUT', '/admin/parish-registrations/1'], ['DELETE', '/admin/parish-registrations/1'],
            ['POST', '/admin/admin-accounts'], ['PUT', '/admin/admin-accounts/1'],
            ['DELETE', '/admin/admin-accounts/1'],
            ['DELETE', '/admin/contact-messages/1'],
        ];
    }

    public function test_sec_tc_001_every_main_only_collection_and_mutation_rejects_guest_group_and_unassigned_roles(): void
    {
        User::factory()->create(['is_main_admin' => false]);
        MassTime::create(['day' => 'Sunday', 'start_time' => '09:00', 'location' => 'Cathedral', 'status' => 'published']);
        NewsPost::create(['title' => 'Protected News', 'type' => 'news', 'status' => 'draft']);
        Newsletter::create([
            'title' => 'Protected Newsletter', 'publication_date' => now()->toDateString(),
            'file_path' => 'newsletters/protected.pdf', 'original_filename' => 'protected.pdf',
            'file_size' => 1, 'status' => 'draft',
        ]);
        GalleryImage::create(['title' => 'Protected Image', 'image_path' => 'gallery/protected.png', 'sort_order' => 1]);
        ParishCouncilMember::create(['name' => 'Protected Member', 'role' => 'Member']);
        ParishRegistration::create([
            'registration_type' => 'individual', 'full_name' => 'Protected Registrant',
            'date_of_birth' => '1990-01-01', 'gender' => 'female', 'address_line1' => '1 Test Street',
            'city' => 'Wrexham', 'postcode' => 'LL11 1AA', 'phone' => '01978555123',
            'email' => 'protected@example.test', 'consent_confirmed' => true,
            'signature' => 'Protected Registrant', 'signed_date' => now()->toDateString(),
        ]);
        ContactMessage::create([
            'name' => 'Protected Contact', 'email' => 'contact@example.test', 'phone' => '01978555123',
            'subject' => 'Protected message', 'category' => 'general',
            'message' => 'Synthetic protected contact message.',
        ]);

        foreach ($this->mainOnlyRequests() as [$method, $path]) {
            Auth::guard('web')->logout();
            $this->json($method, $path)->assertUnauthorized();
        }

        $group = Group::create(['name' => 'Scoped Group', 'slug' => 'scoped-group']);
        $groupAdmin = User::factory()->create([
            'is_main_admin' => false,
            'group_id' => $group->id,
        ]);
        foreach ($this->mainOnlyRequests() as [$method, $path]) {
            $response = $this->actingAs($groupAdmin)->json($method, $path);
            $this->assertSame(403, $response->status(), "Group admin {$method} {$path}");
        }

        $unassigned = User::factory()->create([
            'is_main_admin' => false,
            'group_id' => null,
        ]);
        foreach ($this->mainOnlyRequests() as [$method, $path]) {
            $response = $this->actingAs($unassigned)->json($method, $path);
            $this->assertSame(403, $response->status(), "Unassigned {$method} {$path}");
        }

        foreach ([
            'mass_times', 'news_posts', 'newsletters', 'gallery_images',
            'parish_council_members', 'parish_registrations', 'contact_messages',
        ] as $table) {
            $this->assertDatabaseCount($table, 1);
        }
        $this->assertDatabaseCount('users', 3);
    }
}
