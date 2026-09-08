<?php

namespace App\Traits;

use App\Models\Workspace;
use App\Scopes\WorkspaceScope;

trait BelongsToWorkspace
{
    protected static function bootBelongsToWorkspace(): void
    {
        static::addGlobalScope(new WorkspaceScope());

        static::creating(function ($model) {
            if (! $model->workspace_id && auth()->check()) {
                $model->workspace_id = auth()->user()->current_workspace_id;
            }
        });
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeForWorkspace($query, int $workspaceId)
    {
        return $query->withoutGlobalScope(WorkspaceScope::class)
            ->where('workspace_id', $workspaceId);
    }
}
