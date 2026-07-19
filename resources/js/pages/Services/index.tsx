import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Briefcase, X, Pencil, Trash2 } from 'lucide-react';

function formatMoney(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format((amount || 0) / 100);
}

export default function Services() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['services', page, search],
        queryFn: async () => { const r = await api.get('/services', { params: { page, search, per_page: 20 } }); return r.data; },
    });

    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (editing) return (await api.put(`/services/${editing.id}`, formData)).data;
            return (await api.post('/services', formData)).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast.success(editing ? 'Service updated.' : 'Service created.');
            setShowForm(false); setEditing(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save service.'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/services/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); toast.success('Service deleted.'); },
        onError: () => toast.error('Failed to delete service.'),
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (s: any) => { setEditing(s); setShowForm(true); };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Services</h1>
                <button onClick={openCreate} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Add Service</span></button>
            </div>

            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search services..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Service</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Hourly Rate</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Fixed Price</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                        data?.data?.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center"><Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No services yet.</p></td></tr> :
                        data?.data?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="font-medium text-gray-900 hover:text-blue-600">{s.name}</button></td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.code || '-'}</td>
                                <td className="px-4 py-3 text-sm text-right">{s.hourly_rate ? formatMoney(s.hourly_rate, s.currency) : '-'}</td>
                                <td className="px-4 py-3 text-sm text-right">{s.fixed_price ? formatMoney(s.fixed_price, s.currency) : '-'}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Archived'}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end space-x-1">
                                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Showing page {data.current_page} of {data.last_page} ({data.total} total)</p>
                        <div className="flex space-x-2">
                            <button className="btn-secondary text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <button className="btn-secondary text-xs" disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {showForm && <ServiceFormModal initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={(d) => saveMutation.mutate(d)} saving={saveMutation.isPending} />}
        </div>
    );
}

function ServiceFormModal({ initial, onClose, onSubmit, saving }: { initial: any | null; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ name: '', code: '', description: '', unit: 'hour', hourly_rate: 0, fixed_price: 0, minimum_charge: 0, estimated_duration: '', notes: '' });

    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '', code: initial.code || '', description: initial.description || '',
                unit: initial.unit || 'hour', hourly_rate: initial.hourly_rate || 0, fixed_price: initial.fixed_price || 0,
                minimum_charge: initial.minimum_charge || 0, estimated_duration: initial.estimated_duration || '', notes: initial.notes || '',
            });
        }
    }, [initial]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const submit = () => {
        onSubmit({
            ...form,
            hourly_rate: form.hourly_rate || undefined,
            fixed_price: form.fixed_price || undefined,
            minimum_charge: form.minimum_charge || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{initial ? 'Edit Service' : 'New Service'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="label">Service Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
                        <div><label className="label">Code</label><input className="input" value={form.code} onChange={e => update('code', e.target.value)} /></div>
                        <div><label className="label">Unit</label>
                            <select className="input" value={form.unit} onChange={e => update('unit', e.target.value)}>
                                <option value="hour">Hour</option><option value="day">Day</option><option value="job">Job</option>
                                <option value="project">Project</option><option value="month">Month</option><option value="each">Each</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => update('description', e.target.value)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="label">Hourly Rate</label><input type="number" step="0.01" className="input" value={form.hourly_rate / 100} onChange={e => update('hourly_rate', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Fixed Price</label><input type="number" step="0.01" className="input" value={form.fixed_price / 100} onChange={e => update('fixed_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Minimum Charge</label><input type="number" step="0.01" className="input" value={form.minimum_charge / 100} onChange={e => update('minimum_charge', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                    </div>
                    <div><label className="label">Estimated Duration</label><input className="input" value={form.estimated_duration} onChange={e => update('estimated_duration', e.target.value)} placeholder="e.g. 2-3 hours" /></div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={submit} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Service')}</button>
                </div>
            </div>
        </div>
    );
}
