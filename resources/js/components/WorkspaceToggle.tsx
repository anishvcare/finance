import React from 'react';
import { Briefcase, User } from 'lucide-react';
import { useWorkspaceSwitch, WorkspaceType } from '../lib/useWorkspaceSwitch';

/**
 * Business / Personal workspace switcher (dashboard).
 * Switches the current workspace (creating the Personal/Business one on first use).
 */
export default function WorkspaceToggle() {
    const { activeType, busy, switchToType } = useWorkspaceSwitch();

    const btn = (type: WorkspaceType, label: string, Icon: React.ElementType) => {
        const active = activeType === type;
        return (
            <button
                onClick={() => switchToType(type)}
                disabled={busy}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60 ${active ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
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
