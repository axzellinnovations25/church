<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertRedirect(config('app.frontend_url').'/login');
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_login_requires_a_valid_email_address(): void
    {
        $response = $this->from('/login')->post('/login', [
            'email' => 'not-an-email',
            'password' => 'password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_api_login_uses_the_same_email_validation(): void
    {
        $response = $this->postJson('/auth-api/login', [
            'email' => 'not-an-email',
            'password' => 'password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_api_login_replaces_an_existing_authenticated_session(): void
    {
        $mainAdmin = User::factory()->create([
            'email' => 'main@example.com',
            'is_main_admin' => true,
        ]);

        $groupAdmin = User::factory()->create([
            'email' => 'group@example.com',
            'is_main_admin' => false,
        ]);

        $response = $this->actingAs($mainAdmin)->postJson('/auth-api/login', [
            'email' => $groupAdmin->email,
            'password' => 'password',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.email', $groupAdmin->email);
        $response->assertJsonPath('user.is_main_admin', false);
        $this->assertAuthenticatedAs($groupAdmin);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
