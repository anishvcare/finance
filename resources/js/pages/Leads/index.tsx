import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney, getDefaultCurrency } from '../../lib/currencies';
import CurrencySelect from '../../components/CurrencySelect';
import CountryStateSelect from '../../components/CountryStateSelect';
import { Plus, Filter, RotateCcw, Target, X, Pencil, Trash2, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const CHANNELS = ['Website', 'Referral', 'WhatsApp', 'Facebook', 'Instagram', 'Google', 'Walk-in', 'Phone', 'Email', 'Exhibition', 'Other'];
const STAGES = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
];
const STAGE_STYLES: Record<string, string> = {
    new: 'bg-gray-100 text-gray-600', contacted: 'bg-blue-100 text-blue-700', qualified: 'bg-indigo-100 text-indigo-700',
    proposal: 'bg-amber-100 text-amber-700', negotiation: 'bg-orange-100 text-orange-700', won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-600',
};
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-gray-100 text-gray-500', medium: 'bg-blue-100 text-blue-600', high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700',
};
const today = () => new Date().toISOString().split('T')[0];
const EMPTY_FILTERS = { search: '', category: '', channel: '', stage: '', contact: '', followup: '' };

export default function Leads() {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data: stats } = useQuery({ queryKey: ['lead-stats'], queryFn: async () => (await api.get('/leads/stats')).data });

    const { data, isLoading } = useQuery({
        queryKey: ['leads', page, filters],
        queryFn: async () => {
            const params: Record<string, any> = { page, per_page: 20 };
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            return (await api.get('/leads', { params })).data;
        },
    });

    const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); queryClient.invalidateQueries({ queryKey: ['lead-stats'] }); };

    const stageMutation = useMutation({
        mutationFn: async ({ id, stage }: { id: number; stage: string }) => api.put(`/leads/${id}`, { stage }),
        onSuccess: () => { invalidate(); toast.success('Stage updated.'); },
        onError: () => toast.error('Failed to update.'),
    });
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/leads/${id}`),
        onSuccess: () => { invalidate(); toast.success('Lead deleted.'); },
        onError: () => toast.error('Failed to delete.'),
    });
    const convertMutation = useMutation({
        mutationFn: async (id: number) => api.post(`/leads/${id}/convert`),
        onSuccess: (res: any) => { invalidate(); toast.success(res.data?.message || 'Converted to customer.'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to convert.'),
    });

    const setFilter = (k: string, v: string) => { setFilters(p => ({ ...p, [k]: v })); setPage(1); };

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Leads</h1>
                <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New Lead</span></button>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatPill label="Due Today" value={stats?.today ?? 0} className="bg-amber-50 text-amber-700 border-amber-200" onClick={() => setFilter('followup', 'today')} />
                <StatPill label="Overdue" value={stats?.overdue ?? 0} className="bg-red-50 text-red-700 border-red-200" onClick={() => setFilter('followup', 'overdue')} />
                <StatPill label="Upcoming" value={stats?.upcoming ?? 0} className="bg-blue-50 text-blue-700 border-blue-200" onClick={() => setFilter('followup', 'upcoming')} />
                <StatPill label="Urgent" value={stats?.urgent ?? 0} className="bg-rose-50 text-rose-700 border-rose-200" onClick={() => setFilter('priority' as any, 'urgent')} />
            </div>

            {/* Filter bar */}
            <div className="card space-y-4">
                <div className="flex items-center space-x-2 text-gray-700"><Filter className="w-4 h-4" /><h2 className="font-semibold">Filter Leads</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label">Search</label>
                        <input className="input" placeholder="Name, phone, email, website" value={filters.search} onChange={e => setFilter('search', e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Category</label>
                        <select className="input" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                            <option value="">All Categories</option>
                            {(stats?.categories || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Channel</label>
                        <select className="input" value={filters.channel} onChange={e => setFilter('channel', e.target.value)}>
                            <option value="">All Channels</option>
                            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Lead Stage</label>
                        <select className="input" value={filters.stage} onChange={e => setFilter('stage', e.target.value)}>
                            <option value="">All Stages</option>
                            {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Contact Data</label>
                        <select className="input" value={filters.contact} onChange={e => setFilter('contact', e.target.value)}>
                            <option value="">Any Contact</option>
                            <option value="has_email">Has Email</option>
                            <option value="has_mobile">Has Mobile</option>
                            <option value="has_phone">Has Phone</option>
                            <option value="no_contact">Missing Contact</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Follow-up</label>
                        <select className="input" value={filters.followup} onChange={e => setFilter('followup', e.target.value)}>
                            <option value="">All Follow-ups</option>
                            <option value="today">Due Today</option>
                            <option value="overdue">Overdue</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="none">No Follow-up</option>
                        </select>
                    </div>
                </div>
                <div>
                    <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} className="btn-secondary flex items-center space-x-1"><RotateCcw className="w-4 h-4" /><span>Reset</span></button>
                </div>
            </div>

            {/* List */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="bg-gray-50 border-b">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Lead</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Channel</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Priority</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Stage</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Follow-up</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Value</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                            data?.data?.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center"><Target className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No leads found.</p></td></tr> :
                            data?.data?.map((l: any) => {
                                const overdue = l.next_follow_up_date && l.next_follow_up_date < today() && !['won', 'lost'].includes(l.stage);
                                return (
                                    <tr key={l.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button onClick={() => { setEditing(l); setShowForm(true); }} className="font-medium text-gray-900 hover:text-blue-600 text-left">{l.name}</button>
                                            {l.company && <p className="text-xs text-gray-500">{l.company}</p>}
                                            {(l.mobile || l.email) && <p className="text-xs text-gray-400">{l.mobile || l.email}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{l.channel || '-'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_STYLES[l.priority]}`}>{l.priority}</span></td>
                                        <td className="px-4 py-3">
                                            <select value={l.stage} onChange={e => stageMutation.mutate({ id: l.id, stage: e.target.value })} className={`text-xs font-medium rounded-full px-2 py-1 border-0 capitalize cursor-pointer ${STAGE_STYLES[l.stage]}`}>
                                                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                        </td>
                                        <td className={`px-4 py-3 text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{l.next_follow_up_date || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-right">{l.estimated_value ? formatMoney(l.estimated_value, l.currency) : '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-1">
                                                <button onClick={() => { setEditing(l); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                {!l.converted_customer_id && <button onClick={() => { if (confirm(`Convert "${l.name}" to a customer?`)) convertMutation.mutate(l.id); }} className="p-1.5 text-gray-400 hover:text-green-600" title="Convert to customer"><UserCheck className="w-4 h-4" /></button>}
                                                <button onClick={() => { if (confirm(`Delete "${l.name}"?`)) deleteMutation.mutate(l.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Page {data.current_page} of {data.last_page} ({data.total} total)</p>
                        <div className="flex space-x-2">
                            <button className="btn-secondary text-xs flex items-center" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" />Prev</button>
                            <button className="btn-secondary text-xs flex items-center" disabled={page >= data.last_page} onClick={() => setPage(p => p + 1)}>Next<ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {showForm && <LeadWizard initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { invalidate(); setShowForm(false); setEditing(null); }} />}
        </div>
    );
}

function StatPill({ label, value, className, onClick }: { label: string; value: number; className: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className={`border rounded-xl px-4 py-3 text-left transition hover:shadow-sm ${className}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
        </button>
    );
}

