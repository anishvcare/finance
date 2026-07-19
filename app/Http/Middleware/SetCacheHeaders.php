<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCacheHeaders
{
    public function handle(Request $request, Closure $next, string $type = 'private'): Response
    {
        $response = $next($request);

        if ($type === 'static') {
            $response->headers->set('Cache-Control', 'public, max-age=31536000, immutable');
        } elseif ($type === 'private') {
            $response->headers->set('Cache-Control', 'private, no-store');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }
}
