<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Auto-create default accounts the first time the workspace has none.
        if (Account::query()->count() === 0) {
            $currency = Workspace::find($request->user()->current_workspace_id)?->currency ?? 'INR';
            Account::create(['name' => 'Cash', 'type' => 'cash', 'currency' => $currency, 'is_default' => true]);
            Account::create(['name' => 'Bank Account', 'type' => 'bank', 'currency' => $currency]);
        }

        $accounts = Account::query()
            ->when($request->boolean('active_only', true), fn ($q) => $q->where('is_active', true))
            ->orderByDesc('is_default')->orderBy('name')
            ->get();

        return response()->json(['data' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:bank,cash,credit_card,wallet,other',
            'currency' => 'required|string|size:3',
            'opening_balance' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $validated['current_balance'] = $validated['opening_balance'] ?? 0;
        $account = Account::create($validated);

        if ($request->boolean('is_default')) {
            Account::where('id', '!=', $account->id)->update(['is_default' => false]);
        }

        return response()->json(['data' => $account], 201);
    }

    public function update(Request $request, Account $account): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:bank,cash,credit_card,wallet,other',
            'currency' => 'sometimes|string|size:3',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $account->update($validated);

        if ($request->boolean('is_default')) {
            Account::where('id', '!=', $account->id)->update(['is_default' => false]);
        }

        return response()->json(['data' => $account->fresh()]);
    }

    public function destroy(Account $account): JsonResponse
    {
        $account->delete();
        return response()->json(null, 204);
    }
}