function LeadWizard({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<any>({
        name: '', company: '', email: '', mobile: '', phone: '', website: '', city: '', state: '', country: '',
        channel: '', category: '', stage: 'new', priority: 'medium', estimated_value: '', currency: getDefaultCurrency(),
        next_follow_up_date: '', notes: '',
    });

    useEffect(() => {
        if (initial) setForm({
            name: initial.name || '', company: initial.company || '', email: initial.email || '', mobile: initial.mobile || '',
            phone: initial.phone || '', website: initial.website || '', city: initial.city || '', state: initial.state || '',
            country: initial.country || '', channel: initial.channel || '', category: initial.category || '',
            stage: initial.stage || 'new', priority: initial.priority || 'medium',
            estimated_value: initial.estimated_value ? (initial.estimated_value / 100).toString() : '',
            currency: initial.currency || getDefaultCurrency(), next_follow_up_date: initial.next_follow_up_date || '', notes: initial.notes || '',
        });
    }, [initial]);

    const upd = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: async () => {
            const payload = { ...form, estimated_value: form.estimated_value ? Math.round(parseFloat(form.estimated_value) * 100) : null };
            if (initial) return api.put(`/leads/${initial.id}`, payload);
            return api.post('/leads', payload);
        },
        onSuccess: () => { toast.success(initial ? 'Lead updated.' : 'Lead created.'); onSaved(); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save lead.'),
    });

    const steps = ['Contact', 'Lead Details', 'Follow-up'];
    const canNext = step === 1 ? !!form.name.trim() : true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">{initial ? 'Edit Lead' : 'New Lead'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                {/* Stepper */}
                <div className="flex items-center mb-6">
                    {steps.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className="flex items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                                <span className={`ml-2 text-sm ${step === i + 1 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s}</span>
                            </div>
                            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${step > i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => upd('name', e.target.value)} autoFocus /></div>
                        <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => upd('company', e.target.value)} /></div>
                        <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => upd('mobile', e.target.value)} /></div>
                        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => upd('email', e.target.value)} /></div>
                        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => upd('phone', e.target.value)} /></div>
                        <div><label className="label">Website</label><input className="input" value={form.website} onChange={e => upd('website', e.target.value)} /></div>
                        <CountryStateSelect country={form.country} state={form.state} onCountryChange={v => upd('country', v)} onStateChange={v => upd('state', v)} />
                        <div><label className="label">City</label><input className="input" value={form.city} onChange={e => upd('city', e.target.value)} /></div>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Channel / Source</label>
                            <select className="input" value={form.channel} onChange={e => upd('channel', e.target.value)}>
                                <option value="">Select…</option>
                                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Category</label><input className="input" value={form.category} onChange={e => upd('category', e.target.value)} placeholder="e.g. CCTV, Solar, Consulting" /></div>
                        <div><label className="label">Stage</label>
                            <select className="input" value={form.stage} onChange={e => upd('stage', e.target.value)}>
                                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Priority</label>
                            <select className="input" value={form.priority} onChange={e => upd('priority', e.target.value)}>
                                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p[0].toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Estimated Value</label><input type="number" step="0.01" className="input" value={form.estimated_value} onChange={e => upd('estimated_value', e.target.value)} placeholder="Optional" /></div>
                        <CurrencySelect value={form.currency} onChange={v => upd('currency', v)} />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div><label className="label">Next Follow-up Date</label><input type="date" className="input" value={form.next_follow_up_date} onChange={e => upd('next_follow_up_date', e.target.value)} /></div>
                        <div><label className="label">Notes</label><textarea className="input" rows={4} value={form.notes} onChange={e => upd('notes', e.target.value)} placeholder="Requirement, conversation summary, next steps…" /></div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                            <strong>{form.name || 'New lead'}</strong>{form.company ? ` · ${form.company}` : ''}<br />
                            {form.channel && <span>Channel: {form.channel} · </span>}Stage: {form.stage} · Priority: {form.priority}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div>
                        {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center space-x-1"><ChevronLeft className="w-4 h-4" /><span>Back</span></button>}
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={onClose} className="btn-secondary">Cancel</button>
                        {step < 3
                            ? <button onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext} className="btn-primary flex items-center space-x-1"><span>Next</span><ChevronRight className="w-4 h-4" /></button>
                            : <button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()} className="btn-primary">{save.isPending ? 'Saving…' : (initial ? 'Save Lead' : 'Create Lead')}</button>}
                    </div>
                </div>
            </div>
        </div>
    );
}
