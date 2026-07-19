<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function view(User $user, Workspace $workspace): bool
    {
        return $user->belongsToWorkspace($workspace->id);
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return $user->hasWorkspaceRole($workspace->id, ['owner', 'administrator']);
    }

    public function delete(User $user, Workspace $workspace): bool
    {
        return $user->hasWorkspaceRole($workspace->id, ['owner']);
    }

    public function inviteMembers(User $user, Workspace $workspace): bool
    {
        return $user->hasWorkspaceRole($workspace->id, ['owner', 'administrator', 'manager']);
    }
}
