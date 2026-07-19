<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class WorkspaceScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && auth()->user()->current_workspace_id) {
            $builder->where(
                $model->getTable() . '.workspace_id',
                auth()->user()->current_workspace_id
            );
        }
    }
}
