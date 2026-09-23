<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ActivationController extends Controller
{
    /**
     * Redeem an activation code for the signed-in account.
     *
     * On success the account also gets its first workspace, so it lands on a
     * working dashboard and can switch between Business and Personal straight
     * away rather than being handed off to a separate setup step.
     */
    public function activate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:32',
            'workspace_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        if ($user->activated_at !== null) {
            return response()->json([
                'message' => 'This account is already activated.',
                'data' => $this->userPayload($user),
            ]);
        }

        $code = ActivationCode::normalise($validated['code']);

        $result = DB::transaction(function () use ($code, $user, $validated) {
            /*
             * Claim the code with a conditional UPDATE on used_by IS NULL.
             * Two requests racing for the same code cannot both match, so a
             * code can only ever be redeemed once. Doing this as a
             * select-then-update would leave a window where both succeed.
             */
            $claimed = ActivationCode::where('code', $code)
                ->whereNull('used_by')
                ->update([
                    'used_by' => $user->id,
                    'used_at' => now(),
                    'updated_at' => now(),
                ]);

            if ($claimed === 0) {
                // Distinguish "already redeemed" from "no such code" for a
                // useful message, without revealing anything a holder of the
                // code would not already know.
                $exists = ActivationCode::where('code', $code)->exists();

                throw ValidationException::withMessages([
                    'code' => $exists
                        ? 'This activation code has already been used.'
                        : 'That activation code is not valid.',
                ]);
            }

            $workspace = $this->provisionWorkspace($user, $validated['workspace_name'] ?? null);

            $user->update([
                'activated_at' => now(),
                'onboarding_completed' => true,
                'current_workspace_id' => $workspace->id,
            ]);

            return $workspace;
        });

        return response()->json([
            'message' => 'Account activated.',
            'data' => $this->userPayload($user->fresh()),
            'workspace' => $result,
        ]);
    }

    /**
     * Give a freshly activated account something to land on. Only one workspace
     * is created; the sidebar switcher creates the other type on first use.
     */
    private function provisionWorkspace($user, ?string $name): Workspace
    {
        $workspace = Workspace::create([
            'name' => $name ?: 'My Business',
            'type' => 'business',
            'owner_id' => $user->id,
            'currency' => 'INR',
            'timezone' => $user->timezone && $user->timezone !== 'UTC' ? $user->timezone : 'Asia/Kolkata',
        ]);

        $workspace->members()->attach($user->id, [
            'role' => 'owner',
            'accepted_at' => now(),
        ]);

        WorkspaceSettings::create([
            'workspace_id' => $workspace->id,
            'business_name' => $workspace->name,
        ]);

        return $workspace;
    }

    private function userPayload($user): array
    {
        return $user->load(['currentWorkspace', 'workspaces'])->toArray();
    }
}
