<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commitment;
use App\Models\CommitmentMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommitmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Commitment::with('milestones', 'customer:id,name', 'supplier:id,name')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->search, fn($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->orderBy('due_date')->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:50',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'start_date' => 'nullable|date',
            'due_date' => 'required|date',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'bill_id' => 'nullable|exists:bills,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'amount' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|size:3',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'milestones' => 'nullable|array',
            'milestones.*.title' => 'required_with:milestones|string|max:255',
            'milestones.*.due_date' => 'nullable|date',
        ]);

        $commitment = Commitment::create([
            ...\Illuminate\Support\Arr::except($validated, ['milestones']),
            'workspace_id' => $request->user()->current_workspace_id,
            'status' => 'pending',
            'priority' => $validated['priority'] ?? 'medium',
            'created_by' => $request->user()->id,
        ]);

        if (!empty($validated['milestones'])) {
            foreach ($validated['milestones'] as $index => $milestone) {
                CommitmentMilestone::create([
                    'commitment_id' => $commitment->id,
                    'title' => $milestone['title'],
                    'due_date' => $milestone['due_date'] ?? null,
                    'sort_order' => $index,
                ]);
            }
        }

        return response()->json(['data' => $commitment->load('milestones')], 201);
    }

    public function show(Commitment $commitment): JsonResponse
    {
        return response()->json(['data' => $commitment->load('milestones', 'tasks', 'customer', 'supplier', 'contact')]);
    }

    public function update(Request $request, Commitment $commitment): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed,overdue,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'sometimes|date',
            'progress_percentage' => 'nullable|integer|min:0|max:100',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed') {
            $validated['completed_at'] = now();
            $validated['progress_percentage'] = 100;
        }

        $commitment->update($validated);
        return response()->json(['data' => $commitment->fresh('milestones')]);
    }

    public function addMilestone(Request $request, Commitment $commitment): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $milestone = CommitmentMilestone::create([
            'commitment_id' => $commitment->id,
            ...$validated,
            'sort_order' => $commitment->milestones()->count(),
        ]);

        return response()->json(['data' => $milestone], 201);
    }

    public function destroy(Commitment $commitment): JsonResponse
    {
        $commitment->delete();
        return response()->json(null, 204);
    }
}
