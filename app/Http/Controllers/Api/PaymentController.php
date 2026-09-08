<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentAllocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentAllocationService $allocationService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with('customer:id,name', 'supplier:id,name', 'account:id,name')
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->customer_id, fn($q, $c) => $q->where('customer_id', $c))
            ->when($request->supplier_id, fn($q, $s) => $q->where('supplier_id', $s))
            ->when($request->from_date, fn($q, $d) => $q->where('payment_date', '>=', $d))
            ->when($request->to_date, fn($q, $d) => $q->where('payment_date', '<=', $d))
            ->orderByDesc('payment_date')->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:incoming,outgoing',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'account_id' => 'required|exists:accounts,id',
            'amount' => 'required|integer|min:1',
            'currency' => 'required|string|size:3',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'allocations' => 'nullable|array',
            'allocations.*.invoice_id' => 'nullable|exists:invoices,id',
            'allocations.*.bill_id' => 'nullable|exists:bills,id',
            'allocations.*.amount' => 'required_with:allocations|integer|min:1',
        ]);

        $payment = Payment::create([
            'workspace_id' => $request->user()->current_workspace_id,
            'type' => $validated['type'],
            'customer_id' => $validated['customer_id'] ?? null,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'account_id' => $validated['account_id'],
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'],
            'reference_number' => $validated['reference_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        // Handle allocations
        if (!empty($validated['allocations'])) {
            $invoiceAllocations = array_filter($validated['allocations'], fn($a) => isset($a['invoice_id']));
            $billAllocations = array_filter($validated['allocations'], fn($a) => isset($a['bill_id']));

            if (!empty($invoiceAllocations)) {
                $this->allocationService->allocateToInvoices($payment, $invoiceAllocations);
            }
            if (!empty($billAllocations)) {
                $this->allocationService->allocateToBills($payment, $billAllocations);
            }
        }

        return response()->json(['data' => $payment->load('allocations', 'customer', 'supplier')], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json(['data' => $payment->load('allocations.invoice', 'allocations.bill', 'customer', 'supplier', 'account')]);
    }

    public function allocate(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'allocations' => 'required|array|min:1',
            'allocations.*.invoice_id' => 'nullable|exists:invoices,id',
            'allocations.*.bill_id' => 'nullable|exists:bills,id',
            'allocations.*.amount' => 'required|integer|min:1',
        ]);

        $invoiceAllocations = array_filter($validated['allocations'], fn($a) => isset($a['invoice_id']));
        $billAllocations = array_filter($validated['allocations'], fn($a) => isset($a['bill_id']));

        if (!empty($invoiceAllocations)) {
            $this->allocationService->allocateToInvoices($payment, $invoiceAllocations);
        }
        if (!empty($billAllocations)) {
            $this->allocationService->allocateToBills($payment, $billAllocations);
        }

        return response()->json(['data' => $payment->fresh('allocations')]);
    }
}
