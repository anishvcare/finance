<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Commitment;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaceId = $request->user()->current_workspace_id;

        // Business summary
        $invoiceSummary = Invoice::where('workspace_id', $workspaceId)
            ->selectRaw("
                COUNT(CASE WHEN status NOT IN ('draft','void','cancelled') THEN 1 END) as total_invoices,
                SUM(CASE WHEN status NOT IN ('draft','void','cancelled') THEN total ELSE 0 END) as total_sales,
                SUM(CASE WHEN status IN ('finalised','sent','viewed','partially_paid','overdue') THEN balance_due ELSE 0 END) as outstanding,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
                SUM(CASE WHEN status = 'overdue' THEN balance_due ELSE 0 END) as overdue_amount
            ")
            ->first();

        $billSummary = Bill::where('workspace_id', $workspaceId)
            ->selectRaw("
                SUM(CASE WHEN status NOT IN ('draft','cancelled') THEN total ELSE 0 END) as total_expenses,
                SUM(CASE WHEN status IN ('open','partially_paid','overdue') THEN balance_due ELSE 0 END) as outstanding,
                COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
            ")
            ->first();

        $paymentsReceived = Payment::where('workspace_id', $workspaceId)
            ->where('type', 'incoming')
            ->where('is_refund', false)
            ->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount');

        $paymentsMade = Payment::where('workspace_id', $workspaceId)
            ->where('type', 'outgoing')
            ->where('is_refund', false)
            ->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount');

        // Tasks and commitments
        $tasksDueToday = Task::where('workspace_id', $workspaceId)
            ->where('status', '!=', 'completed')
            ->where('due_date', today())
            ->count();

        $overdueTasks = Task::where('workspace_id', $workspaceId)
            ->where('status', '!=', 'completed')
            ->where('due_date', '<', today())
            ->count();

        $commitmentsDueSoon = Commitment::where('workspace_id', $workspaceId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->where('due_date', '<=', now()->addDays(7))
            ->count();

        // Leads
        $openLeadStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
        $leadSummary = Lead::where('workspace_id', $workspaceId)
            ->selectRaw("
                COUNT(CASE WHEN stage IN ('new','contacted','qualified','proposal','negotiation') THEN 1 END) as open_leads,
                COUNT(CASE WHEN priority = 'urgent' AND stage NOT IN ('won','lost') THEN 1 END) as urgent,
                COUNT(CASE WHEN next_follow_up_date = ? AND stage NOT IN ('won','lost') THEN 1 END) as follow_up_today,
                COUNT(CASE WHEN next_follow_up_date < ? AND next_follow_up_date IS NOT NULL AND stage NOT IN ('won','lost') THEN 1 END) as follow_up_overdue
            ", [today()->toDateString(), today()->toDateString()])
            ->first();

        // Recent transactions
        $recentTransactions = Transaction::where('workspace_id', $workspaceId)
            ->with('category:id,name,color', 'account:id,name')
            ->orderByDesc('date')
            ->limit(10)
            ->get(['id', 'type', 'amount', 'currency', 'date', 'description', 'category_id', 'account_id']);

        return response()->json([
            'business' => [
                'total_sales' => $invoiceSummary->total_sales ?? 0,
                'total_expenses' => $billSummary->total_expenses ?? 0,
                'net_cash_flow' => $paymentsReceived - $paymentsMade,
                'outstanding_invoices' => $invoiceSummary->outstanding ?? 0,
                'overdue_invoices' => $invoiceSummary->overdue_amount ?? 0,
                'overdue_invoice_count' => $invoiceSummary->overdue_count ?? 0,
                'outstanding_bills' => $billSummary->outstanding ?? 0,
                'overdue_bill_count' => $billSummary->overdue_count ?? 0,
                'payments_received_month' => $paymentsReceived,
                'payments_made_month' => $paymentsMade,
            ],
            'tasks' => [
                'due_today' => $tasksDueToday,
                'overdue' => $overdueTasks,
                'commitments_due_soon' => $commitmentsDueSoon,
            ],
            'leads' => [
                'open' => $leadSummary->open_leads ?? 0,
                'urgent' => $leadSummary->urgent ?? 0,
                'follow_up_today' => $leadSummary->follow_up_today ?? 0,
                'follow_up_overdue' => $leadSummary->follow_up_overdue ?? 0,
            ],
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
