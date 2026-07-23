import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatMoney } from '../../lib/currencies';
import WorkspaceToggle from '../../components/WorkspaceToggle';
import {
    TrendingUp, TrendingDown, Clock, AlertTriangle,
    Plus, Receipt, CreditCard, Camera, CheckSquare, UserPlus,
    ArrowDownRight, ArrowUpRight, FileText, Target
} from 'lucide-react';

const COLORS: Record<string, string> = {
    green: 'bg-green-50 hover:bg-green-100 text-green-700',
    red: 'bg-red-50 hover:bg-red-100 text-red-700',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
    rose: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
};

function QuickAction({ to, icon: Icon, label, color }: { to: string; icon: React.ElementType; label: string; color: string }) {
    return (
        <Link to={to} className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition ${COLORS[color]}`}>
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-medium leading-tight">{label}</span>
        </Link>
    );
}

function CategoryBreakdown({ title, total, rows, positive, to }: { title: string; total: number; rows: Array<{ name: string; color: string | null; total: number }>; positive?: boolean; to?: string }) {
    const max = Math.max(1, ...rows.map(r => r.total));
    return (
        <Link to={to || '/transactions'} className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
            <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <span className={`text-lg font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(total)}</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">From your recorded transactions (cashbook)</p>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-400">No records this month.</p>
            ) : (
                <div className="space-y-3">
                    {rows.slice(0, 6).map((r, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600 truncate">{r.name}</span>
                                <span className="font-medium text-gray-800">{formatMoney(r.total)}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${positive ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(r.total / max) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Link>
    );
}

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
    income_expense?: {
        income_total: number;
        expense_total: number;
        income_by_category: Array<{ name: string; color: string | null; total: number }>;
        expense_by_category: Array<{ name: string; color: string | null; total: number }>;
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <WorkspaceToggle />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Link to="/payments" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Received (Month)</span>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(biz?.payments_received_month || 0)}</p>
                    <p className="mt-1 text-[11px] text-gray-400">Payments received on invoices</p>
                </Link>

                <Link to="/payments" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Paid Out (Month)</span>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(biz?.payments_made_month || 0)}</p>
                    <p className="mt-1 text-[11px] text-gray-400">Payments made on bills</p>
                </Link>

                <Link to="/invoices" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Outstanding Invoices</span>
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(biz?.outstanding_invoices || 0)}</p>
                    {(biz?.overdue_invoice_count || 0) > 0 && (
                        <p className="mt-1 text-sm text-red-600">{biz?.overdue_invoice_count} overdue</p>
                    )}
                </Link>

                <Link to="/bills" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Outstanding Bills</span>
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(biz?.outstanding_bills || 0)}</p>
                    {(biz?.overdue_bill_count || 0) > 0 && (
                        <p className="mt-1 text-sm text-red-600">{biz?.overdue_bill_count} overdue</p>
                    )}
                </Link>
            </div>

            {/* Leads */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100">
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

            {/* Income & Expenses by category (this month) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryBreakdown to="/transactions?type=income" title="Income (This Month)" total={data?.income_expense?.income_total || 0} rows={data?.income_expense?.income_by_category || []} positive />
                <CategoryBreakdown to="/transactions?type=expense" title="Expenses (This Month)" total={data?.income_expense?.expense_total || 0} rows={data?.income_expense?.expense_by_category || []} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <QuickAction to="/transactions?new=income" icon={ArrowDownRight} label="Add Income" color="green" />
                    <QuickAction to="/transactions?new=expense" icon={ArrowUpRight} label="Add Expense" color="red" />
                    <QuickAction to="/leads?new=1" icon={UserPlus} label="New Lead" color="blue" />
                    <QuickAction to="/quotes/create" icon={FileText} label="New Quote" color="indigo" />
                    <QuickAction to="/bills?new=1" icon={CreditCard} label="New Bill" color="amber" />
                    <QuickAction to="/tasks?new=1" icon={CheckSquare} label="New Task" color="purple" />
                    <QuickAction to="/commitments?new=1" icon={Target} label="Commitment" color="rose" />
                </div>
            </div>

            {/* Tasks & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tasks Due */}
                <Link to="/tasks" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
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
                </Link>

                {/* Recent Transactions */}
                <Link to="/transactions" className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 block hover:shadow-sm hover:border-gray-200 transition">
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
                </Link>
            </div>
        </div>
    );
}
