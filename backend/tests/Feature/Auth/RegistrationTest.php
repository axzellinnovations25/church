<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    private string $validPassword = 'SecurePass123!';

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertRedirect(config('app.frontend_url').'/signup');
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $this->validPassword,
            'password_confirmation' => $this->validPassword,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_registration_requires_a_unique_email_address(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->from('/signup')->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $this->validPassword,
            'password_confirmation' => $this->validPassword,
        ]);

        $response->assertRedirect('/signup');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_registration_rejects_weak_passwords(): void
    {
        $response = $this->from('/signup')->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect('/signup');
        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_registration_requires_password_confirmation_to_match(): void
    {
        $response = $this->from('/signup')->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => $this->validPassword,
            'password_confirmation' => 'DifferentPass123!',
        ]);

        $response->assertRedirect('/signup');
        $response->assertSessionHasErrors('password');
        $this->assertGuest();
    }

    public function test_api_signup_uses_the_same_registration_validation(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/auth-api/signup', [
            'name' => 'Test User',
            'email' => 'TEST@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
        $this->assertGuest();
    }
}
