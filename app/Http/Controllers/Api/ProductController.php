<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category:id,name', 'tax:id,name,rate')
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('code', 'like', "%{$s}%")
                    ->orWhere('sku', 'like', "%{$s}%");
            }))
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c))
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->sort_by, fn($q, $s) => $q->orderBy($s, $request->sort_dir ?? 'asc'), fn($q) => $q->orderBy('name'));

        if ($request->boolean('include_archived')) {
            $query->withTrashed();
        }

        $products = $query->paginate($request->per_page ?? 20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'barcode' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'nullable|string|max:50',
            'sales_price' => 'required|integer|min:0',
            'purchase_price' => 'nullable|integer|min:0',
            'cost_price' => 'nullable|integer|min:0',
            'wholesale_price' => 'nullable|integer|min:0',
            'tax_id' => 'nullable|exists:taxes,id',
            'tax_inclusive' => 'nullable|boolean',
            'currency' => 'nullable|string|size:3',
            'track_inventory' => 'nullable|boolean',
            'opening_stock' => 'nullable|numeric|min:0',
            'low_stock_level' => 'nullable|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
        ]);

        $product = Product::create([
            ...$validated,
            'workspace_id' => $request->user()->current_workspace_id,
            'current_stock' => $validated['opening_stock'] ?? 0,
            'created_by' => $request->user()->id,
        ]);

        // Record initial price in history
        ProductPrice::create([
            'product_id' => $product->id,
            'price_type' => 'sales',
            'amount' => $product->sales_price,
            'effective_from' => now()->toDateString(),
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $product->load('category', 'tax')], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);
        return response()->json(['data' => $product->load('category', 'tax', 'supplier', 'priceHistory')]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:100',
            'sku' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'nullable|string|max:50',
            'sales_price' => 'sometimes|integer|min:0',
            'purchase_price' => 'nullable|integer|min:0',
            'cost_price' => 'nullable|integer|min:0',
            'wholesale_price' => 'nullable|integer|min:0',
            'tax_id' => 'nullable|exists:taxes,id',
            'tax_inclusive' => 'nullable|boolean',
            'track_inventory' => 'nullable|boolean',
            'low_stock_level' => 'nullable|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        // Track price change
        if (isset($validated['sales_price']) && $validated['sales_price'] !== $product->sales_price) {
            ProductPrice::create([
                'product_id' => $product->id,
                'price_type' => 'sales',
                'amount' => $validated['sales_price'],
                'effective_from' => now()->toDateString(),
                'created_by' => $request->user()->id,
            ]);
        }

        $product->update($validated);

        return response()->json(['data' => $product->fresh('category', 'tax')]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);
        $product->delete(); // soft delete (archive)
        return response()->json(null, 204);
    }

    public function restore(Product $product): JsonResponse
    {
        $this->authorize('restore', $product);
        $product->restore();
        return response()->json(['data' => $product]);
    }

    public function duplicate(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $newProduct = $product->replicate(['id', 'created_at', 'updated_at']);
        $newProduct->name = $product->name . ' (Copy)';
        $newProduct->save();

        return response()->json(['data' => $newProduct], 201);
    }
}
