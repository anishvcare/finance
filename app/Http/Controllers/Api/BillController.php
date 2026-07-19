<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Services\DocumentNumberService;
use App\Services\InvoiceCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function __construct(
        private InvoiceCalculationService $calculator,
        private DocumentNumberService $numberService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Bill::with('supplier:id,name,business_name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->supplier_id, fn($q, $s) => $q->where('supplier_id', $s))
            ->when($request->search, fn($q, $s) => $q->where('bill_number', 'like', "%{$s}%"))
            ->orderByDesc('bill_date')->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'supplier_invoice_number' => 'nullable|string|max:100',
            'bill_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:bill_date',
            'currency' => 'required|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:product,service,expense',
            'items.*.name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|integer|min:0',
            'shipping_amount' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'internal_notes' => 'nullable|string',
        ]);

        $bill = DB::transaction(function () use ($validated, $request) {
            $totals = $this->calculator->calculateDocumentTotals($validated['items'], $validated);
            $billNumber = $this->numberService->generateBillNumber($request->user()->current_workspace_id);

            $bill = Bill::create([
                'workspace_id' => $request->user()->current_workspace_id,
                'bill_number' => $billNumber,
                'supplier_id' => $validated['supplier_id'],
                'supplier_invoice_number' => $validated['supplier_invoice_number'] ?? null,
                'status' => 'open',
                'bill_date' => $validated['bill_date'],
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'payment_terms' => $validated['payment_terms'] ?? 30,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'shipping_amount' => $totals['shipping_amount'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'amount_paid' => 0,
                'balance_due' => $totals['total'],
                'notes' => $validated['notes'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($totals['items'] as $index => $item) {
                BillItem::create([
                    'bill_id' => $bill->id,
                    'type' => $item['type'],
                    'product_id' => $item['product_id'] ?? null,
                    'service_id' => $item['service_id'] ?? null,
                    'name' => $item['name'],
                    'description' => $item['description'] ?? null,
                    'unit' => $item['unit'] ?? 'each',
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_rate' => $item['discount_rate'],
                    'discount_amount' => $item['discount_amount'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $item['tax_amount'],
                    'line_total' => $item['line_total'],
                    'sort_order' => $index,
                ]);
            }

            return $bill;
        });

        return response()->json(['data' => $bill->load('items', 'supplier')], 201);
    }

    public function show(Bill $bill): JsonResponse
    {
        return response()->json(['data' => $bill->load('items', 'supplier', 'payments.payment')]);
    }

    public function recordPayment(Request $request, Bill $bill): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'account_id' => 'required|exists:accounts,id',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount'] > $bill->balance_due) {
            return response()->json(['message' => 'Payment exceeds balance due.'], 422);
        }

        $payment = DB::transaction(function () use ($bill, $validated, $request) {
            $payment = Payment::create([
                'workspace_id' => $request->user()->current_workspace_id,
                'type' => 'outgoing',
                'supplier_id' => $bill->supplier_id,
                'account_id' => $validated['account_id'],
                'amount' => $validated['amount'],
                'currency' => $bill->currency,
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'bill_id' => $bill->id,
                'amount' => $validated['amount'],
            ]);

            $bill->amount_paid += $validated['amount'];
            $bill->balance_due -= $validated['amount'];
            $bill->status = $bill->balance_due <= 0 ? 'paid' : 'partially_paid';
            $bill->save();

            return $payment;
        });

        return response()->json(['data' => $bill->fresh('items', 'supplier'), 'payment' => $payment]);
    }

    public function destroy(Bill $bill): JsonResponse
    {
        if ($bill->amount_paid > 0) {
            return response()->json(['message' => 'Bills with payments cannot be deleted.'], 422);
        }
        $bill->delete();
        return response()->json(null, 204);
    }
}
