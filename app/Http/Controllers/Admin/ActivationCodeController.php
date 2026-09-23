<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Super-admin management of activation codes.
 *
 * Every method re-checks isSuperAdmin(). These endpoints expose and mint
 * credentials that grant access to the platform, so the guard is not left to
 * the route definition alone.
 */
class ActivationCodeController extends Controller
{
    private const MAX_PER_BATCH = 500;

    public function index(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessSuperAdmin($request)) {
            return $denied;
        }

        $status = $request->query('status', 'all');

        $query = ActivationCode::with([
            'creator:id,name',
            'user:id,name,email',
        ])->latest('id');

        if ($status === 'unused') {
            $query->unused();
        } elseif ($status === 'used') {
            $query->used();
        }

        $codes = $query->paginate((int) $request->query('per_page', 50));

        return response()->json([
            'data' => $codes->items(),
            'meta' => [
                'current_page' => $codes->currentPage(),
                'last_page' => $codes->lastPage(),
                'per_page' => $codes->perPage(),
                'total' => $codes->total(),
            ],
            'counts' => [
                'total' => ActivationCode::count(),
                'used' => ActivationCode::used()->count(),
                'unused' => ActivationCode::unused()->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($denied = $this->denyUnlessSuperAdmin($request)) {
            return $denied;
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:' . self::MAX_PER_BATCH,
            'note' => 'nullable|string|max:255',
        ]);

        $codes = ActivationCode::generateBatch(
            $validated['quantity'],
            $request->user()->id,
            $validated['note'] ?? null,
        );

        return response()->json([
            'data' => ActivationCode::whereIn('code', $codes)->latest('id')->get(),
            'message' => count($codes) . ' activation code(s) generated.',
        ], 201);
    }

    /**
     * Delete an unused code. Used codes are retained: they are the audit trail
     * of which account was activated by which code.
     */
    public function destroy(Request $request, ActivationCode $activationCode): JsonResponse
    {
        if ($denied = $this->denyUnlessSuperAdmin($request)) {
            return $denied;
        }

        if ($activationCode->isUsed()) {
            return response()->json([
                'message' => 'This code has already been used and cannot be deleted.',
            ], 422);
        }

        $activationCode->delete();

        return response()->json(null, 204);
    }

    private function denyUnlessSuperAdmin(Request $request): ?JsonResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return null;
    }
}
