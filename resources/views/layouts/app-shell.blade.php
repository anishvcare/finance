<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="{{ config('app.pwa_theme_color', '#2563EB') }}">
    <title>{{ config('app.name', 'LifeLedger Pro') }}</title>
    <link rel="icon" href="/icons/favicon.ico">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="min-h-screen bg-gray-50 antialiased">
    <div id="app"></div>
    <noscript>
        <div style="padding: 2rem; text-align: center;">
            <h1>JavaScript Required</h1>
            <p>Please enable JavaScript to use {{ config('app.name', 'LifeLedger Pro') }}.</p>
        </div>
    </noscript>
</body>
</html>
