<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function view(User $user, Product $product): bool
    {
        return $user->current_workspace_id === $product->workspace_id
            && $user->belongsToWorkspace($product->workspace_id);
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->current_workspace_id !== $product->workspace_id) return false;

        return $user->hasWorkspaceRole($product->workspace_id, ['owner', 'administrator', 'manager', 'staff']);
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->current_workspace_id !== $product->workspace_id) return false;

        return $user->hasWorkspaceRole($product->workspace_id, ['owner', 'administrator']);
    }

    public function restore(User $user, Product $product): bool
    {
        return $this->delete($user, $product);
    }
}
