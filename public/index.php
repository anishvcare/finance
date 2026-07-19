<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Safety net for shared hosting: remove any stale cached config/route/event
// files so the app always reads the real config/*.php files (which contain a
// valid fallback APP_KEY). A stale bootstrap/cache/config.php with an empty key
// is the usual cause of "No application encryption key has been specified".
foreach (['config.php', 'routes-v7.php', 'events.php'] as $__stale) {
    $__staleFile = __DIR__ . '/../bootstrap/cache/' . $__stale;
    if (is_file($__staleFile)) {
        @unlink($__staleFile);
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($__staleFile, true);
        }
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__ . '/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

$app->handleRequest(Request::capture());
