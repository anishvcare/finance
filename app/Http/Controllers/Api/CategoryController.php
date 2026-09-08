<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    private const DEFAULTS = [
        'income' => ['Sales', 'Service Income', 'Consulting', 'Interest', 'Refunds', 'Other Income'],
        'expense' => ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Travel', 'Meals', 'Software', 'Equipment', 'Taxes', 'Bank Charges', 'Other Expense'],
    ];

    public function index(Request $request): JsonResponse
    {
        $type = $request->type;

        // Auto-seed sensible defaults the first time a workspace has none.
        if (Category::query()->whereIn('type', ['income', 'expense'])->count() === 0) {
            foreach (self::DEFAULTS as $catType => $names) {
                foreach ($names as $i => $name) {
                    Category::create(['name' => $name, 'type' => $catType, 'sort_order' => $i]);
                }
            }
        }

        $categories = Category::query()
            ->when($type, fn ($q, $t) => $q->where('type', $t))
            ->orderBy('sort_order')->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense,product,service',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
        ]);

        $category = Category::firstOrCreate(
            ['name' => $validated['name'], 'type' => $validated['type']],
            ['color' => $validated['color'] ?? null, 'icon' => $validated['icon'] ?? null],
        );

        return response()->json(['data' => $category], 201);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();
        return response()->json(null, 204);
    }
}
