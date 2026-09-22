<?php

namespace Tests\Feature;

use App\Models\ParishChild;
use App\Models\ParishInterest;
use App\Models\ParishRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminParishRegistrationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_another_child_to_an_existing_family_registration(): void
    {
        $admin = User::factory()->create([
            'is_main_admin' => true,
        ]);

        $registration = ParishRegistration::create([
            'registration_type' => 'family',
            'full_name' => 'Maria Joseph',
            'date_of_birth' => '1990-06-15',
            'gender' => 'female',
            'nationality' => 'British',
            'occupation' => 'Teacher',
            'address_line1' => '12 Cathedral Road',
            'city' => 'Birmingham',
            'postcode' => 'B1 1AA',
            'phone' => '+44 7700 900123',
            'email' => 'maria@example.com',
            'contact_by_phone' => true,
            'contact_by_email' => true,
            'consent_confirmed' => true,
            'signature' => 'Maria Joseph',
            'signed_date' => '2026-04-20',
        ]);

        ParishChild::create([
            'registration_id' => $registration->id,
            'child_name' => 'Anna Joseph',
            'date_of_birth' => '2018-09-10',
        ]);

        ParishInterest::create([
            'registration_id' => $registration->id,
            'volunteering' => true,
            'parish_groups' => false,
            'sacramental_preparation' => false,
            'weekly_newsletter' => true,
        ]);

        $response = $this->actingAs($admin)->putJson("/admin/parish-registrations/{$registration->id}", [
            'full_name' => 'Maria Joseph',
            'email' => 'maria@example.com',
            'phone' => '+44 7700 900123',
            'partner_name' => 'Paul Joseph',
            'children' => [
                [
                    'child_name' => 'Anna Joseph',
                    'date_of_birth' => '2018-09-10',
                ],
                [
                    'child_name' => 'Peter Joseph',
                    'date_of_birth' => '2021-02-04',
                ],
            ],
            'volunteering' => true,
            'parish_groups' => true,
            'sacramental_preparation' => false,
            'weekly_newsletter' => true,
        ]);

        $response->assertOk();
        $response->assertJsonPath('registration.children.0.child_name', 'Anna Joseph');
        $response->assertJsonPath('registration.children.1.child_name', 'Peter Joseph');
        $response->assertJsonCount(2, 'registration.children');

        $this->assertDatabaseHas('parish_children', [
            'registration_id' => $registration->id,
            'child_name' => 'Peter Joseph',
            'date_of_birth' => '2021-02-04',
        ]);
    }
}
