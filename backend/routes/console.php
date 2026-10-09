<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Newsletter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\Console\Command\Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('newsletters:publish-due', function () {
    $publishedCount = Newsletter::publishDueDrafts();

    $this->info("Published {$publishedCount} due newsletter(s).");
})->purpose('Publish draft newsletters whose publication date has arrived');

Schedule::command('newsletters:publish-due')->dailyAt('00:05');

Artisan::command('admin:provision {email} {--name=}', function () {
    if (User::query()->where('is_main_admin', true)->exists()) {
        $this->error('A main administrator already exists.');

        return Command::FAILURE;
    }

    $name = $this->option('name') ?: $this->ask('Administrator name');
    $password = $this->secret('Password');
    $confirmation = $this->secret('Confirm password');
    $validated = Validator::make([
        'name' => $name,
        'email' => $this->argument('email'),
        'password' => $password,
        'password_confirmation' => $confirmation,
    ], [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'confirmed', Password::defaults()],
    ])->validate();

    DB::transaction(fn () => User::create([
        'name' => $validated['name'],
        'email' => strtolower($validated['email']),
        'password' => Hash::make($validated['password']),
        'is_main_admin' => true,
    ]));

    $this->info('Main administrator provisioned.');

    return Command::SUCCESS;
})->purpose('Provision the first main administrator from the trusted server console');
