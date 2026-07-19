<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::with('assignee:id,name', 'subtasks')
            ->whereNull('parent_id')
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->priority, fn($q, $p) => $q->where('priority', $p))
            ->when($request->assignee_id, fn($q, $a) => $q->where('assignee_id', $a))
            ->when($request->due_date, fn($q, $d) => $q->where('due_date', $d))
            ->when($request->overdue, fn($q) => $q->where('due_date', '<', today())->where('status', '!=', 'completed'))
            ->when($request->search, fn($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
            ->orderBy('due_date')
            ->orderByDesc('id');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|date_format:H:i',
            'parent_id' => 'nullable|exists:tasks,id',
            'assignee_id' => 'nullable|exists:users,id',
            'customer_id' => 'nullable|exists:customers,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'bill_id' => 'nullable|exists:bills,id',
            'commitment_id' => 'nullable|exists:commitments,id',
            'tags' => 'nullable|array',
            'is_recurring' => 'nullable|boolean',
            'recurrence_rule' => 'nullable|string|max:100',
        ]);

        $task = Task::create([
            ...$validated,
            'workspace_id' => $request->user()->current_workspace_id,
            'status' => $validated['status'] ?? 'pending',
            'priority' => $validated['priority'] ?? 'medium',
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $task->load('assignee', 'subtasks')], 201);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json(['data' => $task->load('assignee', 'subtasks', 'commitment')]);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'assignee_id' => 'nullable|exists:users,id',
            'tags' => 'nullable|array',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        }

        $task->update($validated);
        return response()->json(['data' => $task->fresh('assignee', 'subtasks')]);
    }

    public function complete(Task $task): JsonResponse
    {
        $task->update(['status' => 'completed', 'completed_at' => now()]);
        return response()->json(['data' => $task->fresh()]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();
        return response()->json(null, 204);
    }
}
