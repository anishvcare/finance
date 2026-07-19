<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\DocumentNumberService;
use App\Services\InvoiceCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceCalculationService $calculator,
        private DocumentNumberService $numberService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with('customer:id,name,business_name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->customer_id, fn($q, $c) => $q->where('customer_id', $c))
            ->when($request->search, fn($q, $s) => $q->where('invoice_number', 'like', "%{$s}%"))
            ->when($request->from_date, fn($q, $d) => $q->where('invoice_date', '>=', $d))
            ->when($request->to_date, fn($q, $d) => $q->where('invoice_date', '<=', $d))
            ->orderByDesc('invoice_date')
            ->orderByDesc('id');

        $invoices = $query->paginate($request->per_page ?? 20);

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'currency' => 'required|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'reference_number' => 'nullable|string|max:100',
            'purchase_order' => 'nullable|string|max:100',
            'salesperson' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:product,service,custom',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_id' => 'nullable|exists:taxes,id',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|integer|min:0',
            'shipping_amount' => 'nullable|integer|min:0',
            'additional_charges' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'payment_instructions' => 'nullable|string',
            'internal_notes' => 'nullable|string',
            'template' => 'nullable|string|in:clean,modern,compact',
        ]);

        $invoice = DB::transaction(function () use ($validated, $request) {
            // Server-side calculation
            $totals = $this->calculator->calculateDocumentTotals(
                $validated['items'],
                $validated
            );

            $invoice = Invoice::create([
                'workspace_id' => $request->user()->current_workspace_id,
                'invoice_number' => 'DRAFT-' . Str::random(8),
                'customer_id' => $validated['customer_id'],
                'status' => 'draft',
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'payment_terms' => $validated['payment_terms'] ?? 30,
                'reference_number' => $validated['reference_number'] ?? null,
                'purchase_order' => $validated['purchase_order'] ?? null,
                'salesperson' => $validated['salesperson'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'shipping_amount' => $totals['shipping_amount'],
                'tax_amount' => $totals['tax_amount'],
                'additional_charges' => $totals['additional_charges'],
                'round_off' => $totals['round_off'],
                'total' => $totals['total'],
                'amount_paid' => 0,
                'balance_due' => $totals['total'],
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'payment_instructions' => $validated['payment_instructions'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'template' => $validated['template'] ?? 'clean',
                'created_by' => $request->user()->id,
            ]);

            // Create line items with server-calculated totals
            foreach ($totals['items'] as $index => $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
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
                    'tax_id' => $item['tax_id'] ?? null,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $item['tax_amount'],
                    'line_total' => $item['line_total'],
                    'sort_order' => $index,
                ]);
            }

            return $invoice;
        });

        return response()->json(['data' => $invoice->load('items', 'customer')], 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);
        return response()->json(['data' => $invoice->load('items', 'customer', 'payments.payment')]);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('update', $invoice);

        if (!$invoice->isEditable()) {
            return response()->json(['message' => 'Finalised invoices cannot be edited.'], 422);
        }

        // Similar validation and recalculation as store...
        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'invoice_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'items' => 'sometimes|array|min:1',
            'items.*.type' => 'required_with:items|in:product,service,custom',
            'items.*.name' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|numeric|min:0.001',
            'items.*.unit_price' => 'required_with:items|integer|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        DB::transaction(function () use ($invoice, $validated) {
            if (isset($validated['items'])) {
                $totals = $this->calculator->calculateDocumentTotals(
                    $validated['items'],
                    $validated
                );

                $invoice->items()->delete();

                foreach ($totals['items'] as $index => $item) {
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
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
                        'tax_id' => $item['tax_id'] ?? null,
                        'tax_rate' => $item['tax_rate'] ?? 0,
                        'tax_amount' => $item['tax_amount'],
                        'line_total' => $item['line_total'],
                        'sort_order' => $index,
                    ]);
                }

                $invoice->update([
                    'subtotal' => $totals['subtotal'],
                    'tax_amount' => $totals['tax_amount'],
                    'total' => $totals['total'],
                    'balance_due' => $totals['total'] - $invoice->amount_paid,
                ]);
            }

            $invoice->update(collect($validated)->except('items')->toArray());
        });

        return response()->json(['data' => $invoice->fresh('items', 'customer')]);
    }

    public function finalise(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('finalise', $invoice);

        if ($invoice->status !== 'draft') {
            return response()->json(['message' => 'Only draft invoices can be finalised.'], 422);
        }

        DB::transaction(function () use ($invoice, $request) {
            $officialNumber = $this->numberService->generateInvoiceNumber(
                $request->user()->current_workspace_id
            );

            $invoice->update([
                'invoice_number' => $officialNumber,
                'status' => 'finalised',
                'finalised_at' => now(),
            ]);
        });

        return response()->json(['data' => $invoice->fresh()]);
    }

    public function send(Invoice $invoice): JsonResponse
    {
        $this->authorize('send', $invoice);

        if ($invoice->isDraft()) {
            return response()->json(['message' => 'Finalise invoice before sending.'], 422);
        }

        // Queue email sending
        // dispatch(new SendInvoiceEmail($invoice));

        $invoice->update(['status' => 'sent', 'sent_at' => now()]);

        return response()->json(['data' => $invoice->fresh(), 'message' => 'Invoice sent.']);
    }

    public function recordPayment(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('recordPayment', $invoice);

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'account_id' => 'required|exists:accounts,id',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount'] > $invoice->balance_due) {
            return response()->json(['message' => 'Payment exceeds balance due.'], 422);
        }

        $payment = DB::transaction(function () use ($invoice, $validated, $request) {
            $payment = \App\Models\Payment::create([
                'workspace_id' => $request->user()->current_workspace_id,
                'type' => 'incoming',
                'customer_id' => $invoice->customer_id,
                'account_id' => $validated['account_id'],
                'amount' => $validated['amount'],
                'currency' => $invoice->currency,
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            \App\Models\PaymentAllocation::create([
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
            ]);

            $invoice->amount_paid += $validated['amount'];
            $invoice->balance_due -= $validated['amount'];

            if ($invoice->balance_due <= 0) {
                $invoice->status = 'paid';
                $invoice->paid_at = now();
            } else {
                $invoice->status = 'partially_paid';
            }

            $invoice->save();

            return $payment;
        });

        return response()->json([
            'data' => $invoice->fresh('items', 'customer'),
            'payment' => $payment,
        ]);
    }

    public function void(Invoice $invoice): JsonResponse
    {
        $this->authorize('void', $invoice);

        $invoice->update(['status' => 'void', 'voided_at' => now()]);

        return response()->json(['data' => $invoice->fresh()]);
    }

    public function generateShareLink(Invoice $invoice): JsonResponse
    {
        $this->authorize('share', $invoice);

        $token = Str::random(64);
        $invoice->update([
            'share_token' => $token,
            'share_expires_at' => now()->addDays(30),
        ]);

        $url = config('app.url') . '/invoice/view/' . $token;

        return response()->json(['url' => $url, 'token' => $token, 'expires_at' => $invoice->share_expires_at]);
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorize('delete', $invoice);

        if (!$invoice->isDraft()) {
            return response()->json(['message' => 'Only draft invoices can be deleted.'], 422);
        }

        $invoice->delete();
        return response()->json(null, 204);
    }
}
