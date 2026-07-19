import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface LineItem {
    id: string; type: 'product' | 'service' | 'custom'; name: string; description: string;
    unit: string; quantity: number; unit_price: number; discount_rate: number; tax_rate: number;
    product_id?: number; service_id?: number;
}

function genId(): string { return Math.random().toString(36).substr(2, 9); }
function calcLine(item: LineItem) {
    const amt = Math.round(item.quantity * item.unit_price);
    const disc = Math.round(amt * (item.discount_rate / 100));
    const after = amt - disc;
    const tax = Math.round(after * (item.tax_rate / 100));
    return { discount: disc, tax, total: after + tax };
}

export default function QuoteForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({ customer_id: '', quote_date: new Date().toISOString().split('T')[0], expiry_date: '', currency: 'USD', notes: '', terms: '', customer_message: '' });
    const [items, setItems] = useState<LineItem[]>([{ id: genId(), type: 'custom', name: '', description: '', unit: 'each', quantity: 1, unit_price: 0, discount_rate: 0, tax_rate: 0 }]);

    const { data: customers } = useQuery({ queryKey: ['customers-list'], queryFn: async () => (await api.get('/customers', { params: { per_page: 100 } })).data.data });

    const { data: existing } = useQuery({ queryKey: ['quote', id], queryFn: async () => (await api.get(`/quotes/${id}`)).data.data, enabled: isEdit });

    useEffect(() => {
        if (existing) {
            setForm({ customer_id: existing.customer_id?.toString(), quote_date: existing.quote_date, expiry_date: existing.expiry_date || '', currency: existing.currency, notes: existing.notes || '', terms: existing.terms || '', customer_message: existing.customer_message || '' });
            setItems(existing.items.map((i: any) => ({ id: genId(), type: i.type, name: i.name, description: i.description || '', unit: i.unit, quantity: parseFloat(i.quantity), unit_price: i.unit_price, discount_rate: parseFloat(i.discount_rate), tax_rate: parseFloat(i.tax_rate) })));
        }
    }, [existing]);

    const mutation = useMutation({
        mutationFn: async (data: any) => { if (isEdit) return (await api.put(`/quotes/${id}`, data)).data; return (await api.post('/quotes', data)).data; },
        onSuccess: () => { toast.success(isEdit ? 'Quote updated.' : 'Quote created.'); navigate('/quotes'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    const handleSave = () => {
        if (!form.customer_id) { toast.error('Select a customer.'); return; }
        mutation.mutate({ ...form, customer_id: parseInt(form.customer_id), items: items.filter(i => i.name).map(({ id, ...rest }) => rest) });
    };

    const subtotal = items.reduce((s, i) => s + calcLine(i).total, 0);

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center space-x-3">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="page-title">{isEdit ? 'Edit Quote' : 'New Quote'}</h1>
            </div>

            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="label">Customer *</label><select className="input" value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}><option value="">Select...</option>{customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div><label className="label">Quote Date</label><input type="date" className="input" value={form.quote_date} onChange={e => setForm(p => ({ ...p, quote_date: e.target.value }))} /></div>
                    <div><label className="label">Expiry Date</label><input type="date" className="input" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
                </div>
            </div>

            <div className="card">
                <div className="flex justify-between mb-4">
                    <h2 className="font-semibold">Line Items</h2>
                    <button onClick={() => setItems(p => [...p, { id: genId(), type: 'custom', name: '', description: '', unit: 'each', quantity: 1, unit_price: 0, discount_rate: 0, tax_rate: 0 }])} className="btn-secondary text-xs"><Plus className="w-3 h-3 inline mr-1" />Add Item</button>
                </div>
                <table className="w-full text-sm">
                    <thead><tr className="border-b text-xs text-gray-500"><th className="text-left py-2">Item</th><th className="text-right py-2 w-16">Qty</th><th className="text-right py-2 w-24">Price</th><th className="text-right py-2 w-16">Disc%</th><th className="text-right py-2 w-16">Tax%</th><th className="text-right py-2 w-24">Total</th><th className="w-8"></th></tr></thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="py-2 pr-2"><input className="input text-sm" value={item.name} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} placeholder="Item name" /></td>
                                <td className="py-2 px-1"><input type="number" step="0.01" className="input text-sm text-right" value={item.quantity} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, quantity: parseFloat(e.target.value) || 0 } : i))} /></td>
                                <td className="py-2 px-1"><input type="number" step="0.01" className="input text-sm text-right" value={item.unit_price / 100} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, unit_price: Math.round((parseFloat(e.target.value) || 0) * 100) } : i))} /></td>
                                <td className="py-2 px-1"><input type="number" step="0.5" className="input text-sm text-right" value={item.discount_rate} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, discount_rate: parseFloat(e.target.value) || 0 } : i))} /></td>
                                <td className="py-2 px-1"><input type="number" step="0.5" className="input text-sm text-right" value={item.tax_rate} onChange={e => setItems(p => p.map(i => i.id === item.id ? { ...i, tax_rate: parseFloat(e.target.value) || 0 } : i))} /></td>
                                <td className="py-2 text-right font-medium">{(calcLine(item).total / 100).toFixed(2)}</td>
                                <td className="py-2"><button onClick={() => setItems(p => p.filter(i => i.id !== item.id))} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-end mt-4"><div className="w-48 text-sm"><div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{form.currency} {(subtotal / 100).toFixed(2)}</span></div></div></div>
            </div>

            <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Customer Message</label><textarea className="input" rows={2} value={form.customer_message} onChange={e => setForm(p => ({ ...p, customer_message: e.target.value }))} /></div>
                <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>

            <div className="flex justify-between">
                <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving...' : (isEdit ? 'Update Quote' : 'Create Quote')}</button>
            </div>
        </div>
    );
}
