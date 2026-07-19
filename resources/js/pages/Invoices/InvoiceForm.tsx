import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { CURRENCIES, getDefaultCurrency } from '../../lib/currencies';
import ItemPicker, { PickedItem } from '../../components/ItemPicker';

interface LineItem {
    id: string;
    type: 'product' | 'service' | 'custom';
    product_id?: number;
    service_id?: number;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number; // minor units
    discount_rate: number;
    tax_rate: number;
    tax_id?: number;
}

function generateId(): string { return Math.random().toString(36).substr(2, 9); }

function formatMoney(cents: number): string {
    return (cents / 100).toFixed(2);
}

function calculateLineTotal(item: LineItem): { discount: number; tax: number; total: number } {
    const lineAmount = Math.round(item.quantity * item.unit_price);
    const discount = Math.round(lineAmount * (item.discount_rate / 100));
    const afterDiscount = lineAmount - discount;
    const tax = Math.round(afterDiscount * (item.tax_rate / 100));
    const total = afterDiscount + tax;
    return { discount, tax, total };
}

export default function InvoiceForm() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        customer_id: searchParams.get('customer_id') || '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        currency: getDefaultCurrency(),
        payment_terms: 30,
        reference_number: '',
        notes: '',
        terms: '',
        payment_instructions: '',
        internal_notes: '',
    });

    const [items, setItems] = useState<LineItem[]>([]);

    const addPickedItem = (it: PickedItem) => setItems(prev => [...prev, {
        id: generateId(), type: it.type, product_id: it.product_id, service_id: it.service_id,
        name: it.name, description: it.description, unit: it.unit || 'each',
        quantity: 1, unit_price: it.unit_price, discount_rate: 0, tax_rate: it.tax_rate, tax_id: it.tax_id,
    }]);

    // Load customers for dropdown
    const { data: customersData } = useQuery({
        queryKey: ['customers-list'],
        queryFn: async () => { const r = await api.get('/customers', { params: { per_page: 100, is_active: true } }); return r.data.data; },
    });

    // Load products for quick add
    const { data: productsData } = useQuery({
        queryKey: ['products-list'],
        queryFn: async () => { const r = await api.get('/products', { params: { per_page: 100, is_active: true } }); return r.data.data; },
    });

    // Load existing invoice for edit
    const { data: existingInvoice } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => { const r = await api.get(`/invoices/${id}`); return r.data.data; },
        enabled: isEdit,
    });

    useEffect(() => {
        if (existingInvoice) {
            setForm({
                customer_id: existingInvoice.customer_id?.toString() || '',
                invoice_date: existingInvoice.invoice_date,
                due_date: existingInvoice.due_date,
                currency: existingInvoice.currency,
                payment_terms: existingInvoice.payment_terms,
                reference_number: existingInvoice.reference_number || '',
                notes: existingInvoice.notes || '',
                terms: existingInvoice.terms || '',
                payment_instructions: existingInvoice.payment_instructions || '',
                internal_notes: existingInvoice.internal_notes || '',
            });
            setItems(existingInvoice.items.map((item: any) => ({
                id: generateId(), type: item.type, product_id: item.product_id, service_id: item.service_id,
                name: item.name, description: item.description || '', unit: item.unit,
                quantity: parseFloat(item.quantity), unit_price: item.unit_price,
                discount_rate: parseFloat(item.discount_rate), tax_rate: parseFloat(item.tax_rate), tax_id: item.tax_id,
            })));
        }
    }, [existingInvoice]);

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (isEdit) { return (await api.put(`/invoices/${id}`, data)).data; }
            return (await api.post('/invoices', data)).data;
        },
        onSuccess: (data) => { toast.success(isEdit ? 'Invoice updated.' : 'Invoice created.'); navigate(`/invoices/${data.data.id}`); },
        onError: (err: any) => { toast.error(err.response?.data?.message || 'Failed to save.'); },
    });

    const addItem = () => {
        setItems(prev => [...prev, { id: generateId(), type: 'custom', name: '', description: '', unit: 'each', quantity: 1, unit_price: 0, discount_rate: 0, tax_rate: 0 }]);
    };

    const addProductItem = (product: any) => {
        setItems(prev => [...prev, {
            id: generateId(), type: 'product', product_id: product.id,
            name: product.name, description: product.description || '', unit: product.unit || 'each',
            quantity: 1, unit_price: product.sales_price, discount_rate: 0,
            tax_rate: product.tax?.rate || 0, tax_id: product.tax_id,
        }]);
    };

    const updateItem = (itemId: string, field: string, value: any) => {
        setItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const removeItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Calculate totals (preview only - server recalculates)
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item).total, 0);
    const totalTax = items.reduce((sum, item) => sum + calculateLineTotal(item).tax, 0);

    const handleSave = () => {
        if (!form.customer_id) { toast.error('Please select a customer.'); return; }
        if (items.length === 0 || !items.some(i => i.name)) { toast.error('Add at least one item.'); return; }

        saveMutation.mutate({
            ...form,
            customer_id: parseInt(form.customer_id),
            items: items.filter(i => i.name).map(item => ({
                type: item.type, product_id: item.product_id, service_id: item.service_id,
                name: item.name, description: item.description, unit: item.unit,
                quantity: item.quantity, unit_price: item.unit_price,
                discount_rate: item.discount_rate, tax_rate: item.tax_rate, tax_id: item.tax_id,
            })),
        });
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center space-x-3">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="page-title">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
            </div>

            {/* Header fields */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label">Customer *</label>
                        <select className="input" value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}>
                            <option value="">Select customer...</option>
                            {customersData?.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.business_name ? ` (${c.business_name})` : ''}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Invoice Date</label><input type="date" className="input" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} /></div>
                    <div><label className="label">Due Date</label><input type="date" className="input" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
                    <div><label className="label">Currency</label>
                        <select className="input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Reference</label><input className="input" value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} placeholder="PO number, ref..." /></div>
                    <div><label className="label">Payment Terms</label><input type="number" className="input" value={form.payment_terms} onChange={e => setForm(p => ({ ...p, payment_terms: parseInt(e.target.value) || 0 }))} /></div>
                </div>
            </div>

            {/* Line Items */}
            <div className="card">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-800">Line Items</h2>
                    <button onClick={addItem} className="btn-secondary text-xs flex items-center space-x-1"><Plus className="w-3 h-3" /><span>Blank row</span></button>
                </div>

                <div className="mb-4"><ItemPicker onSelect={addPickedItem} /></div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b text-xs text-gray-500 uppercase">
                            <th className="text-left py-2 w-1/3">Item</th>
                            <th className="text-right py-2 w-16">Qty</th>
                            <th className="text-left py-2 w-16">Unit</th>
                            <th className="text-right py-2 w-24">Price</th>
                            <th className="text-right py-2 w-16">Disc%</th>
                            <th className="text-right py-2 w-16">Tax%</th>
                            <th className="text-right py-2 w-24">Total</th>
                            <th className="w-8"></th>
                        </tr></thead>
                        <tbody>
                            {items.length === 0 && (
                                <tr><td colSpan={8} className="py-6 text-center text-sm text-gray-400">No items yet — search above to add a product/service, or add a blank row.</td></tr>
                            )}
                            {items.map(item => {
                                const calc = calculateLineTotal(item);
                                return (
                                    <tr key={item.id} className="border-b last:border-0">
                                        <td className="py-2 pr-2">
                                            <input className="input text-sm" placeholder="Item name" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                                            <input className="input text-xs mt-1" placeholder="Description (optional)" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                                        </td>
                                        <td className="py-2 px-1"><input type="number" step="0.01" min="0" className="input text-sm text-right" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="py-2 px-1"><input className="input text-xs" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} /></td>
                                        <td className="py-2 px-1"><input type="number" step="1" min="0" className="input text-sm text-right" value={item.unit_price / 100} onChange={e => updateItem(item.id, 'unit_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></td>
                                        <td className="py-2 px-1"><input type="number" step="0.5" min="0" max="100" className="input text-sm text-right" value={item.discount_rate} onChange={e => updateItem(item.id, 'discount_rate', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="py-2 px-1"><input type="number" step="0.5" min="0" max="100" className="input text-sm text-right" value={item.tax_rate} onChange={e => updateItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="py-2 px-1 text-right font-medium">{formatMoney(calc.total)}</td>
                                        <td className="py-2"><button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                    <div className="w-64 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatMoney(subtotal - totalTax)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatMoney(totalTax)}</span></div>
                        <div className="flex justify-between pt-2 border-t text-base font-bold"><span>Total</span><span>{form.currency} {formatMoney(subtotal)}</span></div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Customer Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Visible to customer..." /></div>
                    <div><label className="label">Internal Notes</label><textarea className="input" rows={3} value={form.internal_notes} onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} placeholder="For your reference only..." /></div>
                    <div><label className="label">Terms & Conditions</label><textarea className="input" rows={2} value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))} /></div>
                    <div><label className="label">Payment Instructions</label><textarea className="input" rows={2} value={form.payment_instructions} onChange={e => setForm(p => ({ ...p, payment_instructions: e.target.value }))} /></div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                <div className="flex space-x-3">
                    <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary">
                        {saveMutation.isPending ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Save as Draft')}
                    </button>
                </div>
            </div>
        </div>
    );
}
