<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Newsletter;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('newsletters:publish-due', function () {
    $publishedCount = Newsletter::publishDueDrafts();

    $this->info("Published {$publishedCount} due newsletter(s).");
})->purpose('Publish draft newsletters whose publication date has arrived');

Schedule::command('newsletters:publish-due')->dailyAt('00:05');
