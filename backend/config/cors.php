<?php

$envFrontendUrls = array_filter(array_map(function ($url) {
    return rtrim(trim($url), '/');
}, explode(',', (string) env('FRONTEND_URL', ''))));

$defaultOrigins = [
    'https://churchst.netlify.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
];

$allowedOrigins = array_values(array_unique(array_merge($defaultOrigins, $envFrontendUrls)));

return [
    'paths' => [
        'api/*',
        'auth-api/*',
        'admin/*',
        'profile',
        'password',
        'newsletters/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [
        '#^https://.*\.netlify\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
