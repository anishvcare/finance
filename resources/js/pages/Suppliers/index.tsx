import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Truck, X, Pencil, Trash2 } from 'lucide-react';

export default function Suppliers() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['suppliers', page, search],
        queryFn: async () => { const r = await api.get('/suppliers', { params: { page, search, per_page: 20 } }); return r.data; },
    });

    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (editing) return (await api.put(`/suppliers/${editing.id}`, formData)).data;
            return (await api.post('/suppliers', formData)).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(editing ? 'Supplier updated.' : 'Supplier created.');
            setShowForm(false); setEditing(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save supplier.'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/suppliers/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('Supplier deleted.'); },
        onError: () => toast.error('Failed to delete supplier.'),
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (s: any) => { setEditing(s); setShowForm(true); };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Suppliers</h1>
                <button onClick={openCreate} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Add Supplier</span></button>
            </div>

            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search suppliers..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Email</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Mobile</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                        data?.data?.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center"><Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No suppliers yet.</p></td></tr> :
                        data?.data?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="font-medium text-gray-900 hover:text-blue-600">{s.name}</button>{s.business_name && <span className="text-xs text-gray-500 ml-2">{s.business_name}</span>}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.email || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{s.mobile || '-'}</td>
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

            {showForm && <SupplierFormModal initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={(d) => saveMutation.mutate(d)} saving={saveMutation.isPending} />}
        </div>
    );
}

function SupplierFormModal({ initial, onClose, onSubmit, saving }: { initial: any | null; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ name: '', business_name: '', contact_person: '', email: '', mobile: '', address_line_1: '', city: '', state: '', postal_code: '', country: '', tax_number: '', payment_terms: 30, notes: '' });

    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '', business_name: initial.business_name || '', contact_person: initial.contact_person || '',
                email: initial.email || '', mobile: initial.mobile || '', address_line_1: initial.address_line_1 || '',
                city: initial.city || '', state: initial.state || '', postal_code: initial.postal_code || '',
                country: initial.country || '', tax_number: initial.tax_number || '', payment_terms: initial.payment_terms ?? 30, notes: initial.notes || '',
            });
        }
    }, [initial]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{initial ? 'Edit Supplier' : 'New Supplier'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
                        <div><label className="label">Business Name</label><input className="input" value={form.business_name} onChange={e => update('business_name', e.target.value)} /></div>
                        <div><label className="label">Contact Person</label><input className="input" value={form.contact_person} onChange={e => update('contact_person', e.target.value)} /></div>
                        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                        <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
                        <div><label className="label">Tax Number</label><input className="input" value={form.tax_number} onChange={e => update('tax_number', e.target.value)} /></div>
                    </div>
                    <h3 className="font-medium text-gray-800 pt-2">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="label">Address</label><input className="input" value={form.address_line_1} onChange={e => update('address_line_1', e.target.value)} /></div>
                        <div><label className="label">City</label><input className="input" value={form.city} onChange={e => update('city', e.target.value)} /></div>
                        <div><label className="label">State</label><input className="input" value={form.state} onChange={e => update('state', e.target.value)} /></div>
                        <div><label className="label">Postal Code</label><input className="input" value={form.postal_code} onChange={e => update('postal_code', e.target.value)} /></div>
                        <div><label className="label">Country</label><input className="input" value={form.country} onChange={e => update('country', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Payment Terms (days)</label><input className="input" type="number" value={form.payment_terms} onChange={e => update('payment_terms', parseInt(e.target.value) || 0)} /></div>
                    </div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={() => onSubmit(form)} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Supplier')}</button>
                </div>
            </div>
        </div>
    );
}
