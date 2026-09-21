import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, ArrowRight, Briefcase, User as UserIcon } from 'lucide-react';
import api from '../lib/api';
import { formatMoney } from '../lib/currencies';

interface AccountOption {
    id: number;
    workspace_id: number;
    name: string;
    type: string;
    currency: string;
    current_balance: number;
}

interface WorkspaceGroup {
    id: number;
    name: string;
    type: 'business' | 'personal';
    accounts: AccountOption[];
}

export default function WorkspaceTransferModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();

    const { data: groups, isLoading } = useQuery<WorkspaceGroup[]>({
        queryKey: ['workspace-transfer-accounts'],
        queryFn: async () => (await api.get('/workspace-transfers/accounts')).data.data,
    });

    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [toAccountId, setToAccountId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState('');

    const allAccounts = useMemo(
        () => (groups ?? []).flatMap(g => g.accounts.map(a => ({ ...a, workspaceName: g.name, workspaceType: g.type }))),
        [groups]
    );

    const from = allAccounts.find(a => String(a.id) === fromAccountId);
    const to = allAccounts.find(a => String(a.id) === toAccountId);

    // Destination must be in a DIFFERENT workspace — that's the point of this transfer.
    const destinationOptions = useMemo(
        () => (from ? allAccounts.filter(a => a.workspace_id !== from.workspace_id) : []),
        [allAccounts, from]
    );

    const currencyMismatch = !!from && !!to && from.currency !== to.currency;
    const amountMinor = Math.round((parseFloat(amount) || 0) * 100);
    const canSubmit = !!from && !!to && amountMinor > 0 && !currencyMismatch && !!date;

    const mutation = useMutation({
        mutationFn: async () => {
            return api.post('/workspace-transfers', {
                from_workspace_id: from!.workspace_id,
                to_workspace_id: to!.workspace_id,
                from_account_id: from!.id,
                to_account_id: to!.id,
                amount: amountMinor,
                date,
                description: description || undefined,
            });
        },
        onSuccess: () => {
            toast.success('Transfer recorded in both workspaces.');
            queryClient.invalidateQueries({ queryKey: ['overview'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-transfers'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-transfer-accounts'] });
            onClose();
        },
        onError: (err: any) => {
            const errors = err?.response?.data?.errors;
            const first = errors ? (Object.values(errors)[0] as string[])?.[0] : null;
            toast.error(first || err?.response?.data?.message || 'Transfer failed.');
        },
    });

    const groupLabel = (g: WorkspaceGroup) => `${g.name} (${g.type})`;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Transfer Between Workspaces</h2>
                        <p className="text-xs text-gray-500">e.g. an owner&apos;s draw from Business to Personal</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                {isLoading ? (
                    <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <select
                                value={fromAccountId}
                                onChange={e => { setFromAccountId(e.target.value); setToAccountId(''); }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select source account…</option>
                                {(groups ?? []).map(g => (
                                    <optgroup key={g.id} label={groupLabel(g)}>
                                        {g.accounts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} — {formatMoney(a.current_balance, a.currency)}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        {/* Direction indicator */}
                        {from && (
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                    {from.workspaceType === 'business' ? <Briefcase className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                                    {from.workspaceName}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="inline-flex items-center gap-1">
                                    {to ? (
                                        <>
                                            {to.workspaceType === 'business' ? <Briefcase className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                                            {to.workspaceName}
                                        </>
                                    ) : '…'}
                                </span>
                            </div>
                        )}

                        {/* To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <select
                                value={toAccountId}
                                onChange={e => setToAccountId(e.target.value)}
                                disabled={!from}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">{from ? 'Select destination account…' : 'Choose a source account first'}</option>
                                {destinationOptions.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.workspaceName} · {a.name} — {formatMoney(a.current_balance, a.currency)}
                                    </option>
                                ))}
                            </select>
                            {from && destinationOptions.length === 0 && (
                                <p className="mt-1 text-xs text-amber-600">
                                    No accounts in another workspace yet. Create an account in your other workspace first.
                                </p>
                            )}
                        </div>

                        {currencyMismatch && (
                            <p className="text-xs text-red-600">
                                Both accounts must use the same currency ({from!.currency} vs {to!.currency}). No conversion is applied.
                            </p>
                        )}

                        {/* Amount + date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number" min="0" step="0.01" value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date" value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input
                                type="text" value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Owner's draw"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            This records a matching pair of entries — one in each workspace — so the movement is traceable from both
                            ledgers. It is logged as a transfer, so it will not count as income or an expense.
                        </p>

                        <div className="flex gap-2 pt-1">
                            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                onClick={() => mutation.mutate()}
                                disabled={!canSubmit || mutation.isPending}
                                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {mutation.isPending ? 'Transferring…' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
