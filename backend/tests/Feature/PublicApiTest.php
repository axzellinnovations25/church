<?php

namespace Tests\Feature;

use App\Mail\ParishRegistrationWelcome;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Group;
use App\Models\MassTime;
use App\Models\ParishRegistration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_events_endpoint_returns_only_published_events(): void
    {
        Event::create([
            'title' => 'Published Event',
            'description' => 'Visible to public.',
            'start_date' => '2026-05-01',
            'start_time' => '18:00',
            'end_time' => '20:00',
            'status' => 'published',
        ]);

        Event::create([
            'title' => 'Draft Event',
            'description' => 'Hidden from public.',
            'start_date' => '2026-05-02',
            'start_time' => '18:00',
            'end_time' => '20:00',
            'status' => 'draft',
        ]);

        $response = $this->getJson('/api/v1/events');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.title', 'Published Event');
    }

    public function test_public_event_image_route_serves_uploaded_poster_for_published_events(): void
    {
        $directory = storage_path('app/private/events');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents(storage_path('app/private/events/published-event.png'), base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pR4H8sAAAAASUVORK5CYII='));

        $event = Event::create([
            'title' => 'Published Event With Image',
            'description' => 'Visible to public.',
            'start_date' => '2026-05-01',
            'start_time' => '18:00',
            'end_time' => '20:00',
            'status' => 'published',
            'image_path' => 'events/published-event.png',
        ]);

        $response = $this->get("/events/{$event->id}/image");

        $response->assertOk();
        $response->assertHeader('content-type', 'image/png');
    }

    public function test_public_mass_times_endpoint_formats_times(): void
    {
        MassTime::create([
            'day' => 'Sunday',
            'start_time' => '09:00',
            'location' => 'Cathedral',
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/v1/mass-times');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.0.start_time', '09:00');
    }

    public function test_contact_endpoint_validates_and_stores_messages(): void
    {
        $invalidResponse = $this->postJson('/api/v1/contact', [
            'name' => 'J0hn',
            'email' => 'not-an-email',
            'phone' => 'phone-me',
            'subject' => '',
            'message' => 'short',
        ]);

        $invalidResponse->assertStatus(422);
        $invalidResponse->assertJsonValidationErrors(['name', 'email', 'phone', 'subject', 'message']);

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'John Smith',
            'email' => 'JOHN@example.com',
            'phone' => '01978263943',
            'subject' => 'Mass enquiry',
            'message' => 'Could you tell me the weekday Mass time?',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas(ContactMessage::class, [
            'email' => 'john@example.com',
            'subject' => 'Mass Enquiry',
        ]);
    }

    public function test_contact_endpoint_can_store_group_join_enquiries(): void
    {
        $group = Group::create([
            'name' => 'Youth Group',
            'slug' => 'youth-group',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'John Smith',
            'email' => 'john@example.com',
            'phone' => '01978263943',
            'subject' => 'Joining Youth Group',
            'category' => 'group_join',
            'group_id' => $group->id,
            'message' => 'I would like to join the youth group and learn more about when you meet.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas(ContactMessage::class, [
            'email' => 'john@example.com',
            'category' => 'group_join',
            'group_id' => $group->id,
            'status' => 'new',
        ]);
    }

    public function test_parish_registration_endpoint_validates_required_personal_details(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/parish-registrations', [
            'registration_type' => 'family',
            'full_name' => 'J0hn',
            'date_of_birth' => '2999-01-01',
            'gender' => 'unknown',
            'address_line1' => '1',
            'city' => 'Wr3xham',
            'postcode' => 'bad-postcode',
            'phone' => 'phone-me',
            'email' => 'not-an-email',
            'consent_confirmed' => false,
            'signature' => 'J0hn',
            'signed_date' => '2999-01-01',
            'children' => [
                [
                    'child_name' => 'Child One',
                    'date_of_birth' => '2999-01-01',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'full_name',
            'date_of_birth',
            'gender',
            'address_line1',
            'city',
            'postcode',
            'phone',
            'email',
            'consent_confirmed',
            'signature',
            'signed_date',
            'children.0.date_of_birth',
        ]);

        $this->assertDatabaseCount(ParishRegistration::class, 0);
    }

    public function test_individual_parish_registration_rejects_children(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/parish-registrations', [
            'registration_type' => 'individual',
            'full_name' => 'Jane Smith',
            'date_of_birth' => '1990-01-01',
            'gender' => 'female',
            'address_line1' => '1 High Street',
            'city' => 'Wrexham',
            'postcode' => 'LL11 1AA',
            'phone' => '01978263943',
            'email' => 'jane@example.com',
            'consent_confirmed' => true,
            'signature' => 'Jane Smith',
            'signed_date' => '2026-04-01',
            'children' => [
                [
                    'child_name' => 'Child One',
                    'date_of_birth' => '2019-04-01',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('children');
        $this->assertDatabaseCount(ParishRegistration::class, 0);
    }

    public function test_family_parish_registration_stores_normalized_valid_data(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/parish-registrations', [
            'registration_type' => 'family',
            'full_name' => 'Jane Smith',
            'date_of_birth' => '1990-01-01',
            'gender' => 'female',
            'nationality' => 'British',
            'occupation' => 'Teacher',
            'address_line1' => '1 High Street',
            'city' => 'Wrexham',
            'postcode' => 'll11 1aa',
            'phone' => '01978 263943',
            'email' => 'JANE@example.com',
            'partner_name' => 'John Smith',
            'contact_by_phone' => true,
            'contact_by_email' => true,
            'consent_confirmed' => true,
            'signature' => 'Jane Smith',
            'signed_date' => '2026-04-01',
            'children' => [
                [
                    'child_name' => 'Child One',
                    'date_of_birth' => '2019-04-01',
                ],
            ],
            'interests' => [
                'volunteering' => true,
                'parish_groups' => false,
                'sacramental_preparation' => true,
                'weekly_newsletter' => true,
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas(ParishRegistration::class, [
            'full_name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'postcode' => 'LL11 1AA',
            'registration_type' => 'family',
        ]);

        Mail::assertSent(ParishRegistrationWelcome::class, function (ParishRegistrationWelcome $mail) {
            return $mail->hasTo('jane@example.com')
                && $mail->registration->member_id === 'SMC0001'
                && $mail->registration->full_name === 'Jane Smith'
                && $mail->registration->children->first()?->child_name === 'Child One'
                && $mail->registration->children->first()?->date_of_birth?->format('Y-m-d') === '2019-04-01'
                && (bool) $mail->registration->interest?->weekly_newsletter === true;
        });
    }
}
