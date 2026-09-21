import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Briefcase, User as UserIcon, TrendingUp, TrendingDown, Wallet,
    ArrowRightLeft, Layers, AlertTriangle, Plus, ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { formatMoney } from '../../lib/currencies';
import { useWorkspaceSwitch, WorkspaceType } from '../../lib/useWorkspaceSwitch';
import WorkspaceTransferModal from '../../components/WorkspaceTransferModal';

interface WsRow {
    id: number;
    name: string;
    type: WorkspaceType;
    currency: string;
    income: number;
    expense: number;
    net: number;
    sales: number;
    purchases: number;
    receivable: number;
    receivable_overdue: number;
    payable: number;
    payable_overdue: number;
    cash_balance: number;
    net_position: number;
}

interface Combined {
    income: number; expense: number; net: number;
    sales: number; purchases: number;
    receivable: number; receivable_overdue: number;
    payable: number; payable_overdue: number;
    cash_balance: number; net_position: number;
    currency: string | null; mixed_currencies: boolean;
}

interface OverviewData {
    period: { from: string; to: string };
    workspaces: WsRow[];
    combined: Combined;
}

const PERIODS = [
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'Last 3 Months' },
    { key: 'year', label: 'This Year' },
] as const;

function rangeFor(key: string): { from_date: string; to_date: string } {
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (key === 'year') return { from_date: iso(new Date(now.getFullYear(), 0, 1)), to_date: iso(now) };
    if (key === 'quarter') return { from_date: iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to_date: iso(now) };
    return { from_date: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to_date: iso(now) };
}

interface TransferRow {
    id: number;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
    direction_hint: 'in' | 'out' | null;
    from_workspace_name: string;
    to_workspace_name: string;
}

