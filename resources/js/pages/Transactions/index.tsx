import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney, getDefaultCurrency } from '../../lib/currencies';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, X } from 'lucide-react';

export default function Transactions() {
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState<'income' | 'expense' | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // Auto-open the add modal when arriving from a Quick Action (?new=income|expense)
    useEffect(() => {
        const n = searchParams.get('new');
        if (n === 'income' || n === 'expense') {
            setShowForm(n);
            searchParams.delete('new');
            setSearchParams(searchParams, { replace: true });
        }
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ['transactions', page, typeFilter],
        queryFn: async () => { const r = await api.get('/transactions', { params: { page, per_page: 25, type: typeFilter || undefined } }); return r.data; },
    });

    const createMutation = useMutation({
        mutationFn: async (txn: any) => {
            let categoryId = txn.category_id || null;
            if (!categoryId && txn.new_category) {
                const cat = await api.post('/categories', { name: txn.new_category, type: txn.type });
                categoryId = cat.data.data.id;
            }
            const { new_category, ...payload } = txn;
            await api.post('/transactions', { ...payload, category_id: categoryId });
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }); toast.success('Transaction added.'); setShowForm(null); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add transaction.'),
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

            <div className="flex gap-2 flex-wrap">
                {['', 'income', 'expense', 'transfer'].map(t => (
                    <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                                    <p className="text-xs text-gray-500">{txn.date}{txn.category?.name ? ` · ${txn.category.name}` : ''}{txn.account?.name ? ` · ${txn.account.name}` : ''}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-semibold ${txn.type === 'income' ? 'text-green-600' : txn.type === 'expense' ? 'text-red-600' : 'text-gray-700'}`}>
                                {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}{formatMoney(txn.amount, txn.currency)}
                            </span>
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

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto">
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
    const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], payment_method: 'cash', reference: '', account_id: '', category_id: '', new_category: '' });
    const [addingCategory, setAddingCategory] = useState(false);
    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get('/accounts')).data });
    const { data: categories } = useQuery({ queryKey: ['categories', type], queryFn: async () => (await api.get('/categories', { params: { type } })).data });

    const defaultAccount = accounts?.data?.find((a: any) => a.is_default)?.id || accounts?.data?.[0]?.id || '';
    const accountId = form.account_id || defaultAccount;

    const submit = () => {
        onSubmit({
            type,
            amount: Math.round((parseFloat(form.amount) || 0) * 100),
            currency: getDefaultCurrency(),
            date: form.date,
            description: form.description,
            payment_method: form.payment_method,
            reference: form.reference,
            account_id: parseInt(accountId),
            category_id: form.category_id ? parseInt(form.category_id) : null,
            new_category: addingCategory ? form.new_category.trim() : '',
        });
    };

    return (
        <div className="space-y-4">
            <div><label className="label">Amount *</label><input type="number" step="0.01" className="input text-lg" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" autoFocus /></div>

            <div>
                <label className="label">Category</label>
                {!addingCategory ? (
                    <div className="flex space-x-2">
                        <select className="input" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
                            <option value="">Uncategorised</option>
                            {categories?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setAddingCategory(true)} className="btn-secondary whitespace-nowrap text-sm">+ New</button>
                    </div>
                ) : (
                    <div className="flex space-x-2">
                        <input className="input" value={form.new_category} onChange={e => update('new_category', e.target.value)} placeholder={`New ${type} category`} autoFocus />
                        <button type="button" onClick={() => { setAddingCategory(false); update('new_category', ''); }} className="btn-secondary text-sm">Cancel</button>
                    </div>
                )}
            </div>

            <div><label className="label">Account</label>
                <select className="input" value={accountId} onChange={e => update('account_id', e.target.value)}>
                    {accounts?.data?.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                </select>
            </div>

            <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => update('description', e.target.value)} placeholder={type === 'income' ? 'Payment from client…' : 'Rent, supplies…'} /></div>

            <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => update('date', e.target.value)} /></div>
                <div><label className="label">Method</label>
                    <select className="input" value={form.payment_method} onChange={e => update('payment_method', e.target.value)}>
                        <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="upi">UPI</option><option value="cheque">Cheque</option>
                    </select>
                </div>
            </div>
            <div><label className="label">Reference</label><input className="input" value={form.reference} onChange={e => update('reference', e.target.value)} placeholder="Receipt / reference number" /></div>

            <button onClick={submit} disabled={saving || !form.amount || !accountId} className="btn-primary w-full">
                {saving ? 'Adding…' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
        </div>
    );
}
