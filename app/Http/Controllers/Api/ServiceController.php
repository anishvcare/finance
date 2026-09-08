<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::with('category:id,name', 'tax:id,name,rate')
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%");
            }))
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c))
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy($request->sort_by ?? 'name', $request->sort_dir ?? 'asc');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'nullable|string|max:50',
            'hourly_rate' => 'nullable|integer|min:0',
            'fixed_price' => 'nullable|integer|min:0',
            'minimum_charge' => 'nullable|integer|min:0',
            'default_quantity' => 'nullable|numeric|min:0',
            'tax_id' => 'nullable|exists:taxes,id',
            'tax_inclusive' => 'nullable|boolean',
            'currency' => 'nullable|string|size:3',
            'estimated_duration' => 'nullable|string|max:100',
            'internal_cost' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $service = Service::create([
            ...$validated,
            'workspace_id' => $request->user()->current_workspace_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $service->load('category', 'tax')], 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json(['data' => $service->load('category', 'tax')]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'nullable|string|max:50',
            'hourly_rate' => 'nullable|integer|min:0',
            'fixed_price' => 'nullable|integer|min:0',
            'minimum_charge' => 'nullable|integer|min:0',
            'default_quantity' => 'nullable|numeric|min:0',
            'tax_id' => 'nullable|exists:taxes,id',
            'tax_inclusive' => 'nullable|boolean',
            'estimated_duration' => 'nullable|string|max:100',
            'internal_cost' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $service->update($validated);
        return response()->json(['data' => $service->fresh('category', 'tax')]);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();
        return response()->json(null, 204);
    }

    public function restore(Service $service): JsonResponse
    {
        $service->restore();
        return response()->json(['data' => $service]);
    }
}
