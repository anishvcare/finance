<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function show(Request $request, string $type): JsonResponse
    {
        $workspaceId = $request->user()->current_workspace_id;
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();

        return match ($type) {
            'sales' => $this->salesReport($workspaceId, $fromDate, $toDate),
            'purchases' => $this->purchasesReport($workspaceId, $fromDate, $toDate),
            'invoice-ageing' => $this->invoiceAgeingReport($workspaceId),
            'bill-ageing' => $this->billAgeingReport($workspaceId),
            'cash-flow' => $this->cashFlowReport($workspaceId, $fromDate, $toDate),
            'income-expense' => $this->incomeExpenseReport($workspaceId, $fromDate, $toDate),
            'profit-loss' => $this->profitLossReport($workspaceId, $fromDate, $toDate),
            default => response()->json(['message' => 'Report not found.'], 404),
        };
    }

    private function salesReport(int $workspaceId, string $from, string $to): JsonResponse
    {
        $invoices = Invoice::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'void', 'cancelled'])
            ->whereBetween('invoice_date', [$from, $to])
            ->selectRaw('
                COUNT(*) as count,
                SUM(total) as total_sales,
                SUM(amount_paid) as total_collected,
                SUM(balance_due) as total_outstanding,
                SUM(tax_amount) as total_tax
            ')
            ->first();

        $byCustomer = Invoice::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'void', 'cancelled'])
            ->whereBetween('invoice_date', [$from, $to])
            ->join('customers', 'invoices.customer_id', '=', 'customers.id')
            ->selectRaw('customers.name, customers.id, SUM(invoices.total) as total, COUNT(*) as count')
            ->groupBy('customers.id', 'customers.name')
            ->orderByDesc('total')
            ->limit(20)
            ->get();

        return response()->json([
            'type' => 'sales',
            'period' => ['from' => $from, 'to' => $to],
            'summary' => $invoices,
            'by_customer' => $byCustomer,
        ]);
    }

    private function purchasesReport(int $workspaceId, string $from, string $to): JsonResponse
    {
        $bills = Bill::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('bill_date', [$from, $to])
            ->selectRaw('COUNT(*) as count, SUM(total) as total, SUM(amount_paid) as paid, SUM(balance_due) as outstanding')
            ->first();

        $bySupplier = Bill::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('bill_date', [$from, $to])
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->selectRaw('suppliers.name, suppliers.id, SUM(bills.total) as total, COUNT(*) as count')
            ->groupBy('suppliers.id', 'suppliers.name')
            ->orderByDesc('total')
            ->limit(20)
            ->get();

        return response()->json([
            'type' => 'purchases',
            'period' => ['from' => $from, 'to' => $to],
            'summary' => $bills,
            'by_supplier' => $bySupplier,
        ]);
    }

    private function invoiceAgeingReport(int $workspaceId): JsonResponse
    {
        $invoices = Invoice::where('workspace_id', $workspaceId)
            ->where('balance_due', '>', 0)
            ->whereNotIn('status', ['draft', 'void', 'cancelled', 'paid'])
            ->with('customer:id,name,business_name')
            ->orderBy('due_date')
            ->get(['id', 'invoice_number', 'customer_id', 'due_date', 'total', 'balance_due', 'status']);

        $buckets = ['current' => 0, '1_30' => 0, '31_60' => 0, '61_90' => 0, 'over_90' => 0];
        foreach ($invoices as $inv) {
            $days = now()->diffInDays($inv->due_date, false);
            if ($days >= 0) $buckets['current'] += $inv->balance_due;
            elseif ($days >= -30) $buckets['1_30'] += $inv->balance_due;
            elseif ($days >= -60) $buckets['31_60'] += $inv->balance_due;
            elseif ($days >= -90) $buckets['61_90'] += $inv->balance_due;
            else $buckets['over_90'] += $inv->balance_due;
        }

        return response()->json([
            'type' => 'invoice-ageing',
            'buckets' => $buckets,
            'invoices' => $invoices,
            'total_outstanding' => array_sum($buckets),
        ]);
    }

    private function billAgeingReport(int $workspaceId): JsonResponse
    {
        $bills = Bill::where('workspace_id', $workspaceId)
            ->where('balance_due', '>', 0)
            ->whereNotIn('status', ['draft', 'cancelled', 'paid'])
            ->with('supplier:id,name,business_name')
            ->orderBy('due_date')
            ->get(['id', 'bill_number', 'supplier_id', 'due_date', 'total', 'balance_due', 'status']);

        $buckets = ['current' => 0, '1_30' => 0, '31_60' => 0, '61_90' => 0, 'over_90' => 0];
        foreach ($bills as $bill) {
            $days = now()->diffInDays($bill->due_date, false);
            if ($days >= 0) $buckets['current'] += $bill->balance_due;
            elseif ($days >= -30) $buckets['1_30'] += $bill->balance_due;
            elseif ($days >= -60) $buckets['31_60'] += $bill->balance_due;
            elseif ($days >= -90) $buckets['61_90'] += $bill->balance_due;
            else $buckets['over_90'] += $bill->balance_due;
        }

        return response()->json([
            'type' => 'bill-ageing',
            'buckets' => $buckets,
            'bills' => $bills,
            'total_outstanding' => array_sum($buckets),
        ]);
    }

    private function cashFlowReport(int $workspaceId, string $from, string $to): JsonResponse
    {
        $income = Payment::where('workspace_id', $workspaceId)
            ->where('type', 'incoming')->where('is_refund', false)
            ->whereBetween('payment_date', [$from, $to])
            ->sum('amount');

        $expense = Payment::where('workspace_id', $workspaceId)
            ->where('type', 'outgoing')->where('is_refund', false)
            ->whereBetween('payment_date', [$from, $to])
            ->sum('amount');

        $monthly = Payment::where('workspace_id', $workspaceId)
            ->where('is_refund', false)
            ->whereBetween('payment_date', [$from, $to])
            ->selectRaw("DATE_FORMAT(payment_date, '%Y-%m') as month, type, SUM(amount) as total")
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get();

        return response()->json([
            'type' => 'cash-flow',
            'period' => ['from' => $from, 'to' => $to],
            'total_income' => $income,
            'total_expense' => $expense,
            'net_flow' => $income - $expense,
            'monthly' => $monthly,
        ]);
    }

    private function incomeExpenseReport(int $workspaceId, string $from, string $to): JsonResponse
    {
        $income = Transaction::where('workspace_id', $workspaceId)
            ->where('type', 'income')
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        $expenses = Transaction::where('workspace_id', $workspaceId)
            ->where('type', 'expense')
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        $byCategory = Transaction::where('workspace_id', $workspaceId)
            ->where('type', 'expense')
            ->whereBetween('date', [$from, $to])
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->selectRaw('categories.name, categories.color, SUM(transactions.amount) as total')
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'type' => 'income-expense',
            'period' => ['from' => $from, 'to' => $to],
            'total_income' => $income,
            'total_expenses' => $expenses,
            'net' => $income - $expenses,
            'expenses_by_category' => $byCategory,
        ]);
    }

    private function profitLossReport(int $workspaceId, string $from, string $to): JsonResponse
    {
        $revenue = Invoice::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'void', 'cancelled'])
            ->whereBetween('invoice_date', [$from, $to])
            ->sum('total');

        $costs = Bill::where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->whereBetween('bill_date', [$from, $to])
            ->sum('total');

        return response()->json([
            'type' => 'profit-loss',
            'period' => ['from' => $from, 'to' => $to],
            'revenue' => $revenue,
            'costs' => $costs,
            'gross_profit' => $revenue - $costs,
            'note' => 'This is a management estimate, not a formal accounting statement.',
        ]);
    }
}
