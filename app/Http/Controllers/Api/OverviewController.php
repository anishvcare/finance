<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Invoice;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Consolidated cross-workspace overview.
 *
 * Every other endpoint is deliberately confined to a single workspace by
 * WorkspaceScope. This one intentionally reports across ALL workspaces the
 * authenticated user is a member of, so Business and Personal can be seen
 * side by side and rolled up.
 *
 * Because it bypasses the global scope it must always constrain queries to
 * the user's own workspace ids — never to an arbitrary workspace_id.
 */
class OverviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $from = $request->from_date ?? now()->startOfMonth()->toDateString();
        $to = $request->to_date ?? now()->toDateString();

        // Use a half-open range [from, toExclusive) instead of BETWEEN so rows whose
        // date column carries a time component are still included on the final day,
        // while remaining index-friendly (no DATE() wrapping).
        $toExclusive = \Illuminate\Support\Carbon::parse($to)->addDay()->toDateString();

        // Only workspaces this user actually belongs to.
        $workspaces = $request->user()->workspaces()->get(['workspaces.id', 'workspaces.name', 'workspaces.type', 'workspaces.currency']);
        $ids = $workspaces->pluck('id')->all();

        if (empty($ids)) {
            return response()->json([
                'period' => ['from' => $from, 'to' => $to],
                'workspaces' => [],
                'combined' => $this->emptyTotals(),
            ]);
        }

        // --- Cashbook income/expense per workspace (transactions) ---
        $txn = Transaction::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->whereNull('deleted_at')
            ->where('date', '>=', $from)
            ->where('date', '<', $toExclusive)
            ->selectRaw("
                workspace_id,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            ")
            ->groupBy('workspace_id')
            ->get()
            ->keyBy('workspace_id');

        // --- Receivables (invoices) per workspace ---
        $recv = Invoice::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->whereNull('deleted_at')
            ->selectRaw("
                workspace_id,
                SUM(CASE WHEN status IN ('finalised','sent','viewed','partially_paid','overdue') THEN balance_due ELSE 0 END) as outstanding,
                SUM(CASE WHEN status = 'overdue' THEN balance_due ELSE 0 END) as overdue,
                SUM(CASE WHEN status NOT IN ('draft','void','cancelled') AND invoice_date >= ? AND invoice_date < ? THEN total ELSE 0 END) as sales
            ", [$from, $toExclusive])
            ->groupBy('workspace_id')
            ->get()
            ->keyBy('workspace_id');

        // --- Payables (bills) per workspace ---
        $pay = Bill::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->whereNull('deleted_at')
            ->selectRaw("
                workspace_id,
                SUM(CASE WHEN status IN ('open','partially_paid','overdue') THEN balance_due ELSE 0 END) as outstanding,
                SUM(CASE WHEN status = 'overdue' THEN balance_due ELSE 0 END) as overdue,
                SUM(CASE WHEN status NOT IN ('draft','cancelled') AND bill_date >= ? AND bill_date < ? THEN total ELSE 0 END) as purchases
            ", [$from, $toExclusive])
            ->groupBy('workspace_id')
            ->get()
            ->keyBy('workspace_id');

        // --- Cash on hand (account balances) per workspace ---
        $cash = Account::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->whereNull('deleted_at')
            ->where('is_active', true)
            ->selectRaw('workspace_id, SUM(current_balance) as balance')
            ->groupBy('workspace_id')
            ->get()
            ->keyBy('workspace_id');

        $rows = $workspaces->map(function ($ws) use ($txn, $recv, $pay, $cash) {
            $income = (int) ($txn[$ws->id]->income ?? 0);
            $expense = (int) ($txn[$ws->id]->expense ?? 0);
            $receivable = (int) ($recv[$ws->id]->outstanding ?? 0);
            $payable = (int) ($pay[$ws->id]->outstanding ?? 0);
            $balance = (int) ($cash[$ws->id]->balance ?? 0);

            return [
                'id' => $ws->id,
                'name' => $ws->name,
                'type' => $ws->type,
                'currency' => $ws->currency,
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
                'sales' => (int) ($recv[$ws->id]->sales ?? 0),
                'purchases' => (int) ($pay[$ws->id]->purchases ?? 0),
                'receivable' => $receivable,
                'receivable_overdue' => (int) ($recv[$ws->id]->overdue ?? 0),
                'payable' => $payable,
                'payable_overdue' => (int) ($pay[$ws->id]->overdue ?? 0),
                'cash_balance' => $balance,
                // Net position: liquid cash plus what's owed to you, less what you owe.
                'net_position' => $balance + $receivable - $payable,
            ];
        })->values();

        // Mixed currencies make a single roll-up figure misleading, so flag it.
        $currencies = $workspaces->pluck('currency')->unique()->values();

        $combined = [
            'income' => (int) $rows->sum('income'),
            'expense' => (int) $rows->sum('expense'),
            'net' => (int) $rows->sum('net'),
            'sales' => (int) $rows->sum('sales'),
            'purchases' => (int) $rows->sum('purchases'),
            'receivable' => (int) $rows->sum('receivable'),
            'receivable_overdue' => (int) $rows->sum('receivable_overdue'),
            'payable' => (int) $rows->sum('payable'),
            'payable_overdue' => (int) $rows->sum('payable_overdue'),
            'cash_balance' => (int) $rows->sum('cash_balance'),
            'net_position' => (int) $rows->sum('net_position'),
            'currency' => $currencies->first(),
            'mixed_currencies' => $currencies->count() > 1,
        ];

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'workspaces' => $rows,
            'combined' => $combined,
        ]);
    }

    private function emptyTotals(): array
    {
        return [
            'income' => 0, 'expense' => 0, 'net' => 0, 'sales' => 0, 'purchases' => 0,
            'receivable' => 0, 'receivable_overdue' => 0, 'payable' => 0,
            'payable_overdue' => 0, 'cash_balance' => 0, 'net_position' => 0,
            'currency' => null, 'mixed_currencies' => false,
        ];
    }
}
