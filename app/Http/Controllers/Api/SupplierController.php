<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query()
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('business_name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            }))
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:100',
            'currency' => 'nullable|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_bsb' => 'nullable|string|max:20',
            'bank_swift' => 'nullable|string|max:20',
            'bank_iban' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'workspace_id' => $request->user()->current_workspace_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $supplier], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json(['data' => $supplier->load('contacts')]);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'business_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'mobile' => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:100',
            'currency' => 'nullable|string|size:3',
            'payment_terms' => 'nullable|integer|min:0',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_bsb' => 'nullable|string|max:20',
            'bank_swift' => 'nullable|string|max:20',
            'bank_iban' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $supplier->update($validated);
        return response()->json(['data' => $supplier->fresh()]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();
        return response()->json(null, 204);
    }
}
