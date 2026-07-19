import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { BarChart3, TrendingUp, TrendingDown, FileText, Users, Clock } from 'lucide-react';

function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount / 100);
}

const reportTypes = [
    { id: 'sales', label: 'Sales', icon: TrendingUp, color: 'text-green-600' },
    { id: 'purchases', label: 'Purchases', icon: TrendingDown, color: 'text-red-600' },
    { id: 'invoice-ageing', label: 'Invoice Ageing', icon: Clock, color: 'text-amber-600' },
    { id: 'bill-ageing', label: 'Bill Ageing', icon: Clock, color: 'text-orange-600' },
    { id: 'cash-flow', label: 'Cash Flow', icon: BarChart3, color: 'text-blue-600' },
    { id: 'income-expense', label: 'Income vs Expense', icon: BarChart3, color: 'text-purple-600' },
    { id: 'profit-loss', label: 'Profit & Loss', icon: FileText, color: 'text-indigo-600' },
];

export default function Reports() {
    const { type: urlType } = useParams();
    const [activeReport, setActiveReport] = useState(urlType || '');
    const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading } = useQuery({
        queryKey: ['report', activeReport, fromDate, toDate],
        queryFn: async () => { const r = await api.get(`/reports/${activeReport}`, { params: { from_date: fromDate, to_date: toDate } }); return r.data; },
        enabled: !!activeReport,
    });

    if (!activeReport) {
        return (
            <div className="space-y-6">
                <h1 className="page-title">Reports</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTypes.map(rt => {
                        const Icon = rt.icon;
                        return (
                            <button key={rt.id} onClick={() => setActiveReport(rt.id)} className="card hover:shadow-md transition text-left">
                                <div className="flex items-center space-x-3">
                                    <Icon className={`w-8 h-8 ${rt.color}`} />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{rt.label}</h3>
                                        <p className="text-xs text-gray-500">View report</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setActiveReport('')} className="text-sm text-blue-600 hover:underline">All Reports</button>
                    <span className="text-gray-400">/</span>
                    <h1 className="text-xl font-bold">{reportTypes.find(r => r.id === activeReport)?.label}</h1>
                </div>
            </div>

            {/* Date Filters */}
            <div className="flex items-center space-x-4">
                <div><label className="label text-xs">From</label><input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
                <div><label className="label text-xs">To</label><input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>

            {/* Report Content */}
            {isLoading ? <div className="card h-64 animate-pulse bg-gray-50"></div> : (
                <div className="card">
                    {activeReport === 'sales' && data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><p className="text-sm text-gray-500">Total Sales</p><p className="text-2xl font-bold text-green-600">{formatMoney(data.summary?.total_sales || 0)}</p></div>
                                <div><p className="text-sm text-gray-500">Collected</p><p className="text-2xl font-bold">{formatMoney(data.summary?.total_collected || 0)}</p></div>
                                <div><p className="text-sm text-gray-500">Outstanding</p><p className="text-2xl font-bold text-amber-600">{formatMoney(data.summary?.total_outstanding || 0)}</p></div>
                                <div><p className="text-sm text-gray-500">Invoices</p><p className="text-2xl font-bold">{data.summary?.count || 0}</p></div>
                            </div>
                            {data.by_customer?.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Top Customers</h3>
                                    <table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Customer</th><th className="text-right py-2">Invoices</th><th className="text-right py-2">Total</th></tr></thead>
                                    <tbody>{data.by_customer.map((c: any) => <tr key={c.id} className="border-b"><td className="py-2">{c.name}</td><td className="py-2 text-right">{c.count}</td><td className="py-2 text-right font-medium">{formatMoney(c.total)}</td></tr>)}</tbody></table>
                                </div>
                            )}
                        </div>
                    )}
                    {activeReport === 'cash-flow' && data && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div><p className="text-sm text-gray-500">Income</p><p className="text-2xl font-bold text-green-600">{formatMoney(data.total_income || 0)}</p></div>
                                <div><p className="text-sm text-gray-500">Expenses</p><p className="text-2xl font-bold text-red-600">{formatMoney(data.total_expense || 0)}</p></div>
                                <div><p className="text-sm text-gray-500">Net Flow</p><p className={`text-2xl font-bold ${(data.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(data.net_flow || 0)}</p></div>
                            </div>
                        </div>
                    )}
                    {activeReport === 'profit-loss' && data && (
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Revenue</span><span className="font-medium text-green-600">{formatMoney(data.revenue || 0)}</span></div>
                            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Costs</span><span className="font-medium text-red-600">{formatMoney(data.costs || 0)}</span></div>
                            <div className="flex justify-between py-2 text-lg font-bold"><span>Gross Profit</span><span className={data.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(data.gross_profit || 0)}</span></div>
                            <p className="text-xs text-gray-400 italic">{data.note}</p>
                        </div>
                    )}
                    {activeReport === 'invoice-ageing' && data && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-2 text-center text-sm">
                                <div className="bg-green-50 p-3 rounded"><p className="text-xs text-gray-500">Current</p><p className="font-bold text-green-700">{formatMoney(data.buckets?.current || 0)}</p></div>
                                <div className="bg-yellow-50 p-3 rounded"><p className="text-xs text-gray-500">1-30 days</p><p className="font-bold text-yellow-700">{formatMoney(data.buckets?.['1_30'] || 0)}</p></div>
                                <div className="bg-orange-50 p-3 rounded"><p className="text-xs text-gray-500">31-60 days</p><p className="font-bold text-orange-700">{formatMoney(data.buckets?.['31_60'] || 0)}</p></div>
                                <div className="bg-red-50 p-3 rounded"><p className="text-xs text-gray-500">61-90 days</p><p className="font-bold text-red-700">{formatMoney(data.buckets?.['61_90'] || 0)}</p></div>
                                <div className="bg-red-100 p-3 rounded"><p className="text-xs text-gray-500">90+ days</p><p className="font-bold text-red-800">{formatMoney(data.buckets?.over_90 || 0)}</p></div>
                            </div>
                            <p className="font-semibold">Total Outstanding: {formatMoney(data.total_outstanding || 0)}</p>
                        </div>
                    )}
                    {!['sales', 'cash-flow', 'profit-loss', 'invoice-ageing'].includes(activeReport) && data && (
                        <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                    )}
                </div>
            )}
        </div>
    );
}
