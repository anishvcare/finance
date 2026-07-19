import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Bell, X, CheckCheck, FileText, CreditCard, CheckSquare, Clock } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    data: {
        type: string;
        message: string;
        invoice_id?: number;
        task_id?: number;
        [key: string]: any;
    };
    read_at: string | null;
    created_at: string;
}

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data } = useQuery<{ data: Notification[] }>({
        queryKey: ['notifications'],
        queryFn: async () => { const r = await api.get('/notifications'); return r.data; },
        refetchInterval: 60000, // Refresh every minute
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => { await api.post(`/notifications/${id}/read`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const notifications = data?.data || [];
    const unreadCount = notifications.filter(n => !n.read_at).length;

    const getIcon = (type: string) => {
        if (type.includes('invoice')) return <FileText className="w-4 h-4 text-blue-500" />;
        if (type.includes('payment')) return <CreditCard className="w-4 h-4 text-green-500" />;
        if (type.includes('task')) return <CheckSquare className="w-4 h-4 text-purple-500" />;
        return <Clock className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh]">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">No notifications</div>
                            ) : (
                                notifications.slice(0, 20).map(n => (
                                    <div key={n.id} className={`flex items-start space-x-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 ${!n.read_at ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => { if (!n.read_at) markReadMutation.mutate(n.id); }}>
                                        <div className="mt-0.5">{getIcon(n.data.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{n.data.message}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>
                                        {!n.read_at && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
