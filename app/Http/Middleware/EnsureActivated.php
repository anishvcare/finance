<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks the application until the account has redeemed an activation code.
 *
 * Applied to the workspace-scoped API group. It deliberately does NOT cover
 * /auth/user, /auth/activate or /auth/logout: the client needs to read its own
 * activation state, redeem a code, and be able to sign out while locked out.
 */
class EnsureActivated
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->activated_at === null) {
            return response()->json([
                'message' => 'Your account is not activated yet. Enter an activation code to continue.',
                'activation_required' => true,
            ], 403);
        }

        return $next($request);
    }
}
