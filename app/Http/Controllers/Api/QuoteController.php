<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Services\DocumentNumberService;
use App\Services\InvoiceCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    public function __construct(
        private InvoiceCalculationService $calculator,
        private DocumentNumberService $numberService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Quote::with('customer:id,name,business_name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->customer_id, fn($q, $c) => $q->where('customer_id', $c))
            ->when($request->search, fn($q, $s) => $q->where('quote_number', 'like', "%{$s}%"))
            ->orderByDesc('quote_date')->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'quote_date' => 'required|date',
            'expiry_date' => 'nullable|date|after_or_equal:quote_date',
            'currency' => 'required|string|size:3',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:product,service,custom',
            'items.*.name' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|integer|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|integer|min:0',
            'shipping_amount' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'customer_message' => 'nullable|string',
            'internal_notes' => 'nullable|string',
        ]);

        $quote = DB::transaction(function () use ($validated, $request) {
            $totals = $this->calculator->calculateDocumentTotals($validated['items'], $validated);

            $quoteNumber = $this->numberService->generateQuoteNumber($request->user()->current_workspace_id);

            $quote = Quote::create([
                'workspace_id' => $request->user()->current_workspace_id,
                'quote_number' => $quoteNumber,
                'customer_id' => $validated['customer_id'],
                'status' => 'draft',
                'quote_date' => $validated['quote_date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'currency' => $validated['currency'],
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'shipping_amount' => $totals['shipping_amount'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'customer_message' => $validated['customer_message'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($totals['items'] as $index => $item) {
                QuoteItem::create([
                    'quote_id' => $quote->id,
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

            return $quote;
        });

        return response()->json(['data' => $quote->load('items', 'customer')], 201);
    }

    public function show(Quote $quote): JsonResponse
    {
        return response()->json(['data' => $quote->load('items', 'customer')]);
    }

    public function update(Request $request, Quote $quote): JsonResponse
    {
        if (!in_array($quote->status, ['draft'])) {
            return response()->json(['message' => 'Only draft quotes can be edited.'], 422);
        }

        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'quote_date' => 'sometimes|date',
            'expiry_date' => 'nullable|date',
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

        DB::transaction(function () use ($quote, $validated) {
            if (isset($validated['items'])) {
                $totals = $this->calculator->calculateDocumentTotals($validated['items'], $validated);
                $quote->items()->delete();

                foreach ($totals['items'] as $index => $item) {
                    QuoteItem::create([
                        'quote_id' => $quote->id,
                        'type' => $item['type'],
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

                $quote->update([
                    'subtotal' => $totals['subtotal'],
                    'tax_amount' => $totals['tax_amount'],
                    'total' => $totals['total'],
                ]);
            }
            $quote->update(collect($validated)->except('items')->toArray());
        });

        return response()->json(['data' => $quote->fresh('items', 'customer')]);
    }

    public function send(Quote $quote): JsonResponse
    {
        if ($quote->status === 'draft') {
            $quote->update(['status' => 'sent', 'sent_at' => now()]);
        }
        return response()->json(['data' => $quote->fresh(), 'message' => 'Quote sent.']);
    }

    public function accept(Quote $quote): JsonResponse
    {
        $quote->update(['status' => 'accepted', 'accepted_at' => now()]);
        return response()->json(['data' => $quote->fresh()]);
    }

    public function reject(Quote $quote): JsonResponse
    {
        $quote->update(['status' => 'rejected', 'rejected_at' => now()]);
        return response()->json(['data' => $quote->fresh()]);
    }

    /**
     * Convert a quote to an invoice.
     */
    public function convert(Request $request, Quote $quote): JsonResponse
    {
        if (!$quote->isConvertible()) {
            return response()->json(['message' => 'This quote cannot be converted.'], 422);
        }

        $invoice = DB::transaction(function () use ($quote, $request) {
            $invoice = Invoice::create([
                'workspace_id' => $quote->workspace_id,
                'invoice_number' => 'DRAFT-' . \Illuminate\Support\Str::random(8),
                'customer_id' => $quote->customer_id,
                'quote_id' => $quote->id,
                'status' => 'draft',
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'currency' => $quote->currency,
                'payment_terms' => 30,
                'subtotal' => $quote->subtotal,
                'discount_amount' => $quote->discount_amount,
                'shipping_amount' => $quote->shipping_amount,
                'tax_amount' => $quote->tax_amount,
                'additional_charges' => $quote->additional_charges,
                'round_off' => $quote->round_off,
                'total' => $quote->total,
                'amount_paid' => 0,
                'balance_due' => $quote->total,
                'notes' => $quote->notes,
                'terms' => $quote->terms,
                'created_by' => $request->user()->id,
            ]);

            // Copy line items (snapshot preserved)
            foreach ($quote->items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'type' => $item->type,
                    'product_id' => $item->product_id,
                    'service_id' => $item->service_id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount_rate' => $item->discount_rate,
                    'discount_amount' => $item->discount_amount,
                    'tax_id' => $item->tax_id,
                    'tax_rate' => $item->tax_rate,
                    'tax_amount' => $item->tax_amount,
                    'line_total' => $item->line_total,
                    'sort_order' => $item->sort_order,
                ]);
            }

            $quote->update([
                'status' => 'converted',
                'converted_invoice_id' => $invoice->id,
            ]);

            return $invoice;
        });

        return response()->json(['data' => $invoice->load('items', 'customer')], 201);
    }

    public function destroy(Quote $quote): JsonResponse
    {
        if ($quote->status !== 'draft') {
            return response()->json(['message' => 'Only draft quotes can be deleted.'], 422);
        }
        $quote->delete();
        return response()->json(null, 204);
    }
}
