import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney, getDefaultCurrency } from '../../lib/currencies';
import { Plus, ArrowDownLeft, ArrowUpRight, X, Wallet } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

export default function Payments() {
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState<'incoming' | 'outgoing' | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['payments', page, typeFilter],
        queryFn: async () => { const r = await api.get('/payments', { params: { page, type: typeFilter || undefined, per_page: 20 } }); return r.data; },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post('/payments', payload),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Payment recorded.'); setShowForm(null); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to record payment.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Payments</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setShowForm('incoming')} className="btn-primary flex items-center space-x-1 bg-green-600 hover:bg-green-700"><ArrowDownLeft className="w-4 h-4" /><span>Received</span></button>
                    <button onClick={() => setShowForm('outgoing')} className="btn-primary flex items-center space-x-1 bg-red-600 hover:bg-red-700"><ArrowUpRight className="w-4 h-4" /><span>Paid Out</span></button>
                </div>
            </div>

            <div className="flex gap-2">
                {['', 'incoming', 'outgoing'].map(t => (
                    <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t || 'All'}</button>
                ))}
            </div>

            <div className="card overflow-hidden p-0">
                <div className="divide-y">
                    {isLoading ? [...Array(5)].map((_, i) => <div key={i} className="px-4 py-3 animate-pulse"><div className="h-4 bg-gray-100 rounded"></div></div>) :
                    data?.data?.length === 0 ? <div className="px-4 py-12 text-center"><Wallet className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No payments recorded.</p></div> :
                    data?.data?.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${p.type === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {p.type === 'incoming' ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{p.customer?.name || p.supplier?.name || (p.type === 'incoming' ? 'Payment received' : 'Payment made')}</p>
                                    <p className="text-xs text-gray-500">{p.payment_date} · {(p.payment_method || '').replace('_', ' ')}{p.account?.name ? ` · ${p.account.name}` : ''}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-semibold ${p.type === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>{p.type === 'incoming' ? '+' : '-'}{formatMoney(p.amount, p.currency)}</span>
                        </div>
                    ))}
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

            {showForm && <PaymentFormModal type={showForm} onClose={() => setShowForm(null)} onSubmit={(d) => createMutation.mutate(d)} saving={createMutation.isPending} />}
        </div>
    );
}

function PaymentFormModal({ type, onClose, onSubmit, saving }: { type: 'incoming' | 'outgoing'; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get('/accounts')).data });
    const { data: parties } = useQuery({
        queryKey: [type === 'incoming' ? 'customers' : 'suppliers', 'all'],
        queryFn: async () => (await api.get(type === 'incoming' ? '/customers' : '/suppliers', { params: { per_page: 200 } })).data,
    });
    const [form, setForm] = useState({ party_id: '', amount: '', currency: getDefaultCurrency(), payment_date: today(), payment_method: 'bank_transfer', account_id: '', reference_number: '', notes: '' });
    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const defaultAccount = accounts?.data?.find((a: any) => a.is_default)?.id || accounts?.data?.[0]?.id || '';
    const accountId = form.account_id || defaultAccount;

    const submit = () => onSubmit({
        type,
        customer_id: type === 'incoming' && form.party_id ? parseInt(form.party_id) : undefined,
        supplier_id: type === 'outgoing' && form.party_id ? parseInt(form.party_id) : undefined,
        account_id: parseInt(accountId),
        amount: Math.round((parseFloat(form.amount) || 0) * 100),
        currency: form.currency,
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        notes: form.notes,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">{type === 'incoming' ? 'Payment Received' : 'Payment Made'}</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                <div className="space-y-4">
                    <div><label className="label">{type === 'incoming' ? 'Customer' : 'Supplier'}</label>
                        <select className="input" value={form.party_id} onChange={e => update('party_id', e.target.value)}>
                            <option value="">— None —</option>
                            {parties?.data?.map((p: any) => <option key={p.id} value={p.id}>{p.business_name || p.name}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Amount *</label><input type="number" step="0.01" className="input text-lg" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" autoFocus /></div>
                    <div><label className="label">Account *</label>
                        <select className="input" value={accountId} onChange={e => update('account_id', e.target.value)}>
                            {accounts?.data?.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="label">Date</label><input type="date" className="input" value={form.payment_date} onChange={e => update('payment_date', e.target.value)} /></div>
                        <div><label className="label">Method</label>
                            <select className="input" value={form.payment_method} onChange={e => update('payment_method', e.target.value)}>
                                <option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="cheque">Cheque</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="label">Reference</label><input className="input" value={form.reference_number} onChange={e => update('reference_number', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={submit} disabled={saving || !accountId || !form.amount} className="btn-primary">{saving ? 'Saving...' : 'Save Payment'}</button>
                </div>
            </div>
        </div>
    );
}
