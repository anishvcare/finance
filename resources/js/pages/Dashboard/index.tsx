import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatMoney } from '../../lib/currencies';
import {
    TrendingUp, TrendingDown, Clock, AlertTriangle,
    Plus, Receipt, CreditCard, Camera, CheckSquare, UserPlus
} from 'lucide-react';

interface DashboardData {
    business: {
        total_sales: number;
        total_expenses: number;
        net_cash_flow: number;
        outstanding_invoices: number;
        overdue_invoices: number;
        overdue_invoice_count: number;
        outstanding_bills: number;
        overdue_bill_count: number;
        payments_received_month: number;
        payments_made_month: number;
    };
    tasks: {
        due_today: number;
        overdue: number;
        commitments_due_soon: number;
    };
    leads?: {
        open: number;
        urgent: number;
        follow_up_today: number;
        follow_up_overdue: number;
    };
    recent_transactions: Array<{
        id: number;
        type: string;
        amount: number;
        currency: string;
        date: string;
        description: string;
        category: { name: string; color: string } | null;
        account: { name: string } | null;
    }>;
}

export default function Dashboard() {
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await api.get('/dashboard');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded w-32"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const biz = data?.business;
    const tasks = data?.tasks;
    const leads = data?.leads;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Revenue (Month)</span>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(biz?.payments_received_month || 0)}</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Expenses (Month)</span>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(biz?.payments_made_month || 0)}</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Outstanding Invoices</span>
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(biz?.outstanding_invoices || 0)}</p>
                    {(biz?.overdue_invoice_count || 0) > 0 && (
                        <p className="mt-1 text-sm text-red-600">{biz?.overdue_invoice_count} overdue</p>
                    )}
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Outstanding Bills</span>
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{formatMoney(biz?.outstanding_bills || 0)}</p>
                    {(biz?.overdue_bill_count || 0) > 0 && (
                        <p className="mt-1 text-sm text-red-600">{biz?.overdue_bill_count} overdue</p>
                    )}
                </div>
            </div>

            {/* Leads */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center"><UserPlus className="w-5 h-5 text-blue-600 mr-2" />Leads</h2>
                    <Link to="/leads" className="text-sm text-blue-600 hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link to="/leads" className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                        <p className="text-2xl font-bold text-gray-900">{leads?.open || 0}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Open Leads</p>
                    </Link>
                    <Link to="/leads" className="rounded-lg border border-rose-100 bg-rose-50 p-4 hover:bg-rose-100">
                        <p className="text-2xl font-bold text-rose-700">{leads?.urgent || 0}</p>
                        <p className="text-xs text-rose-600 uppercase tracking-wide">Urgent</p>
                    </Link>
                    <Link to="/leads" className="rounded-lg border border-amber-100 bg-amber-50 p-4 hover:bg-amber-100">
                        <p className="text-2xl font-bold text-amber-700">{leads?.follow_up_today || 0}</p>
                        <p className="text-xs text-amber-600 uppercase tracking-wide">Follow-up Today</p>
                    </Link>
                    <Link to="/leads" className="rounded-lg border border-red-100 bg-red-50 p-4 hover:bg-red-100">
                        <p className="text-2xl font-bold text-red-700">{leads?.follow_up_overdue || 0}</p>
                        <p className="text-xs text-red-600 uppercase tracking-wide">Overdue</p>
                    </Link>
                </div>
            </div>

            {/* Quick Actions & Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link to="/invoices/create" className="flex flex-col items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                            <Receipt className="w-5 h-5 text-blue-600 mb-1" />
                            <span className="text-xs font-medium text-blue-700">New Invoice</span>
                        </Link>
                        <Link to="/transactions" className="flex flex-col items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition">
                            <Plus className="w-5 h-5 text-green-600 mb-1" />
                            <span className="text-xs font-medium text-green-700">Add Income</span>
                        </Link>
                        <Link to="/bills" className="flex flex-col items-center p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition">
                            <CreditCard className="w-5 h-5 text-amber-600 mb-1" />
                            <span className="text-xs font-medium text-amber-700">New Bill</span>
                        </Link>
                        <Link to="/tasks" className="flex flex-col items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition">
                            <CheckSquare className="w-5 h-5 text-purple-600 mb-1" />
                            <span className="text-xs font-medium text-purple-700">New Task</span>
                        </Link>
                    </div>
                </div>

                {/* Tasks Due */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks & Commitments</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Due Today</span>
                            <span className="text-sm font-bold text-gray-900">{tasks?.due_today || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Overdue Tasks</span>
                            <span className={`text-sm font-bold ${(tasks?.overdue || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {tasks?.overdue || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Commitments Due Soon</span>
                            <span className="text-sm font-bold text-gray-900">{tasks?.commitments_due_soon || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
                    <div className="space-y-3">
                        {data?.recent_transactions?.slice(0, 5).map((txn) => (
                            <div key={txn.id} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate">{txn.description || txn.category?.name || txn.type}</p>
                                    <p className="text-xs text-gray-500">{txn.date}</p>
                                </div>
                                <span className={`text-sm font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {txn.type === 'income' ? '+' : '-'}{formatMoney(txn.amount, txn.currency)}
                                </span>
                            </div>
                        )) || <p className="text-sm text-gray-500">No recent transactions</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
