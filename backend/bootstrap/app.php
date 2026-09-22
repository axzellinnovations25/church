<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting
    (
    // Web routes (browser pages)
    web: __DIR__ . '/../routes/web.php',

    // API routes (JSON endpoints)  ✅ THIS MUST EXIST
    api: __DIR__ . '/../routes/api.php',

    // Console routes (artisan commands)
    commands: __DIR__ . '/../routes/console.php',

    // Health check route
    health: '/up',
)

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'main_admin' => \App\Http\Middleware\EnsureMainAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
