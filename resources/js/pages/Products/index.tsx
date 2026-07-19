import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Package, Pencil, Copy, Archive, RotateCcw } from 'lucide-react';
import { formatMoney } from '../../lib/currencies';

interface Product {
    id: number;
    name: string;
    code: string | null;
    sales_price: number;
    unit: string;
    currency: string;
    is_active: boolean;
    current_stock: number;
    track_inventory: boolean;
    low_stock_level: number | null;
    category: { id: number; name: string } | null;
    tax: { id: number; name: string; rate: number } | null;
}

export default function Products() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [includeArchived, setIncludeArchived] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['products', page, search, includeArchived],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) params.search = search;
            if (includeArchived) params.include_archived = 1;
            const res = await api.get('/products', { params });
            return res.data;
        },
    });

    const archiveMutation = useMutation({
        mutationFn: async (id: number) => api.delete(`/products/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Product archived.'); },
        onError: () => toast.error('Failed to archive product.'),
    });

    const restoreMutation = useMutation({
        mutationFn: async (id: number) => api.post(`/products/${id}/restore`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Product restored.'); },
        onError: () => toast.error('Failed to restore product.'),
    });

    const duplicateMutation = useMutation({
        mutationFn: async (id: number) => api.post(`/products/${id}/duplicate`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Product duplicated.'); },
        onError: () => toast.error('Failed to duplicate product.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Products</h1>
                <Link to="/products/create" className="btn-primary flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="input pl-9"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input type="checkbox" checked={includeArchived} onChange={e => { setIncludeArchived(e.target.checked); setPage(1); }} className="rounded border-gray-300" />
                    <span>Show archived</span>
                </label>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Product</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Category</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Price</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Unit</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Tax</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Stock</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No products yet. <Link to="/products/create" className="text-blue-600 hover:underline">Add your first product</Link></p>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((product: Product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link to={`/products/${product.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600">
                                                {product.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.code || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">{formatMoney(product.sales_price, product.currency)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{product.tax ? `${product.tax.name} (${product.tax.rate}%)` : '-'}</td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {product.track_inventory ? (
                                                <span className={product.low_stock_level && product.current_stock <= product.low_stock_level ? 'text-red-600 font-medium' : ''}>
                                                    {product.current_stock}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {product.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Link to={`/products/${product.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="w-4 h-4" /></Link>
                                                <button onClick={() => duplicateMutation.mutate(product.id)} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                                {product.is_active ? (
                                                    <button onClick={() => { if (confirm(`Archive "${product.name}"?`)) archiveMutation.mutate(product.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Archive"><Archive className="w-4 h-4" /></button>
                                                ) : (
                                                    <button onClick={() => restoreMutation.mutate(product.id)} className="p-1.5 text-gray-400 hover:text-green-600" title="Restore"><RotateCcw className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

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
        </div>
    );
}
