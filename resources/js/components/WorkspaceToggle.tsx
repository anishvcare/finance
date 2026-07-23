import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Briefcase, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { getDefaultCurrency } from '../lib/currencies';

/**
 * Business / Personal workspace switcher.
 * Switches the current workspace (creating the Personal/Business one on first use).
 */
export default function WorkspaceToggle() {
    const { user, workspace } = useAuth();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);

    const workspaces = user?.workspaces || [];
    const activeType = workspace?.type;

    const go = async (type: 'business' | 'personal') => {
        if (busy || activeType === type) return;
        setBusy(true);
        try {
            const existing = workspaces.find(w => w.type === type);
            if (existing) {
                await api.post(`/workspaces/${existing.id}/switch`);
            } else {
                // Creating a workspace also sets it as the current one server-side.
                await api.post('/workspaces', {
                    name: type === 'business' ? 'My Business' : 'Personal',
                    type,
                    currency: workspace?.currency || getDefaultCurrency(),
                    timezone: workspace?.timezone || 'Asia/Kolkata',
                });
            }
            queryClient.clear();
            // Full reload guarantees every page shows the selected workspace's data.
            window.location.reload();
        } catch (e: any) {
            toast.error('Failed to switch workspace.');
            setBusy(false);
        }
    };

    const btn = (type: 'business' | 'personal', label: string, Icon: React.ElementType) => {
        const active = activeType === type;
        return (
            <button
                onClick={() => go(type)}
                disabled={busy}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
            {btn('business', 'Business', Briefcase)}
            {btn('personal', 'Personal', User)}
        </div>
    );
}
