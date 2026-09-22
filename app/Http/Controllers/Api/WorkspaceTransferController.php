<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Transfers money between two of the user's own workspaces
 * (e.g. an owner's draw from Business to Personal, or a capital
 * contribution from Personal into Business).
 *
 * Creates a linked pair of 'transfer' transactions — one in each workspace —
 * joined by transfer_pair_id, so the movement is traceable from both ledgers.
 *
 * Transfers are intentionally typed 'transfer' (not income/expense) so they do
 * not inflate profit or spending figures in reports.
 *
 * Like OverviewController this spans workspaces, so every workspace and account
 * id must be verified against the authenticated user's own memberships.
 */
class WorkspaceTransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $ids = $request->user()->workspaces()->pluck('workspaces.id')->all();

        if (empty($ids)) {
            return response()->json(['data' => []]);
        }

        // Cross-workspace legs: a transfer whose paired leg lives in a different workspace.
        $transfers = Transaction::withoutGlobalScopes()
            ->whereIn('transactions.workspace_id', $ids)
            ->where('transactions.type', 'transfer')
            ->whereNotNull('transactions.transfer_pair_id')
            ->join('transactions as pair', 'transactions.transfer_pair_id', '=', 'pair.id')
            ->whereColumn('pair.workspace_id', '!=', 'transactions.workspace_id')
            ->join('workspaces as from_ws', 'transactions.workspace_id', '=', 'from_ws.id')
            ->join('workspaces as to_ws', 'pair.workspace_id', '=', 'to_ws.id')
            ->orderByDesc('transactions.date')
            ->orderByDesc('transactions.id')
            ->limit(100)
            ->get([
                'transactions.id', 'transactions.amount', 'transactions.currency',
                'transactions.date', 'transactions.description', 'transactions.direction_hint',
                'transactions.workspace_id', 'pair.workspace_id as pair_workspace_id',
                'from_ws.name as from_workspace_name', 'from_ws.type as from_workspace_type',
                'to_ws.name as to_workspace_name', 'to_ws.type as to_workspace_type',
            ]);

        return response()->json(['data' => $transfers]);
    }

    /**
     * Accounts across all of the user's workspaces, so the transfer form can
     * offer a source and destination that live in different workspaces.
     * The per-workspace /accounts endpoint cannot do this by design.
     */
    public function accounts(Request $request): JsonResponse
    {
        $workspaces = $request->user()->workspaces()->get(['workspaces.id', 'workspaces.name', 'workspaces.type']);
        $ids = $workspaces->pluck('id')->all();

        $accounts = empty($ids) ? collect() : Account::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'workspace_id', 'name', 'type', 'currency', 'current_balance']);

        $grouped = $workspaces->map(fn ($ws) => [
            'id' => $ws->id,
            'name' => $ws->name,
            'type' => $ws->type,
            'accounts' => $accounts->where('workspace_id', $ws->id)->values(),
        ])->values();

        return response()->json(['data' => $grouped]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_workspace_id' => 'required|integer',
            'to_workspace_id' => 'required|integer|different:from_workspace_id',
            'from_account_id' => 'required|integer',
            'to_account_id' => 'required|integer',
            'amount' => 'required|integer|min:1',
            'date' => 'required|date',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $memberIds = $user->workspaces()->pluck('workspaces.id')->all();

        // The user must belong to BOTH workspaces.
        foreach (['from_workspace_id', 'to_workspace_id'] as $field) {
            if (! in_array($validated[$field], $memberIds, true)) {
                throw ValidationException::withMessages([
                    $field => 'You are not a member of that workspace.',
                ]);
            }
        }

        // Each account must belong to the workspace it is being used for.
        $fromAccount = $this->accountIn($validated['from_account_id'], $validated['from_workspace_id'], 'from_account_id');
        $toAccount = $this->accountIn($validated['to_account_id'], $validated['to_workspace_id'], 'to_account_id');

        // No FX conversion — refuse rather than silently mis-state the amount.
        if ($fromAccount->currency !== $toAccount->currency) {
            throw ValidationException::withMessages([
                'to_account_id' => "Both accounts must use the same currency ({$fromAccount->currency} vs {$toAccount->currency}).",
            ]);
        }

        $label = $validated['description'] ?? 'Workspace transfer';

        [$outgoing, $incoming] = DB::transaction(function () use ($validated, $user, $fromAccount, $toAccount, $label) {
            $out = Transaction::withoutGlobalScopes()->create([
                'uuid' => Str::uuid()->toString(),
                'workspace_id' => $validated['from_workspace_id'],
                'account_id' => $fromAccount->id,
                'type' => 'transfer',
                'amount' => $validated['amount'],
                'currency' => $fromAccount->currency,
                'date' => $validated['date'],
                'description' => $label,
                'notes' => $validated['notes'] ?? null,
                'direction_hint' => 'out',
                'created_by' => $user->id,
            ]);

            $in = Transaction::withoutGlobalScopes()->create([
                'uuid' => Str::uuid()->toString(),
                'workspace_id' => $validated['to_workspace_id'],
                'account_id' => $toAccount->id,
                'type' => 'transfer',
                'amount' => $validated['amount'],
                'currency' => $toAccount->currency,
                'date' => $validated['date'],
                'description' => $label,
                'notes' => $validated['notes'] ?? null,
                'direction_hint' => 'in',
                'transfer_pair_id' => $out->id,
                'created_by' => $user->id,
            ]);

            $out->update(['transfer_pair_id' => $in->id]);

            // Move the money.
            $fromAccount->decrement('current_balance', $validated['amount']);
            $toAccount->increment('current_balance', $validated['amount']);

            return [$out, $in];
        });

        return response()->json([
            'data' => ['outgoing' => $outgoing, 'incoming' => $incoming],
            'message' => 'Transfer recorded in both workspaces.',
        ], 201);
    }

    /** Resolve an account, asserting it belongs to the given workspace. */
    private function accountIn(int $accountId, int $workspaceId, string $field): Account
    {
        $account = Account::withoutGlobalScopes()
            ->where('id', $accountId)
            ->where('workspace_id', $workspaceId)
            ->first();

        if (! $account) {
            throw ValidationException::withMessages([
                $field => 'That account does not belong to the selected workspace.',
            ]);
        }

        return $account;
    }
}
