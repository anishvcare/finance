<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with('category:id,name,color', 'account:id,name,type')
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->account_id, fn($q, $a) => $q->where('account_id', $a))
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c))
            ->when($request->from_date, fn($q, $d) => $q->where('date', '>=', $d))
            ->when($request->to_date, fn($q, $d) => $q->where('date', '<=', $d))
            ->when($request->search, fn($q, $s) => $q->where('description', 'like', "%{$s}%"))
            ->orderByDesc('date')->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'uuid' => 'nullable|uuid|unique:transactions,uuid',
            'account_id' => 'required|exists:accounts,id',
            'type' => 'required|in:income,expense,transfer,refund,adjustment',
            'amount' => 'required|integer|min:1',
            'currency' => 'required|string|size:3',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'category_id' => 'nullable|exists:categories,id',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'payment_method' => 'nullable|string|max:50',
            'reference' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'is_recurring' => 'nullable|boolean',
            'recurrence_rule' => 'nullable|string|max:100',
        ]);

        $transaction = DB::transaction(function () use ($validated, $request) {
            $transaction = Transaction::create([
                'uuid' => $validated['uuid'] ?? Str::uuid()->toString(),
                'workspace_id' => $request->user()->current_workspace_id,
                'account_id' => $validated['account_id'],
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'currency' => $validated['currency'],
                'date' => $validated['date'],
                'time' => $validated['time'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'customer_id' => $validated['customer_id'] ?? null,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'payment_method' => $validated['payment_method'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'tags' => $validated['tags'] ?? null,
                'is_recurring' => $validated['is_recurring'] ?? false,
                'recurrence_rule' => $validated['recurrence_rule'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            // Update account balance
            $account = Account::find($validated['account_id']);
            if ($validated['type'] === 'income') {
                $account->increment('current_balance', $validated['amount']);
            } elseif ($validated['type'] === 'expense') {
                $account->decrement('current_balance', $validated['amount']);
            }

            return $transaction;
        });

        return response()->json(['data' => $transaction->load('category', 'account')], 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json(['data' => $transaction->load('category', 'account', 'customer', 'supplier')]);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'review_status' => 'nullable|in:pending,reviewed,confirmed',
        ]);

        $transaction->update($validated);
        return response()->json(['data' => $transaction->fresh('category', 'account')]);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        DB::transaction(function () use ($transaction) {
            // Reverse account balance
            $account = Account::find($transaction->account_id);
            if ($transaction->type === 'income') {
                $account->decrement('current_balance', $transaction->amount);
            } elseif ($transaction->type === 'expense') {
                $account->increment('current_balance', $transaction->amount);
            }
            $transaction->delete();
        });

        return response()->json(null, 204);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id|different:from_account_id',
            'amount' => 'required|integer|min:1',
            'date' => 'required|date',
            'description' => 'nullable|string|max:500',
        ]);

        $transactions = DB::transaction(function () use ($validated, $request) {
            $uuid1 = Str::uuid()->toString();
            $uuid2 = Str::uuid()->toString();

            $outgoing = Transaction::create([
                'uuid' => $uuid1,
                'workspace_id' => $request->user()->current_workspace_id,
                'account_id' => $validated['from_account_id'],
                'type' => 'transfer',
                'amount' => $validated['amount'],
                'currency' => Account::find($validated['from_account_id'])->currency,
                'date' => $validated['date'],
                'description' => $validated['description'] ?? 'Transfer out',
                'created_by' => $request->user()->id,
            ]);

            $incoming = Transaction::create([
                'uuid' => $uuid2,
                'workspace_id' => $request->user()->current_workspace_id,
                'account_id' => $validated['to_account_id'],
                'type' => 'transfer',
                'amount' => $validated['amount'],
                'currency' => Account::find($validated['to_account_id'])->currency,
                'date' => $validated['date'],
                'description' => $validated['description'] ?? 'Transfer in',
                'transfer_pair_id' => $outgoing->id,
                'created_by' => $request->user()->id,
            ]);

            $outgoing->update(['transfer_pair_id' => $incoming->id]);

            // Update balances
            Account::find($validated['from_account_id'])->decrement('current_balance', $validated['amount']);
            Account::find($validated['to_account_id'])->increment('current_balance', $validated['amount']);

            return [$outgoing, $incoming];
        });

        return response()->json(['data' => $transactions], 201);
    }
}
