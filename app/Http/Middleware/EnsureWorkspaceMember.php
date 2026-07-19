<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->current_workspace_id) {
            return response()->json(['message' => 'No workspace selected.'], 403);
        }

        if (!$user->belongsToWorkspace($user->current_workspace_id)) {
            return response()->json(['message' => 'Not a member of this workspace.'], 403);
        }

        return $next($request);
    }
}
