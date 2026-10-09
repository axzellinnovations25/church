<?php

namespace Tests\Feature;

use App\Mail\ParishRegistrationWelcome;
use App\Models\ParishChild;
use App\Models\ParishInterest;
use App\Models\ParishRegistration;
use App\Models\ContactMessage;
use App\Models\Event;
use App\Models\Group;
use App\Models\GroupMember;
use App\Models\MassTime;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use RuntimeException;
use Tests\TestCase;

class DocumentedQaExecutionTest extends TestCase
{
    use RefreshDatabase;

    private function registrationData(array $overrides = []): array
    {
        return array_replace_recursive([
            'registration_type' => 'individual',
            'full_name' => 'Elena Williams',
            'date_of_birth' => '1990-05-03',
            'gender' => 'female',
            'nationality' => 'British',
            'occupation' => 'Teacher',
            'address_line1' => '10 Regent Street',
            'city' => 'Wrexham',
            'postcode' => 'LL11 1AA',
            'phone' => '01978 555123',
            'email' => 'elena@example.test',
            'contact_by_phone' => true,
            'contact_by_email' => true,
            'consent_confirmed' => true,
            'signature' => 'Elena Williams',
            'signed_date' => '2026-10-09',
            'interests' => [
                'volunteering' => true,
                'parish_groups' => false,
                'sacramental_preparation' => true,
                'weekly_newsletter' => true,
            ],
        ], $overrides);
    }

