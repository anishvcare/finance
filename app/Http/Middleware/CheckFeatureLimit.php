<?php

namespace App\Http\Middleware;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureLimit
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();
        if (!$user || !$user->current_workspace_id) {
            return $next($request);
        }

        $workspace = $user->currentWorkspace;
        $subscription = $workspace->subscription;
        $plan = $subscription?->plan;

        if (!$plan) {
            // Use free plan defaults
            $plan = Plan::where('slug', 'free')->first();
        }

        if (!$plan) {
            return $next($request); // No plan exists, skip check
        }

        $limit = $this->getLimit($plan, $feature);
        if ($limit === -1) {
            return $next($request); // Unlimited
        }

        $currentCount = $this->getCurrentCount($workspace->id, $feature);

        if ($currentCount >= $limit) {
            return response()->json([
                'message' => "You have reached the limit for {$feature} on your current plan. Please upgrade.",
                'limit' => $limit,
                'current' => $currentCount,
                'upgrade_required' => true,
            ], 403);
        }

        return $next($request);
    }

    private function getLimit(Plan $plan, string $feature): int
    {
        return match ($feature) {
            'products' => $plan->max_products,
            'services' => $plan->max_services,
            'customers' => $plan->max_customers,
            'invoices' => $plan->max_invoices_monthly,
            'bills' => $plan->max_bills_monthly,
            'transactions' => $plan->max_transactions_monthly,
            'ocr' => $plan->max_ocr_monthly,
            default => -1,
        };
    }

    private function getCurrentCount(int $workspaceId, string $feature): int
    {
        return match ($feature) {
            'products' => Product::withoutGlobalScopes()->where('workspace_id', $workspaceId)->count(),
            'services' => \App\Models\Service::withoutGlobalScopes()->where('workspace_id', $workspaceId)->count(),
            'customers' => \App\Models\Customer::withoutGlobalScopes()->where('workspace_id', $workspaceId)->count(),
            'invoices' => Invoice::withoutGlobalScopes()->where('workspace_id', $workspaceId)->whereMonth('created_at', now()->month)->count(),
            'bills' => \App\Models\Bill::withoutGlobalScopes()->where('workspace_id', $workspaceId)->whereMonth('created_at', now()->month)->count(),
            'transactions' => \App\Models\Transaction::withoutGlobalScopes()->where('workspace_id', $workspaceId)->whereMonth('created_at', now()->month)->count(),
            default => 0,
        };
    }
}
