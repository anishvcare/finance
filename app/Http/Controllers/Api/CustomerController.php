<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('business_name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            }))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name');

        $customers = $query->paginate($request->per_page ?? 20);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:individual,business,organisation',
            'name' => 'required|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'billing_address_line_1' => 'nullable|string|max:255',
            'billing_address_line_2' => 'nullable|string|max:255',
            'billing_city' => 'nullable|string|max:100',
            'billing_state' => 'nullable|string|max:100',
            'billing_postal_code' => 'nullable|string|max:20',
            'billing_country' => 'nullable|string|max:100',
            'shipping_address_line_1' => 'nullable|string|max:255',
            'shipping_address_line_2' => 'nullable|string|max:255',
            'shipping_city' => 'nullable|string|max:100',
            'shipping_state' => 'nullable|string|max:100',
            'shipping_postal_code' => 'nullable|string|max:20',
            'shipping_country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:100',
            'currency' => 'nullable|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'credit_limit' => 'nullable|integer|min:0',
            'default_discount' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $customer = Customer::create([
            ...$validated,
            'workspace_id' => $request->user()->current_workspace_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $customer], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $this->authorize('view', $customer);
        return response()->json(['data' => $customer->load('contacts')]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'billing_address_line_1' => 'nullable|string|max:255',
            'billing_city' => 'nullable|string|max:100',
            'billing_state' => 'nullable|string|max:100',
            'billing_postal_code' => 'nullable|string|max:20',
            'billing_country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:100',
            'currency' => 'nullable|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $customer->update($validated);

        return response()->json(['data' => $customer->fresh()]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->authorize('delete', $customer);
        $customer->delete();
        return response()->json(null, 204);
    }

    public function statement(Customer $customer): JsonResponse
    {
        $this->authorize('view', $customer);

        $invoices = $customer->invoices()
            ->whereNotIn('status', ['draft', 'cancelled'])
            ->orderBy('invoice_date')
            ->get(['id', 'invoice_number', 'invoice_date', 'due_date', 'total', 'amount_paid', 'balance_due', 'status']);

        $payments = $customer->payments()
            ->orderBy('payment_date')
            ->get(['id', 'amount', 'payment_date', 'payment_method', 'reference_number']);

        return response()->json([
            'customer' => $customer->only('id', 'name', 'business_name', 'email'),
            'invoices' => $invoices,
            'payments' => $payments,
            'outstanding_balance' => $customer->outstandingBalance(),
        ]);
    }
}
