<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Newsletter;
use App\Models\User;
use App\Support\SupabaseStorage;
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

Artisan::command('storage:migrate-newsletters {--dry-run}', function () {
    if (! filled(config('services.supabase_storage.url')) || ! filled(config('services.supabase_storage.key'))) {
        $this->error('Supabase storage is not configured.');

        return Command::FAILURE;
    }

    $migrated = 0;
    $alreadyStored = 0;
    $missing = 0;
    $failed = 0;
    $dryRun = (bool) $this->option('dry-run');

    DB::table('newsletters')->orderBy('id')->chunkById(25, function ($newsletters) use (&$migrated, &$alreadyStored, &$missing, &$failed, $dryRun): void {
        foreach ($newsletters as $newsletter) {
            $path = (string) $newsletter->file_path;
            $safePath = preg_match('~^(?:remote/)?newsletters/[A-Za-z0-9._/-]+\.pdf$~i', $path)
                && ! str_contains($path, '..');
            $target = $safePath ? $path : 'remote/newsletters/legacy-'.$newsletter->id.'.pdf';

            try {
                if (SupabaseStorage::exists($target)) {
                    if (! $dryRun && ($newsletter->file_contents !== null || $target !== $path)) {
                        DB::table('newsletters')->where('id', $newsletter->id)->update([
                            'file_path' => $target,
                            'file_contents' => null,
                        ]);
                    }
                    $alreadyStored++;
                    continue;
                }

                $contents = $newsletter->file_contents === null
                    ? null
                    : base64_decode((string) $newsletter->file_contents, true);

                if (($contents === null || $contents === false) && $safePath) {
                    $localPath = storage_path('app/private/'.$path);
                    $contents = is_file($localPath) ? file_get_contents($localPath) : null;
                }

                if (! is_string($contents) || ! str_starts_with($contents, '%PDF-')) {
                    $this->warn('Newsletter '.$newsletter->id.' has no recoverable PDF.');
                    $missing++;
                    continue;
                }

                if (! $dryRun) {
                    SupabaseStorage::storeBytes($target, $contents, 'application/pdf');
                    if (! SupabaseStorage::exists($target)) {
                        throw new RuntimeException('Uploaded object could not be verified.');
                    }
                    DB::table('newsletters')->where('id', $newsletter->id)->update([
                        'file_path' => $target,
                        'file_contents' => null,
                        'file_size' => strlen($contents),
                    ]);
                }
                $migrated++;
            } catch (Throwable $exception) {
                report($exception);
                $this->error('Newsletter '.$newsletter->id.' failed: '.$exception->getMessage());
                $failed++;
            }
        }
    });

    $this->info(($dryRun ? 'Dry run: ' : '')."{$migrated} to migrate/migrated; {$alreadyStored} already in Supabase; {$missing} missing; {$failed} failed.");

    return ($missing || $failed) ? Command::FAILURE : Command::SUCCESS;
})->purpose('Move legacy newsletter PDFs from database or local files into Supabase Storage');

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
