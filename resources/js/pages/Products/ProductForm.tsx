import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [form, setForm] = useState({
        name: '', code: '', sku: '', barcode: '', description: '', category_id: '',
        unit: 'each', sales_price: 0, purchase_price: 0, cost_price: 0, wholesale_price: 0,
        tax_id: '', tax_inclusive: false, currency: 'USD', track_inventory: false,
        opening_stock: 0, low_stock_level: 0, supplier_id: '', notes: '',
    });

    const { data: existing } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => { const r = await api.get(`/products/${id}`); return r.data.data; },
        enabled: isEdit,
    });

    const { data: taxes } = useQuery({
        queryKey: ['taxes'],
        queryFn: async () => { try { const r = await api.get('/taxes'); return r.data.data || []; } catch { return []; } },
    });

    useEffect(() => {
        if (existing) {
            setForm({
                name: existing.name || '', code: existing.code || '', sku: existing.sku || '',
                barcode: existing.barcode || '', description: existing.description || '',
                category_id: existing.category_id?.toString() || '', unit: existing.unit || 'each',
                sales_price: existing.sales_price || 0, purchase_price: existing.purchase_price || 0,
                cost_price: existing.cost_price || 0, wholesale_price: existing.wholesale_price || 0,
                tax_id: existing.tax_id?.toString() || '', tax_inclusive: existing.tax_inclusive || false,
                currency: existing.currency || 'USD', track_inventory: existing.track_inventory || false,
                opening_stock: existing.opening_stock || 0, low_stock_level: existing.low_stock_level || 0,
                supplier_id: existing.supplier_id?.toString() || '', notes: existing.notes || '',
            });
        }
    }, [existing]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (isEdit) return (await api.put(`/products/${id}`, data)).data;
            return (await api.post('/products', data)).data;
        },
        onSuccess: () => { toast.success(isEdit ? 'Product updated.' : 'Product created.'); navigate('/products'); },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save.'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) { toast.error('Product name is required.'); return; }
        mutation.mutate({
            ...form,
            sales_price: form.sales_price,
            purchase_price: form.purchase_price || undefined,
            cost_price: form.cost_price || undefined,
            wholesale_price: form.wholesale_price || undefined,
            category_id: form.category_id ? parseInt(form.category_id) : undefined,
            tax_id: form.tax_id ? parseInt(form.tax_id) : undefined,
            supplier_id: form.supplier_id ? parseInt(form.supplier_id) : undefined,
        });
    };

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center space-x-3">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card space-y-4">
                    <h2 className="font-semibold text-gray-800">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className="label">Product Name *</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
                        <div><label className="label">Product Code</label><input className="input" value={form.code} onChange={e => update('code', e.target.value)} /></div>
                        <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={e => update('sku', e.target.value)} /></div>
                        <div><label className="label">Barcode</label><input className="input" value={form.barcode} onChange={e => update('barcode', e.target.value)} /></div>
                        <div><label className="label">Unit</label>
                            <select className="input" value={form.unit} onChange={e => update('unit', e.target.value)}>
                                <option value="each">Each</option><option value="piece">Piece</option><option value="box">Box</option>
                                <option value="pack">Pack</option><option value="kg">Kilogram</option><option value="g">Gram</option>
                                <option value="litre">Litre</option><option value="ml">Millilitre</option><option value="metre">Metre</option>
                                <option value="hour">Hour</option><option value="day">Day</option>
                            </select>
                        </div>
                    </div>
                    <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => update('description', e.target.value)} /></div>
                </div>

                <div className="card space-y-4">
                    <h2 className="font-semibold text-gray-800">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Sales Price *</label><input type="number" step="0.01" className="input" value={form.sales_price / 100} onChange={e => update('sales_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Purchase Price</label><input type="number" step="0.01" className="input" value={(form.purchase_price || 0) / 100} onChange={e => update('purchase_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Cost Price</label><input type="number" step="0.01" className="input" value={(form.cost_price || 0) / 100} onChange={e => update('cost_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Wholesale Price</label><input type="number" step="0.01" className="input" value={(form.wholesale_price || 0) / 100} onChange={e => update('wholesale_price', Math.round((parseFloat(e.target.value) || 0) * 100))} /></div>
                        <div><label className="label">Tax</label>
                            <select className="input" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}>
                                <option value="">No Tax</option>
                                {taxes?.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                            </select>
                        </div>
                        <div><label className="label">Tax Type</label>
                            <select className="input" value={form.tax_inclusive ? 'inclusive' : 'exclusive'} onChange={e => update('tax_inclusive', e.target.value === 'inclusive')}>
                                <option value="exclusive">Tax Exclusive</option><option value="inclusive">Tax Inclusive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card space-y-4">
                    <h2 className="font-semibold text-gray-800">Inventory</h2>
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" checked={form.track_inventory} onChange={e => update('track_inventory', e.target.checked)} className="rounded border-gray-300" />
                        <label className="text-sm text-gray-700">Track inventory for this product</label>
                    </div>
                    {form.track_inventory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label">Opening Stock</label><input type="number" step="0.01" className="input" value={form.opening_stock} onChange={e => update('opening_stock', parseFloat(e.target.value) || 0)} /></div>
                            <div><label className="label">Low Stock Alert Level</label><input type="number" step="0.01" className="input" value={form.low_stock_level} onChange={e => update('low_stock_level', parseFloat(e.target.value) || 0)} /></div>
                        </div>
                    )}
                </div>

                <div className="card"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>

                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}</button>
                </div>
            </form>
        </div>
    );
}
