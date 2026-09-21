<?php

namespace App\Traits;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

trait ValidatesWorkspaceOwnership
{
    /**
     * An `exists` rule constrained to the caller's current workspace.
     *
     * The plain `exists:<table>,id` rule runs a raw query against the whole
     * table. Global Eloquent scopes such as WorkspaceScope do not apply to it,
     * so `exists:customers,id` happily accepts a customer id belonging to a
     * different tenant. Every foreign key that points at a workspace-owned
     * table must therefore be validated with this rule instead.
     *
     * If there is somehow no current workspace the comparison is against null,
     * which matches nothing — validation fails closed rather than open.
     */
    protected function existsInWorkspace(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)
            ->where('workspace_id', auth()->user()?->current_workspace_id);
    }

    /**
     * A user id rule limited to members of the caller's current workspace.
     *
     * `exists:users,id` accepts any account on the whole installation, which
     * would allow assigning work to a stranger outside the workspace.
     */
    protected function existsAsWorkspaceMember(): Exists
    {
        return Rule::exists('workspace_members', 'user_id')
            ->where('workspace_id', auth()->user()?->current_workspace_id);
    }
}
