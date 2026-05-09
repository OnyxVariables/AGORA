<?php

$extraOrigins = array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_ORIGINS', '')),
));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        [
            env('FRONTEND_URL', 'http://localhost:5173'),
            env('APP_URL', 'http://localhost'),
        ],
        $extraOrigins,
    )))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];