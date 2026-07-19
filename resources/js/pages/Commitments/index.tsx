import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney } from '../../lib/currencies';
import { Plus, Search, Handshake, X, Trash2 } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-400',
};
const PRIORITY_STYLES: Record<string, string> = {
    low: 'text-gray-500', medium: 'text-blue-600', high: 'text-amber-600', urgent: 'text-red-600',
};
const today = () => new Date().toISOString().split('T')[0];

export default function Commitments() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['commitments', page, search, status],
        queryFn: async () => { const r = await api.get('/commitments', { params: { page, search, status: status || undefined, per_page: 20 } }); return r.data; },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post('/commitments', payload),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['commitments'] }); toast.success('Commitment created.'); setShowForm(false); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create.'),
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => api.put(`/commitments/${id}`, { status }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['commitments'] }); toast.success('Updated.'); },
        onError: () => toast.error('Failed to update.'),
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/commitments/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['commitments'] }); toast.success('Deleted.'); },
        onError: () => toast.error('Failed to delete.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Commitments</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New Commitment</span></button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="input max-w-[170px]" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {['pending', 'in_progress', 'completed', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="bg-gray-50 border-b">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Title</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Due</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Priority</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Amount</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3"></th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                            data?.data?.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center"><Handshake className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No commitments yet.</p></td></tr> :
                            data?.data?.map((c: any) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{c.title}</p>
                                        {(c.customer?.name || c.supplier?.name) && <p className="text-xs text-gray-500">{c.customer?.name || c.supplier?.name}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{c.due_date}</td>
                                    <td className={`px-4 py-3 text-sm font-medium capitalize ${PRIORITY_STYLES[c.priority] || ''}`}>{c.priority}</td>
                                    <td className="px-4 py-3 text-sm text-right">{c.amount ? formatMoney(c.amount, c.currency || 'INR') : '-'}</td>
                                    <td className="px-4 py-3">
                                        <select value={c.status} onChange={e => updateStatus.mutate({ id: c.id, status: e.target.value })} className={`text-xs font-medium rounded-full px-2 py-1 border-0 capitalize cursor-pointer ${STATUS_STYLES[c.status] || 'bg-gray-100'}`}>
                                            {['pending', 'in_progress', 'completed', 'overdue', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => { if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Page {data.current_page} of {data.last_page} ({data.total} total)</p>
                        <div className="flex space-x-2">
                            <button className="btn-secondary text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <button className="btn-secondary text-xs" disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {showForm && <CommitmentFormModal onClose={() => setShowForm(false)} onSubmit={(d) => createMutation.mutate(d)} saving={createMutation.isPending} />}
        </div>
    );
}

function CommitmentFormModal({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const { data: customers } = useQuery({ queryKey: ['customers', 'all'], queryFn: async () => (await api.get('/customers', { params: { per_page: 200 } })).data });
    const [form, setForm] = useState({ title: '', description: '', type: '', priority: 'medium', due_date: today(), customer_id: '', amount: '', currency: 'INR', notes: '' });
    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const submit = () => onSubmit({
        title: form.title,
        description: form.description || undefined,
        type: form.type || undefined,
        priority: form.priority,
        due_date: form.due_date,
        customer_id: form.customer_id ? parseInt(form.customer_id) : undefined,
        amount: form.amount ? Math.round(parseFloat(form.amount) * 100) : undefined,
        currency: form.currency,
        notes: form.notes || undefined,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">New Commitment</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                <div className="space-y-4">
                    <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => update('title', e.target.value)} autoFocus /></div>
                    <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => update('description', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Due Date *</label><input type="date" className="input" value={form.due_date} onChange={e => update('due_date', e.target.value)} /></div>
                        <div><label className="label">Priority</label>
                            <select className="input" value={form.priority} onChange={e => update('priority', e.target.value)}>
                                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Customer</label>
                            <select className="input" value={form.customer_id} onChange={e => update('customer_id', e.target.value)}>
                                <option value="">— None —</option>
                                {customers?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.business_name || c.name}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Amount</label><input type="number" step="0.01" className="input" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="Optional" /></div>
                    </div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={submit} disabled={saving || !form.title} className="btn-primary">{saving ? 'Saving...' : 'Create Commitment'}</button>
                </div>
            </div>
        </div>
    );
}
