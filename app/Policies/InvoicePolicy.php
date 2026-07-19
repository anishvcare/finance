<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->current_workspace_id === $invoice->workspace_id
            && $user->belongsToWorkspace($invoice->workspace_id);
    }

    public function update(User $user, Invoice $invoice): bool
    {
        if ($user->current_workspace_id !== $invoice->workspace_id) return false;
        if (!$invoice->isEditable()) return false;

        return $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator', 'accountant', 'manager', 'staff']);
    }

    public function finalise(User $user, Invoice $invoice): bool
    {
        if ($user->current_workspace_id !== $invoice->workspace_id) return false;

        return $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator', 'accountant']);
    }

    public function send(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice)
            && $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator', 'accountant', 'manager', 'staff']);
    }

    public function recordPayment(User $user, Invoice $invoice): bool
    {
        if ($user->current_workspace_id !== $invoice->workspace_id) return false;

        return $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator', 'accountant', 'manager']);
    }

    public function void(User $user, Invoice $invoice): bool
    {
        if ($user->current_workspace_id !== $invoice->workspace_id) return false;

        return $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator']);
    }

    public function share(User $user, Invoice $invoice): bool
    {
        return $this->view($user, $invoice);
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        if ($user->current_workspace_id !== $invoice->workspace_id) return false;
        if (!$invoice->isDraft()) return false;

        return $user->hasWorkspaceRole($invoice->workspace_id, ['owner', 'administrator']);
    }
}
