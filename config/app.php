<?php

return [
    'name' => env('APP_NAME', 'LifeLedger Pro'),
    'short_name' => env('APP_SHORT_NAME', 'LifeLedger'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'force_https' => (bool) env('FORCE_HTTPS', false),
    'timezone' => env('APP_TIMEZONE', 'UTC'),
    'locale' => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),
    'cipher' => 'AES-256-CBC',
    // Use ?: (not the env default arg) so the fallback also applies when
    // APP_KEY is present but EMPTY in .env (empty string bypasses the default).
    'key' => env('APP_KEY') ?: 'base64:LU1kJdsivPLeaMNzDlthMYN64hdtPb/bsmK4YTSGz0Y=',
    'previous_keys' => [],
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],
    'pwa_theme_color' => env('PWA_THEME_COLOR', '#2563EB'),
    'pwa_background_color' => env('PWA_BACKGROUND_COLOR', '#ffffff'),
    'default_currency' => env('DEFAULT_CURRENCY', 'USD'),
    'default_timezone' => env('DEFAULT_TIMEZONE', 'UTC'),
];
