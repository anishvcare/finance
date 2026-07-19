import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Users, X, Pencil, Trash2 } from 'lucide-react';
import CountryStateSelect from '../../components/CountryStateSelect';
import CurrencySelect from '../../components/CurrencySelect';
import { getDefaultCurrency } from '../../lib/currencies';

export default function Customers() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['customers', page, search],
        queryFn: async () => { const r = await api.get('/customers', { params: { page, search, per_page: 20 } }); return r.data; },
    });

    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (editing) return (await api.put(`/customers/${editing.id}`, formData)).data;
            return (await api.post('/customers', formData)).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success(editing ? 'Customer updated.' : 'Customer created.');
            setShowForm(false); setEditing(null);
        },
        onError: (err: any) => { toast.error(err.response?.data?.message || 'Failed to save customer.'); },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/customers/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deleted.'); },
        onError: () => toast.error('Failed to delete customer.'),
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (c: any) => { setEditing(c); setShowForm(true); };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Customers</h1>
                <button onClick={openCreate} className="btn-primary flex items-center space-x-1">
                    <Plus className="w-4 h-4" /><span>Add Customer</span>
                </button>
            </div>

            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search customers..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Email</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Mobile</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Type</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                        data?.data?.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center"><Users className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No customers yet.</p></td></tr> :
                        data?.data?.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3"><Link to={`/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.name}</Link>{c.business_name && <span className="text-xs text-gray-500 ml-2">{c.business_name}</span>}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.mobile || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.type}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.is_active ? 'Active' : 'Archived'}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end space-x-1">
                                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMutation.mutate(c.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
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

            {showForm && <CustomerFormModal initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={(d) => saveMutation.mutate(d)} saving={saveMutation.isPending} />}
        </div>
    );
}

function CustomerFormModal({ initial, onClose, onSubmit, saving }: { initial: any | null; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ type: 'individual', name: '', business_name: '', email: '', mobile: '', currency: getDefaultCurrency(), billing_address_line_1: '', billing_city: '', billing_state: '', billing_postal_code: '', billing_country: '', payment_terms: 30, notes: '' });

    useEffect(() => {
        if (initial) {
            setForm({
                type: initial.type || 'individual',
                name: initial.name || '',
                business_name: initial.business_name || '',
                email: initial.email || '',
                mobile: initial.mobile || '',
                currency: initial.currency || getDefaultCurrency(),
                billing_address_line_1: initial.billing_address_line_1 || '',
                billing_city: initial.billing_city || '',
                billing_state: initial.billing_state || '',
                billing_postal_code: initial.billing_postal_code || '',
                billing_country: initial.billing_country || '',
                payment_terms: initial.payment_terms ?? 30,
                notes: initial.notes || '',
            });
        }
    }, [initial]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{initial ? 'Edit Customer' : 'New Customer'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Type</label><select className="input" value={form.type} onChange={e => update('type', e.target.value)}><option value="individual">Individual</option><option value="business">Business</option><option value="organisation">Organisation</option></select></div>
                        <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
                        <div><label className="label">Business Name</label><input className="input" value={form.business_name} onChange={e => update('business_name', e.target.value)} /></div>
                        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                        <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
                        <CurrencySelect value={form.currency} onChange={v => update('currency', v)} />
                    </div>
                    <h3 className="font-medium text-gray-800 pt-2">Billing Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="label">Address</label><input className="input" value={form.billing_address_line_1} onChange={e => update('billing_address_line_1', e.target.value)} /></div>
                        <CountryStateSelect country={form.billing_country} state={form.billing_state} onCountryChange={v => update('billing_country', v)} onStateChange={v => update('billing_state', v)} />
                        <div><label className="label">City</label><input className="input" value={form.billing_city} onChange={e => update('billing_city', e.target.value)} /></div>
                        <div><label className="label">Postal Code</label><input className="input" value={form.billing_postal_code} onChange={e => update('billing_postal_code', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Payment Terms (days)</label><input className="input" type="number" value={form.payment_terms} onChange={e => update('payment_terms', parseInt(e.target.value) || 0)} /></div>
                    </div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={() => onSubmit(form)} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Customer')}</button>
                </div>
            </div>
        </div>
    );
}
