<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\MassTimeController;
use App\Http\Controllers\Admin\NewsletterController;
use App\Http\Controllers\Admin\NewsPostController;
use App\Http\Controllers\Admin\OverviewController;
use App\Http\Controllers\Admin\ParishRegistrationController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\ParishCouncilMemberController;
use App\Http\Controllers\Admin\GalleryImageController;
use App\Http\Controllers\Admin\AdminAccountController;
use App\Http\Controllers\Admin\GroupController;
use App\Http\Controllers\Admin\GroupMemberController;
use App\Http\Controllers\Auth\ApiAuthController;
use App\Http\Controllers\EventImageController;
use App\Http\Controllers\NewsletterFileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('events/{event}/image', [EventImageController::class, 'show'])
    ->name('events.image');

Route::get('/dashboard', function () {
    return redirect()->away(rtrim(config('app.frontend_url'), '/').'/dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('overview', [OverviewController::class, 'index'])
        ->name('overview');

    Route::get('header-summary', [OverviewController::class, 'headerSummary'])
        ->name('header-summary');

    Route::patch('overview/items/visibility', [OverviewController::class, 'updateItemVisibility'])
        ->name('overview.items.visibility');

    Route::get('events/by-date', [EventController::class, 'byDate'])
        ->name('events.by-date');

    Route::get('events/{event}/image', [EventController::class, 'image'])
        ->name('events.admin-image');

    Route::resource('events', EventController::class);

    Route::get('contact-messages', [ContactMessageController::class, 'index'])
        ->name('contact-messages.index');

    Route::get('contact-messages/{contactMessage}', [ContactMessageController::class, 'show'])
        ->name('contact-messages.show');

    Route::patch('contact-messages/{contactMessage}', [ContactMessageController::class, 'update'])
        ->name('contact-messages.update');

    Route::get('groups', [GroupController::class, 'index'])
        ->name('groups.index');

    Route::get('groups/{group}/edit', [GroupController::class, 'edit'])
        ->name('groups.edit');

    Route::post('groups/{group}/members', [GroupMemberController::class, 'store'])
        ->name('groups.members.store');

    Route::put('groups/{group}/members/{groupMember}', [GroupMemberController::class, 'update'])
        ->name('groups.members.update');

    Route::delete('groups/{group}/members/{groupMember}', [GroupMemberController::class, 'destroy'])
        ->name('groups.members.destroy');

    Route::middleware('main_admin')->group(function () {
        Route::resource('mass-times', MassTimeController::class)
            ->except(['show']);

        Route::get('mass-times/by-day', [MassTimeController::class, 'byDay'])
            ->name('mass-times.by-day');

        Route::post('newsletters/{newsletter}', [NewsletterController::class, 'update'])
            ->name('newsletters.update-post');

        Route::resource('newsletters', NewsletterController::class)
            ->except(['create', 'show', 'update']);

        Route::post('news/{newsPost}', [NewsPostController::class, 'update'])
            ->name('news.update-post');

        Route::resource('news', NewsPostController::class)
            ->parameters(['news' => 'newsPost'])
            ->except(['create', 'show', 'update']);

        Route::get('parish-registrations', [ParishRegistrationController::class, 'index'])
            ->name('parish-registrations.index');

        Route::get('parish-registrations/{parishRegistration}', [ParishRegistrationController::class, 'show'])
            ->name('parish-registrations.show');

        Route::delete('contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy'])
            ->name('contact-messages.destroy');

        Route::delete('/parish-registrations/{parishRegistration}', [ParishRegistrationController::class, 'destroy'])
            ->name('parish-registrations.destroy');

        Route::get('/parish-registrations/{parishRegistration}/edit',
            [ParishRegistrationController::class, 'edit'])
            ->name('parish-registrations.edit');

        Route::put('/parish-registrations/{parishRegistration}',
            [ParishRegistrationController::class, 'update'])
            ->name('parish-registrations.update');

        Route::post('groups/{group}', [GroupController::class, 'update'])
            ->name('groups.update-post');

        Route::post('groups', [GroupController::class, 'store'])
            ->name('groups.store');

        Route::delete('groups/{group}', [GroupController::class, 'destroy'])
            ->name('groups.destroy');

        Route::get('parish-council-members/{parishCouncilMember}/photo', [ParishCouncilMemberController::class, 'photo'])
            ->name('parish-council-members.photo');

        Route::resource('parish-council-members', ParishCouncilMemberController::class)
            ->except(['create', 'show', 'update']);

        Route::get('parish-council-members/{parishCouncilMember}/photo', [ParishCouncilMemberController::class, 'photo'])
            ->name('parish-council-members.photo');

        Route::post('parish-council-members/{parishCouncilMember}', [ParishCouncilMemberController::class, 'update'])
            ->name('parish-council-members.update-post');

        Route::get('gallery-images/{galleryImage}/image', [GalleryImageController::class, 'image'])
            ->name('gallery-images.image');

        Route::resource('gallery-images', GalleryImageController::class)
            ->except(['create', 'show', 'update']);

        Route::post('gallery-images/{galleryImage}', [GalleryImageController::class, 'update'])
            ->name('gallery-images.update-post');

        Route::post('admin-accounts', [AdminAccountController::class, 'store'])
            ->name('admin-accounts.store');

        Route::put('admin-accounts/{adminAccount}', [AdminAccountController::class, 'update'])
            ->name('admin-accounts.update');

        Route::delete('admin-accounts/{adminAccount}', [AdminAccountController::class, 'destroy'])
            ->name('admin-accounts.destroy');
    });
});

Route::get('newsletters/{newsletter}/view', [NewsletterFileController::class, 'view'])
    ->name('newsletters.view');

Route::get('newsletters/{newsletter}/download', [NewsletterFileController::class, 'download'])
    ->name('newsletters.download');

Route::prefix('auth-api')->group(function () {
    Route::get('csrf-token', [ApiAuthController::class, 'csrfToken']);
    Route::post('signup', [ApiAuthController::class, 'signup']);
    Route::post('login', [ApiAuthController::class, 'login']);
    Route::post('forgot-password', [ApiAuthController::class, 'forgotPassword']);
    Route::post('reset-password', [ApiAuthController::class, 'resetPassword']);

    Route::middleware('auth')->group(function () {
        Route::get('me', [ApiAuthController::class, 'me']);
        Route::post('logout', [ApiAuthController::class, 'logout']);
    });
});

require __DIR__.'/auth.php';
