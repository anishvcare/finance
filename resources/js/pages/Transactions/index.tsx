import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, X, Camera } from 'lucide-react';

function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount / 100);
}

export default function Transactions() {
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState<'income' | 'expense' | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['transactions', page, typeFilter],
        queryFn: async () => { const r = await api.get('/transactions', { params: { page, per_page: 25, type: typeFilter || undefined } }); return r.data; },
    });

    const createMutation = useMutation({
        mutationFn: async (txn: any) => { await api.post('/transactions', txn); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); toast.success('Transaction added.'); setShowForm(null); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Transactions</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setShowForm('income')} className="btn-primary flex items-center space-x-1 bg-green-600 hover:bg-green-700"><ArrowDownRight className="w-4 h-4" /><span>Income</span></button>
                    <button onClick={() => setShowForm('expense')} className="btn-primary flex items-center space-x-1 bg-red-600 hover:bg-red-700"><ArrowUpRight className="w-4 h-4" /><span>Expense</span></button>
                </div>
            </div>

            <div className="flex gap-2">
                {['', 'income', 'expense', 'transfer'].map(t => (
                    <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {t || 'All'}
                    </button>
                ))}
            </div>

            <div className="card overflow-hidden p-0">
                <div className="divide-y">
                    {isLoading ? [...Array(5)].map((_, i) => <div key={i} className="px-4 py-3 animate-pulse"><div className="h-4 bg-gray-100 rounded"></div></div>) :
                    data?.data?.length === 0 ? <div className="px-4 py-12 text-center text-gray-500">No transactions found.</div> :
                    data?.data?.map((txn: any) => (
                        <div key={txn.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${txn.type === 'income' ? 'bg-green-100' : txn.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                    {txn.type === 'income' ? <ArrowDownRight className="w-4 h-4 text-green-600" /> : txn.type === 'expense' ? <ArrowUpRight className="w-4 h-4 text-red-600" /> : <ArrowLeftRight className="w-4 h-4 text-blue-600" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{txn.description || txn.category?.name || txn.type}</p>
                                    <p className="text-xs text-gray-500">{txn.date} {txn.account?.name && `· ${txn.account.name}`}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {txn.type === 'income' ? '+' : '-'}{formatMoney(txn.amount, txn.currency)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Add Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">{showForm === 'income' ? 'Add Income' : 'Add Expense'}</h2>
                            <button onClick={() => setShowForm(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <TransactionForm type={showForm} onSubmit={(d) => createMutation.mutate(d)} saving={createMutation.isPending} />
                    </div>
                </div>
            )}
        </div>
    );
}

function TransactionForm({ type, onSubmit, saving }: { type: 'income' | 'expense'; onSubmit: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], payment_method: 'cash', reference: '' });
    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="space-y-4">
            <div><label className="label">Amount *</label><input type="number" step="0.01" className="input text-lg" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" autoFocus /></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => update('description', e.target.value)} placeholder={type === 'income' ? 'Payment from client...' : 'Coffee, supplies...'} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => update('date', e.target.value)} /></div>
                <div><label className="label">Method</label>
                    <select className="input" value={form.payment_method} onChange={e => update('payment_method', e.target.value)}>
                        <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="upi">UPI</option>
                    </select>
                </div>
            </div>
            <div><label className="label">Reference</label><input className="input" value={form.reference} onChange={e => update('reference', e.target.value)} placeholder="Receipt number..." /></div>
            <button onClick={() => onSubmit({ type, amount: Math.round((parseFloat(form.amount) || 0) * 100), currency: 'USD', date: form.date, description: form.description, payment_method: form.payment_method, reference: form.reference, account_id: 1 })} disabled={saving || !form.amount} className="btn-primary w-full">
                {saving ? 'Adding...' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
        </div>
    );
}
