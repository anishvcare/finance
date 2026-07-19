<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'users' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'new_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
            'workspaces' => [
                'total' => Workspace::count(),
                'personal' => Workspace::where('type', 'personal')->count(),
                'business' => Workspace::where('type', 'business')->count(),
            ],
            'system' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'queue_pending' => DB::table('jobs')->count(),
                'queue_failed' => DB::table('failed_jobs')->count(),
                'storage_used_mb' => round(disk_total_space(storage_path()) > 0 ? (disk_total_space(storage_path()) - disk_free_space(storage_path())) / 1048576 : 0),
                'last_cron_check' => cache('last_schedule_run'),
            ],
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $users = User::withCount('workspaces')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->when($request->status === 'suspended', fn($q) => $q->where('is_active', false))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($users);
    }

    public function suspendUser(Request $request, User $user): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user->update(['is_active' => false]);
        return response()->json(['message' => 'User suspended.']);
    }

    public function activateUser(Request $request, User $user): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user->update(['is_active' => true]);
        return response()->json(['message' => 'User activated.']);
    }

    public function plans(): JsonResponse
    {
        return response()->json(['data' => Plan::orderBy('sort_order')->get()]);
    }

    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'max_workspaces' => 'sometimes|integer',
            'max_members' => 'sometimes|integer',
            'max_products' => 'sometimes|integer',
            'max_invoices_monthly' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);
        return response()->json(['data' => $plan->fresh()]);
    }

    public function healthCheck(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'storage' => is_writable(storage_path()),
            'cache' => $this->checkCache(),
            'queue' => DB::table('failed_jobs')->where('failed_at', '>=', now()->subHour())->count() === 0,
        ];

        return response()->json([
            'healthy' => !in_array(false, $checks),
            'checks' => $checks,
        ]);
    }

    private function checkDatabase(): bool
    {
        try { DB::connection()->getPdo(); return true; } catch (\Exception $e) { return false; }
    }

    private function checkCache(): bool
    {
        try { cache(['health_check' => true], 5); return cache('health_check') === true; } catch (\Exception $e) { return false; }
    }
}
