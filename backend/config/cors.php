<?php

$frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');

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

    'allowed_origins' => [$frontendUrl],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
