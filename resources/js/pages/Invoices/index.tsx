import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatMoney } from '../../lib/currencies';
import { Plus, Search, Filter, Download, Mail, Eye } from 'lucide-react';

interface Invoice {
    id: number;
    invoice_number: string;
    status: string;
    invoice_date: string;
    due_date: string;
    total: number;
    balance_due: number;
    currency: string;
    customer: { id: number; name: string; business_name?: string } | null;
}

interface PaginatedResponse {
    data: Invoice[];
    current_page: number;
    last_page: number;
    total: number;
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    finalised: 'bg-blue-100 text-blue-700',
    sent: 'bg-indigo-100 text-indigo-700',
    viewed: 'bg-purple-100 text-purple-700',
    partially_paid: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    void: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-gray-100 text-gray-500',
};

export default function Invoices() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { data, isLoading } = useQuery<PaginatedResponse>({
        queryKey: ['invoices', page, search, statusFilter],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/invoices', { params });
            return res.data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Invoices</h1>
                <Link to="/invoices/create" className="btn-primary flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>New Invoice</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        className="input pl-9"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select
                    className="input w-auto"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="finalised">Finalised</option>
                    <option value="sent">Sent</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="void">Void</option>
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Invoice #</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Due Date</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Total</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Balance</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        No invoices found. <Link to="/invoices/create" className="text-blue-600 hover:underline">Create your first invoice</Link>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link to={`/invoices/${invoice.id}`} className="font-medium text-blue-600 hover:underline">
                                                {invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {invoice.customer?.business_name || invoice.customer?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{invoice.invoice_date}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{invoice.due_date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {invoice.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">{formatMoney(invoice.total, invoice.currency)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            {invoice.balance_due > 0 ? (
                                                <span className="text-red-600">{formatMoney(invoice.balance_due, invoice.currency)}</span>
                                            ) : (
                                                <span className="text-green-600">Paid</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Link to={`/invoices/${invoice.id}`} className="p-1 text-gray-400 hover:text-blue-600" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing page {data.current_page} of {data.last_page} ({data.total} total)
                        </p>
                        <div className="flex space-x-2">
                            <button
                                className="btn-secondary text-xs"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >Previous</button>
                            <button
                                className="btn-secondary text-xs"
                                disabled={page >= data.last_page}
                                onClick={() => setPage(p => p + 1)}
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
