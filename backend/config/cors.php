<?php

$extraOrigins = array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_ORIGINS', '')),
));

// Misma lista que Sanctum stateful → mismos orígenes HTTPS en prod (www + apex + auth.*).
// Evita preflight sin Access-Control-Allow-Origin cuando la SPA está en www.* y login-cert en auth.*.
$appUrl = (string) env('APP_URL', 'http://localhost');
$scheme = parse_url($appUrl, PHP_URL_SCHEME) ?: 'http';
$statefulOrigins = [];
foreach (array_filter(array_map(
    'trim',
    explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', '')),
)) as $domain) {
    if ($domain === '') {
        continue;
    }
    $statefulOrigins[] = str_contains($domain, '://')
        ? $domain
        : "{$scheme}://{$domain}";
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        [
            env('FRONTEND_URL', 'http://localhost:5173'),
            env('APP_URL', 'http://localhost'),
        ],
        $extraOrigins,
        $statefulOrigins,
    )))),
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];