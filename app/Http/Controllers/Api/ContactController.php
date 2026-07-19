<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contact::query()
            ->with('customer:id,name', 'supplier:id,name')
            ->when($request->search, fn ($q, $s) => $q->where(function ($qq) use ($s) {
                $qq->where('name', 'like', "%{$s}%")
                    ->orWhere('organisation', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            }))
            ->orderBy('name');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'mobile' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'organisation' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $contact = Contact::create($validated);
        return response()->json(['data' => $contact], 201);
    }

    public function show(Contact $contact): JsonResponse
    {
        return response()->json(['data' => $contact->load('customer', 'supplier')]);
    }

    public function update(Request $request, Contact $contact): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'mobile' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'organisation' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'is_active' => 'nullable|boolean',
        ]);

        $contact->update($validated);
        return response()->json(['data' => $contact->fresh()]);
    }

    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();
        return response()->json(null, 204);
    }
}
