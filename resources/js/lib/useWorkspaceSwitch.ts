import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from './auth';
import api from './api';
import { getDefaultCurrency } from './currencies';

export type WorkspaceType = 'business' | 'personal';

const DEFAULT_NAME: Record<WorkspaceType, string> = {
    business: 'My Business',
    personal: 'Personal',
};

/**
 * Shared Business/Personal workspace switching logic.
 *
 * Used by both the sidebar switcher (available on every page) and the
 * dashboard toggle so there is a single implementation of:
 *   - switching to an existing workspace
 *   - creating the Personal/Business workspace on first use
 *   - clearing cached data and hard-reloading so no stale workspace data shows
 */
export function useWorkspaceSwitch() {
    const { user, workspace } = useAuth();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);

    const workspaces = user?.workspaces ?? [];
    const activeType = (workspace?.type ?? null) as WorkspaceType | null;

    const finish = () => {
        queryClient.clear();
        // Full reload guarantees every page shows the selected workspace's data.
        window.location.reload();
    };

    /** Switch to a specific workspace by id. */
    const switchToId = async (id: number) => {
        if (busy || id === workspace?.id) return;
        setBusy(true);
        try {
            await api.post(`/workspaces/${id}/switch`);
            finish();
        } catch {
            toast.error('Failed to switch workspace.');
            setBusy(false);
        }
    };

    /**
     * Switch to the Business or Personal workspace, creating it if the user
     * doesn't have one yet (creating also sets it current server-side).
     */
    const switchToType = async (type: WorkspaceType) => {
        if (busy || activeType === type) return;
        setBusy(true);
        try {
            const existing = workspaces.find((w) => w.type === type);
            if (existing) {
                await api.post(`/workspaces/${existing.id}/switch`);
            } else {
                await api.post('/workspaces', {
                    name: DEFAULT_NAME[type],
                    type,
                    currency: workspace?.currency || getDefaultCurrency(),
                    timezone: workspace?.timezone || 'Asia/Kolkata',
                });
            }
            finish();
        } catch {
            toast.error('Failed to switch workspace.');
            setBusy(false);
        }
    };

    return { workspaces, workspace, activeType, busy, switchToId, switchToType };
}
