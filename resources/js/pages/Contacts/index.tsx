import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Contact as ContactIcon, X, Pencil, Trash2, Mail, Phone } from 'lucide-react';

export default function Contacts() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['contacts', page, search],
        queryFn: async () => { const r = await api.get('/contacts', { params: { page, search, per_page: 20 } }); return r.data; },
    });

    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            if (editing) return (await api.put(`/contacts/${editing.id}`, formData)).data;
            return (await api.post('/contacts', formData)).data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success(editing ? 'Contact updated.' : 'Contact created.'); setShowForm(false); setEditing(null); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save contact.'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/contacts/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted.'); },
        onError: () => toast.error('Failed to delete contact.'),
    });

    const openCreate = () => { setEditing(null); setShowForm(true); };
    const openEdit = (c: any) => { setEditing(c); setShowForm(true); };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Contacts</h1>
                <button onClick={openCreate} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>Add Contact</span></button>
            </div>

            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search contacts..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            <div className="card overflow-hidden p-0">
                <table className="w-full">
                    <thead><tr className="bg-gray-50 border-b">
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Organisation</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Role</th>
                        <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Contact</th>
                        <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                        data?.data?.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center"><ContactIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No contacts yet.</p></td></tr> :
                        data?.data?.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.organisation || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{c.role || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="space-y-0.5">
                                        {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{c.email}</div>}
                                        {c.mobile && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{c.mobile}</div>}
                                    </div>
                                </td>
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
                        <p className="text-sm text-gray-500">Page {data.current_page} of {data.last_page} ({data.total} total)</p>
                        <div className="flex space-x-2">
                            <button className="btn-secondary text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                            <button className="btn-secondary text-xs" disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {showForm && <ContactFormModal initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSubmit={(d) => saveMutation.mutate(d)} saving={saveMutation.isPending} />}
        </div>
    );
}

function ContactFormModal({ initial, onClose, onSubmit, saving }: { initial: any | null; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ name: '', email: '', mobile: '', organisation: '', role: '', notes: '' });

    useEffect(() => {
        if (initial) setForm({
            name: initial.name || '', email: initial.email || '', mobile: initial.mobile || '',
            organisation: initial.organisation || '', role: initial.role || '', notes: initial.notes || '',
        });
    }, [initial]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{initial ? 'Edit Contact' : 'New Contact'}</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} autoFocus /></div>
                        <div><label className="label">Organisation</label><input className="input" value={form.organisation} onChange={e => update('organisation', e.target.value)} /></div>
                        <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                        <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
                        <div><label className="label">Role</label><input className="input" value={form.role} onChange={e => update('role', e.target.value)} placeholder="e.g. Procurement Manager" /></div>
                    </div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={() => onSubmit(form)} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : (initial ? 'Save Changes' : 'Create Contact')}</button>
                </div>
            </div>
        </div>
    );
}
