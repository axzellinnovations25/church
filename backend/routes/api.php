<?php

use Illuminate\Support\Facades\Route;

// API Controllers
use App\Http\Controllers\Api\V1\EventApiController;
use App\Http\Controllers\Api\V1\MassTimeApiController;
use App\Http\Controllers\Api\V1\ContactApiController;
use App\Http\Controllers\Api\V1\ParishRegistrationApiController;
use App\Http\Controllers\Api\V1\NewsletterApiController;
use App\Http\Controllers\Api\V1\NewsPostApiController;
use App\Http\Controllers\Api\V1\ParishCouncilMemberApiController;
use App\Http\Controllers\Api\V1\GroupApiController;
use App\Http\Controllers\Api\V1\GalleryImageApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes in this file automatically start with "/api".
| Example: /api/v1/events
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Events API
    |--------------------------------------------------------------------------
    */

    // GET /api/v1/events
    // Returns list of published events
    Route::get('events', [EventApiController::class, 'index']);

    // GET /api/v1/events/{id}
    // Returns a single event
    Route::get('events/{id}', [EventApiController::class, 'show']);
    Route::get('events/{id}/image', [EventApiController::class, 'image']);

    // POST /api/v1/contact
    // Store contact form message
    Route::post('contact', [ContactApiController::class, 'store']);


    /*
    |--------------------------------------------------------------------------
    | Mass Times API
    |--------------------------------------------------------------------------
    */

    // GET /api/v1/mass-times
    // Returns weekly mass schedule
    Route::get('mass-times', [MassTimeApiController::class, 'index']);


    /*
    |--------------------------------------------------------------------------
    | Parish Registration API
    |--------------------------------------------------------------------------
    */

    Route::post('parish-registrations', [ParishRegistrationApiController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Newsletter API
    |--------------------------------------------------------------------------
    */

    Route::get('newsletters', [NewsletterApiController::class, 'index']);
    Route::get('news', [NewsPostApiController::class, 'index']);
    Route::get('news/{id}', [NewsPostApiController::class, 'show']);
    Route::get('news/{id}/image', [NewsPostApiController::class, 'image']);

    /*
    |--------------------------------------------------------------------------
    | Parish Council API
    |--------------------------------------------------------------------------
    */

    Route::get('parish-council-members', [ParishCouncilMemberApiController::class, 'index']);
    Route::get('parish-council-members/{parishCouncilMember}/photo', [ParishCouncilMemberApiController::class, 'photo']);
    Route::get('groups', [GroupApiController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Photo Gallery API
    |--------------------------------------------------------------------------
    */

    Route::get('gallery-images', [GalleryImageApiController::class, 'index']);
    Route::get('gallery-images/{galleryImage}/image', [GalleryImageApiController::class, 'image']);
    
});
