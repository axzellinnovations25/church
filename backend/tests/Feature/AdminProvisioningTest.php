<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProvisioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_trusted_console_can_provision_first_main_administrator(): void
    {
        $this->artisan('admin:provision', [
            'email' => 'operator@example.test',
            '--name' => 'Site Operator',
        ])->expectsQuestion('Password', 'StrongPass12!')
            ->expectsQuestion('Confirm password', 'StrongPass12!')
            ->expectsOutput('Main administrator provisioned.')
            ->assertSuccessful();

        $this->assertDatabaseHas(User::class, [
            'email' => 'operator@example.test',
            'is_main_admin' => true,
        ]);
    }

    public function test_console_refuses_to_provision_a_second_main_administrator(): void
    {
        User::factory()->create(['is_main_admin' => true]);

        $this->artisan('admin:provision', [
            'email' => 'second@example.test',
            '--name' => 'Second Operator',
        ])->expectsOutput('A main administrator already exists.')
            ->assertFailed();

        $this->assertDatabaseMissing(User::class, ['email' => 'second@example.test']);
    }
}