export default function Overview() {
    const [period, setPeriod] = useState<string>('month');
    const [showTransfer, setShowTransfer] = useState(false);
    const range = rangeFor(period);
    const { workspace, switchToId, busy } = useWorkspaceSwitch();

    const { data, isLoading } = useQuery<OverviewData>({
        queryKey: ['overview', range.from_date, range.to_date],
        queryFn: async () => (await api.get('/overview', { params: range })).data,
    });

    const { data: transfers } = useQuery<TransferRow[]>({
        queryKey: ['workspace-transfers'],
        queryFn: async () => (await api.get('/workspace-transfers')).data.data,
    });

    // Each transfer is stored as two legs; show only the outgoing side so the
    // movement appears once.
    const transferList = (transfers ?? []).filter(t => t.direction_hint !== 'in');

    const c = data?.combined;
    const rows = data?.workspaces ?? [];
    const cur = c?.currency ?? undefined;

    const tile = 'bg-white rounded-xl p-4 lg:p-6 border border-gray-100';

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-600" /> Combined Overview
                    </h1>
                    <p className="text-sm text-gray-500">Business and Personal rolled up together</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === p.key ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowTransfer(true)}
                        className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" /> Transfer
                    </button>
                </div>
            </div>

            {c?.mixed_currencies && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your workspaces use different currencies. Combined totals below are a raw sum and are not currency-converted.</span>
                </div>
            )}

            {/* Combined totals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className={tile}>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Income</span><TrendingUp className="w-5 h-5 text-green-500" /></div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(c?.income || 0, cur)}</p>
                </div>
                <div className={tile}>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Expense</span><TrendingDown className="w-5 h-5 text-red-500" /></div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(c?.expense || 0, cur)}</p>
                </div>
                <div className={tile}>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Net</span><ArrowRightLeft className="w-5 h-5 text-blue-500" /></div>
                    <p className={`mt-2 text-xl lg:text-2xl font-bold ${(c?.net || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatMoney(c?.net || 0, cur)}</p>
                </div>
                <div className={tile}>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-500">Cash on Hand</span><Wallet className="w-5 h-5 text-indigo-500" /></div>
                    <p className="mt-2 text-xl lg:text-2xl font-bold text-gray-900">{formatMoney(c?.cash_balance || 0, cur)}</p>
                </div>
            </div>

            {/* Net position */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Overall Net Position</p>
                        <p className="text-xs text-gray-400">Cash on hand + money owed to you − money you owe</p>
                    </div>
                    <p className={`text-2xl lg:text-3xl font-bold ${(c?.net_position || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatMoney(c?.net_position || 0, cur)}
                    </p>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-gray-500">Receivable</p>
                        <p className="font-semibold text-gray-900">{formatMoney(c?.receivable || 0, cur)}</p>
                        {(c?.receivable_overdue || 0) > 0 && <p className="text-xs text-red-600">{formatMoney(c!.receivable_overdue, cur)} overdue</p>}
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-gray-500">Payable</p>
                        <p className="font-semibold text-gray-900">{formatMoney(c?.payable || 0, cur)}</p>
                        {(c?.payable_overdue || 0) > 0 && <p className="text-xs text-red-600">{formatMoney(c!.payable_overdue, cur)} overdue</p>}
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-gray-500">Cash</p>
                        <p className="font-semibold text-gray-900">{formatMoney(c?.cash_balance || 0, cur)}</p>
                    </div>
                </div>
            </div>

            {/* Per-workspace breakdown */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">By Workspace</h2>
                {rows.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">No workspaces yet.</div>
                ) : (
                    <div className="grid gap-3 lg:gap-4 md:grid-cols-2">
                        {rows.map(ws => {
                            const active = ws.id === workspace?.id;
                            const Icon = ws.type === 'business' ? Briefcase : UserIcon;
                            return (
                                <div key={ws.id} className={`bg-white rounded-xl border p-4 lg:p-5 ${active ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-blue-600" /></span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{ws.name}</p>
                                                <p className="text-xs text-gray-400 capitalize">{ws.type}</p>
                                            </div>
                                        </div>
                                        {active ? (
                                            <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-1 flex-shrink-0">Current</span>
                                        ) : (
                                            <button
                                                onClick={() => switchToId(ws.id)}
                                                disabled={busy}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-60 flex-shrink-0"
                                            >
                                                Switch to
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                        <div><p className="text-gray-500 text-xs">Income</p><p className="font-semibold text-green-600">{formatMoney(ws.income, ws.currency)}</p></div>
                                        <div><p className="text-gray-500 text-xs">Expense</p><p className="font-semibold text-red-600">{formatMoney(ws.expense, ws.currency)}</p></div>
                                        <div><p className="text-gray-500 text-xs">Net</p><p className={`font-semibold ${ws.net < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatMoney(ws.net, ws.currency)}</p></div>
                                    </div>

                                    {ws.type === 'business' && (
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                                            <div><p className="text-gray-500 text-xs">Sales</p><p className="font-medium text-gray-900">{formatMoney(ws.sales, ws.currency)}</p></div>
                                            <div><p className="text-gray-500 text-xs">Purchases</p><p className="font-medium text-gray-900">{formatMoney(ws.purchases, ws.currency)}</p></div>
                                        </div>
                                    )}

                                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm border-t border-gray-100 pt-3">
                                        <div><p className="text-gray-500 text-xs">Cash</p><p className="font-medium text-gray-900">{formatMoney(ws.cash_balance, ws.currency)}</p></div>
                                        <div><p className="text-gray-500 text-xs">Receivable</p><p className="font-medium text-gray-900">{formatMoney(ws.receivable, ws.currency)}</p></div>
                                        <div><p className="text-gray-500 text-xs">Payable</p><p className="font-medium text-gray-900">{formatMoney(ws.payable, ws.currency)}</p></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Transfers between workspaces */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Transfers Between Workspaces</h2>
                    <button onClick={() => setShowTransfer(true)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        New transfer
                    </button>
                </div>
                {transferList.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                        <ArrowRightLeft className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No transfers between your workspaces yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Use this to record an owner&apos;s draw or a capital contribution.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                        {transferList.map(t => (
                            <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-900 font-medium">
                                        <span className="truncate">{t.from_workspace_name}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{t.to_workspace_name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {new Date(t.date).toLocaleDateString()}{t.description ? ` · ${t.description}` : ''}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatMoney(t.amount, t.currency)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-center">
                <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-800">View all transactions →</Link>
            </div>

            {showTransfer && <WorkspaceTransferModal onClose={() => setShowTransfer(false)} />}
        </div>
    );
}
