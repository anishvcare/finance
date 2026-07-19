<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()->workspaces()->with('settings')->get();
        return response()->json(['data' => $workspaces]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:personal,business',
            'currency' => 'required|string|size:3',
            'timezone' => 'required|string|max:50',
        ]);

        $workspace = Workspace::create([
            ...$validated,
            'owner_id' => $request->user()->id,
        ]);

        // Add owner as member
        $workspace->members()->attach($request->user()->id, [
            'role' => 'owner',
            'accepted_at' => now(),
        ]);

        // Create default settings
        WorkspaceSettings::create([
            'workspace_id' => $workspace->id,
            'business_name' => $validated['name'],
        ]);

        // Set as current workspace
        $request->user()->update(['current_workspace_id' => $workspace->id]);

        return response()->json(['data' => $workspace->load('settings')], 201);
    }

    public function show(Workspace $workspace): JsonResponse
    {
        $this->authorize('view', $workspace);
        return response()->json(['data' => $workspace->load('settings', 'members')]);
    }

    public function update(Request $request, Workspace $workspace): JsonResponse
    {
        $this->authorize('update', $workspace);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|size:3',
            'timezone' => 'sometimes|string|max:50',
            'financial_year_start' => 'sometimes|integer|between:1,12',
        ]);

        $workspace->update($validated);
        return response()->json(['data' => $workspace->fresh('settings')]);
    }

    public function switch(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$request->user()->belongsToWorkspace($workspace->id)) {
            return response()->json(['message' => 'Not a member of this workspace.'], 403);
        }

        $request->user()->update(['current_workspace_id' => $workspace->id]);

        return response()->json([
            'data' => $workspace->load('settings'),
            'message' => 'Workspace switched.',
        ]);
    }
}