    public function test_auth_tc_001_public_signup_creates_an_ordinary_authenticated_account(): void
    {
        $response = $this->postJson('/auth-api/signup', [
            'name' => 'Alice Morgan',
            'email' => 'ALICE@example.test',
            'password' => 'StrongPass12!',
            'password_confirmation' => 'StrongPass12!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'alice@example.test')
            ->assertJsonPath('user.is_main_admin', false)
            ->assertJsonPath('user.group_id', null);
        $user = User::query()->sole();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Hash::check('StrongPass12!', $user->password));
        $this->assertNotSame('StrongPass12!', $user->password);
        $this->getJson('/auth-api/me')->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_auth_tc_002_duplicate_and_weak_signup_are_rejected_without_extra_accounts(): void
    {
        User::factory()->create(['email' => 'alice@example.test']);

        $this->postJson('/auth-api/signup', [
            'name' => 'Alice Morgan',
            'email' => 'ALICE@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);

        $this->assertDatabaseCount(User::class, 1);
        $this->assertGuest();
    }

    public function test_auth_tc_003_login_logout_and_final_identity_lifecycle(): void
    {
        $user = User::factory()->create(['email' => 'member@example.test']);

        $this->postJson('/auth-api/login', [
            'email' => ' MEMBER@example.test ',
            'password' => 'password',
            'remember' => true,
        ])->assertOk()->assertJsonPath('user.id', $user->id);
        $this->assertAuthenticatedAs($user);

        $this->postJson('/auth-api/logout')->assertOk();
        $this->assertGuest();
        $this->getJson('/auth-api/me')->assertUnauthorized();
    }

    public function test_auth_tc_004_invalid_login_is_rate_limited_after_five_attempts(): void
    {
        User::factory()->create(['email' => 'member@example.test']);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.44'])
                ->postJson('/auth-api/login', [
                    'email' => 'member@example.test',
                    'password' => 'wrong-password',
                ])->assertUnprocessable()->assertJsonValidationErrors('email');
        }

        $response = $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.44'])
            ->postJson('/auth-api/login', [
                'email' => 'member@example.test',
                'password' => 'wrong-password',
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertStringContainsString('Too many login attempts', $response->json('errors.email.0'));
        $this->assertGuest();
    }

    public function test_auth_tc_005_known_and_unknown_recovery_use_the_same_response(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'known@example.test']);

        $known = $this->postJson('/auth-api/forgot-password', ['email' => $user->email]);
        $unknown = $this->postJson('/auth-api/forgot-password', ['email' => 'unknown@example.test']);

        $known->assertOk();
        $unknown->assertOk();
        $this->assertSame($known->json('message'), $unknown->json('message'));
        Notification::assertSentToTimes($user, ResetPassword::class, 1);
    }

    public function test_auth_tc_006_reset_token_is_single_use_and_changes_credentials(): void
    {
        $user = User::factory()->create(['email' => 'reset@example.test']);
        $token = Password::createToken($user);
        $payload = [
            'token' => $token,
            'email' => $user->email,
            'password' => 'ChangedPass12!',
            'password_confirmation' => 'ChangedPass12!',
        ];

        $this->postJson('/auth-api/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('ChangedPass12!', $user->fresh()->password));
        $this->assertFalse(Hash::check('password', $user->fresh()->password));
        $this->postJson('/auth-api/reset-password', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/auth-api/reset-password', [...$payload, 'token' => 'invalid-token'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_reg_tc_001_individual_registration_matches_documented_contract(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/parish-registrations', $this->registrationData());

        $response->assertCreated()->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('member_id'));
        $this->assertDatabaseCount(ParishRegistration::class, 1);
        $this->assertDatabaseCount(ParishInterest::class, 1);
        $this->assertDatabaseCount(ParishChild::class, 0);
        Mail::assertSent(ParishRegistrationWelcome::class, 1);
    }

    public function test_reg_tc_002_family_registration_persists_two_children_and_interests_atomically(): void
    {
        Mail::fake();
        $payload = $this->registrationData([
            'registration_type' => 'family',
            'email' => 'family@example.test',
            'partner_name' => 'Morgan Williams',
            'children' => [
                ['child_name' => 'Child One', 'date_of_birth' => '2016-04-01'],
                ['child_name' => 'Child Two', 'date_of_birth' => '2019-07-12'],
            ],
        ]);

        $response = $this->postJson('/api/v1/parish-registrations', $payload);

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('member_id'));
        $this->assertDatabaseCount(ParishRegistration::class, 1);
        $this->assertDatabaseCount(ParishChild::class, 2);
        $this->assertDatabaseCount(ParishInterest::class, 1);
        Mail::assertSent(ParishRegistrationWelcome::class, 1);
    }

    public function test_reg_tc_003_invalid_boundaries_leave_no_partial_registration_data(): void
    {
        Mail::fake();
        $payload = $this->registrationData([
            'full_name' => 'X',
            'date_of_birth' => '2999-01-01',
            'postcode' => 'invalid',
            'email' => 'invalid',
            'consent_confirmed' => false,
            'signed_date' => '2999-01-01',
            'children' => [['child_name' => 'X', 'date_of_birth' => '2999-01-01']],
        ]);

        $this->postJson('/api/v1/parish-registrations', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'full_name', 'date_of_birth', 'postcode', 'email',
                'consent_confirmed', 'signed_date', 'children',
            ]);

        $this->assertDatabaseCount(ParishRegistration::class, 0);
        $this->assertDatabaseCount(ParishChild::class, 0);
        $this->assertDatabaseCount(ParishInterest::class, 0);
        Mail::assertNothingSent();
    }

    public function test_reg_tc_005_mail_failure_does_not_roll_back_saved_registration(): void
    {
        Mail::shouldReceive('to')->once()->andThrow(new RuntimeException('Synthetic mail failure'));

        $this->postJson('/api/v1/parish-registrations', $this->registrationData([
            'email' => 'mail-failure@example.test',
        ]))->assertOk()->assertJsonPath('success', true);

        $this->assertDatabaseHas(ParishRegistration::class, [
            'email' => 'mail-failure@example.test',
        ]);
        $this->assertDatabaseCount(ParishInterest::class, 1);
    }

    public function test_pro_tc_001_profile_update_normalizes_and_resets_verification_for_changed_email(): void
    {
        $user = User::factory()->create(['email' => 'old@example.test']);

        $this->actingAs($user)->patchJson('/profile', [
            'name' => ' Updated Member ',
            'email' => ' NEW@example.test ',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Updated Member')
            ->assertJsonPath('user.email', 'new@example.test');

        $this->assertDatabaseHas(User::class, [
            'id' => $user->id,
            'name' => 'Updated Member',
            'email' => 'new@example.test',
            'email_verified_at' => null,
        ]);
    }

    public function test_pro_tc_002_invalid_and_duplicate_profile_email_leave_original_values(): void
    {
        User::factory()->create(['email' => 'taken@example.test']);
        $user = User::factory()->create(['name' => 'Original Member', 'email' => 'original@example.test']);

        $this->actingAs($user)->patchJson('/profile', [
            'name' => '',
            'email' => 'taken@example.test',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email']);

        $this->assertDatabaseHas(User::class, [
            'id' => $user->id,
            'name' => 'Original Member',
            'email' => 'original@example.test',
        ]);
    }

    public function test_pro_tc_003_password_change_rejects_wrong_current_and_invalidates_old_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/password', [
            'current_password' => 'wrong-password',
            'password' => 'ChangedPass12!',
            'password_confirmation' => 'ChangedPass12!',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->assertTrue(Hash::check('password', $user->fresh()->password));

        $this->putJson('/password', [
            'current_password' => 'password',
            'password' => 'ChangedPass12!',
            'password_confirmation' => 'ChangedPass12!',
        ])->assertOk();
        $this->assertTrue(Hash::check('ChangedPass12!', $user->fresh()->password));
        $this->assertFalse(Hash::check('password', $user->fresh()->password));
    }

    public function test_pro_tc_004_account_delete_enforces_password_and_protects_main_admin(): void
    {
        $member = User::factory()->create(['is_main_admin' => false]);
        $this->actingAs($member)->deleteJson('/profile', ['password' => 'wrong-password'])
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertNotNull($member->fresh());
        $this->deleteJson('/profile', ['password' => 'password'])->assertOk();
        $this->assertNull($member->fresh());
        $this->assertGuest();

        $main = User::factory()->create(['is_main_admin' => true]);
        $this->actingAs($main)->deleteJson('/profile', ['password' => 'password'])->assertForbidden();
        $this->assertNotNull($main->fresh());
    }

    public function test_ovr_tc_001_main_and_group_counts_are_scoped_and_unassigned_is_denied(): void
    {
        $groupA = Group::create(['name' => 'Group A', 'slug' => 'group-a']);
        $groupB = Group::create(['name' => 'Group B', 'slug' => 'group-b']);
        foreach ([$groupA, $groupB] as $index => $group) {
            Event::create([
                'title' => 'Scoped Event '.$index,
                'start_date' => '2026-11-0'.($index + 1),
                'start_time' => '10:00',
                'end_time' => '11:00',
                'status' => 'published',
                'group_id' => $group->id,
            ]);
            ContactMessage::create([
                'name' => 'Contact '.$index,
                'email' => "contact{$index}@example.test",
                'phone' => '01978555123',
                'subject' => 'Scoped question',
                'category' => 'group_join',
                'message' => 'A synthetic scoped contact message.',
                'group_id' => $group->id,
            ]);
            GroupMember::create([
                'group_id' => $group->id,
                'name' => 'Member '.$index,
                'email' => "member{$index}@example.test",
                'role' => 'Member',
            ]);
        }
        MassTime::create([
            'day' => 'Sunday', 'start_time' => '09:00',
            'location' => 'Cathedral', 'status' => 'published',
        ]);
        ParishRegistration::create($this->registrationData(['interests' => []]));

        $main = User::factory()->create(['is_main_admin' => true]);
        $mainResponse = $this->actingAs($main)->getJson('/admin/overview')->assertOk();
        $mainResponse->assertJsonPath('stats.events.total', 2)
            ->assertJsonPath('stats.contact_messages.total', 2)
            ->assertJsonPath('stats.group_members.total', 2)
            ->assertJsonPath('stats.mass_times.total', 1)
            ->assertJsonPath('stats.registrations.total', 1);

        $groupAdmin = User::factory()->create(['is_main_admin' => false, 'group_id' => $groupA->id]);
        $groupResponse = $this->actingAs($groupAdmin)->getJson('/admin/overview')->assertOk();
        $groupResponse->assertJsonPath('stats.events.total', 1)
            ->assertJsonPath('stats.contact_messages.total', 1)
            ->assertJsonPath('stats.group_members.total', 1);
        $this->assertNotContains('Scoped Event 1', array_column($groupResponse->json('recent.events'), 'title'));

        $unassigned = User::factory()->create(['is_main_admin' => false, 'group_id' => null]);
        $this->actingAs($unassigned)->getJson('/admin/overview')->assertForbidden();
    }
}
