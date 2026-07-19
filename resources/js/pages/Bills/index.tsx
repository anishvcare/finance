import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney } from '../../lib/currencies';
import { Plus, Search, Receipt, X, Trash2, CreditCard } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
};

const today = () => new Date().toISOString().split('T')[0];

export default function Bills() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [payingBill, setPayingBill] = useState<any | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['bills', page, search],
        queryFn: async () => { const r = await api.get('/bills', { params: { page, search, per_page: 20 } }); return r.data; },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => api.post('/bills', payload),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); toast.success('Bill created.'); setShowForm(false); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create bill.'),
    });

    const payMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: any }) => api.post(`/bills/${id}/record-payment`, payload),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); toast.success('Payment recorded.'); setPayingBill(null); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to record payment.'),
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/bills/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bills'] }); toast.success('Bill deleted.'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Cannot delete.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Bills</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New Bill</span></button>
            </div>

            <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search bill #..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="bg-gray-50 border-b">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Bill #</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Supplier</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Due</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Total</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Balance</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                            data?.data?.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center"><Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No bills yet.</p></td></tr> :
                            data?.data?.map((b: any) => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{b.bill_number}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{b.supplier?.business_name || b.supplier?.name || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{b.due_date}</td>
                                    <td className="px-4 py-3 text-sm text-right">{formatMoney(b.total, b.currency)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">{formatMoney(b.balance_due, b.currency)}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>{(b.status || '').replace('_', ' ')}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end space-x-1">
                                            {b.balance_due > 0 && <button onClick={() => setPayingBill(b)} className="p-1.5 text-gray-400 hover:text-green-600" title="Record payment"><CreditCard className="w-4 h-4" /></button>}
                                            {b.amount_paid === 0 && <button onClick={() => { if (confirm(`Delete ${b.bill_number}?`)) del.mutate(b.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
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

            {showForm && <BillFormModal onClose={() => setShowForm(false)} onSubmit={(d) => createMutation.mutate(d)} saving={createMutation.isPending} />}
            {payingBill && <RecordPaymentModal bill={payingBill} onClose={() => setPayingBill(null)} onSubmit={(payload) => payMutation.mutate({ id: payingBill.id, payload })} saving={payMutation.isPending} />}
        </div>
    );
}

function BillFormModal({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const { data: suppliers } = useQuery({ queryKey: ['suppliers', 'all'], queryFn: async () => (await api.get('/suppliers', { params: { per_page: 200 } })).data });
    const [form, setForm] = useState({ supplier_id: '', supplier_invoice_number: '', bill_date: today(), due_date: today(), currency: 'INR', notes: '' });
    const [items, setItems] = useState([{ type: 'expense', name: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
    const updateItem = (i: number, k: string, v: any) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
    const addItem = () => setItems(prev => [...prev, { type: 'expense', name: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);
    const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const estTotal = useMemo(() => items.reduce((sum, it) => {
        const line = it.quantity * it.unit_price;
        return sum + line + line * (it.tax_rate / 100);
    }, 0), [items]);

    const submit = () => {
        onSubmit({
            ...form,
            supplier_id: parseInt(form.supplier_id),
            items: items.filter(it => it.name).map(it => ({ type: it.type, name: it.name, quantity: it.quantity, unit_price: Math.round(it.unit_price), tax_rate: it.tax_rate })),
        });
    };

    const valid = form.supplier_id && items.some(it => it.name);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">New Bill</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Supplier *</label>
                            <select className="input" value={form.supplier_id} onChange={e => update('supplier_id', e.target.value)}>
                                <option value="">Select supplier...</option>
                                {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.business_name || s.name}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Supplier Invoice #</label><input className="input" value={form.supplier_invoice_number} onChange={e => update('supplier_invoice_number', e.target.value)} /></div>
                        <div><label className="label">Bill Date *</label><input type="date" className="input" value={form.bill_date} onChange={e => update('bill_date', e.target.value)} /></div>
                        <div><label className="label">Due Date *</label><input type="date" className="input" value={form.due_date} onChange={e => update('due_date', e.target.value)} /></div>
                    </div>

                    <div>
                        <label className="label">Line Items</label>
                        <div className="space-y-2">
                            {items.map((it, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input className="input flex-1" placeholder="Description" value={it.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                                    <input type="number" min="0" step="0.01" className="input w-20" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} />
                                    <input type="number" min="0" step="0.01" className="input w-28" placeholder="Unit price" value={it.unit_price / 100 || ''} onChange={e => updateItem(i, 'unit_price', Math.round((parseFloat(e.target.value) || 0) * 100))} />
                                    <input type="number" min="0" step="0.01" className="input w-20" placeholder="Tax %" value={it.tax_rate || ''} onChange={e => updateItem(i, 'tax_rate', parseFloat(e.target.value) || 0)} />
                                    <button onClick={() => removeItem(i)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addItem} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add line</button>
                    </div>

                    <div className="text-right text-sm text-gray-600">Estimated total: <span className="font-semibold text-gray-900">{formatMoney(estTotal, form.currency)}</span></div>
                    <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={submit} disabled={saving || !valid} className="btn-primary">{saving ? 'Saving...' : 'Create Bill'}</button>
                </div>
            </div>
        </div>
    );
}

function RecordPaymentModal({ bill, onClose, onSubmit, saving }: { bill: any; onClose: () => void; onSubmit: (d: any) => void; saving: boolean }) {
    const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get('/accounts')).data });
    const [form, setForm] = useState({ amount: bill.balance_due / 100, payment_date: today(), payment_method: 'bank_transfer', account_id: '', reference_number: '' });
    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const defaultAccount = accounts?.data?.find((a: any) => a.is_default)?.id || accounts?.data?.[0]?.id || '';
    const accountId = form.account_id || defaultAccount;

    const submit = () => onSubmit({
        amount: Math.round(form.amount * 100),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        account_id: parseInt(accountId),
        reference_number: form.reference_number,
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Record Payment</h2><button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                <p className="text-sm text-gray-500 mb-4">{bill.bill_number} · Balance {formatMoney(bill.balance_due, bill.currency)}</p>
                <div className="space-y-4">
                    <div><label className="label">Amount *</label><input type="number" step="0.01" className="input" value={form.amount} onChange={e => update('amount', parseFloat(e.target.value) || 0)} /></div>
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
                    <button onClick={submit} disabled={saving || !accountId || form.amount <= 0} className="btn-primary">{saving ? 'Saving...' : 'Record Payment'}</button>
                </div>
            </div>
        </div>
    );
}
