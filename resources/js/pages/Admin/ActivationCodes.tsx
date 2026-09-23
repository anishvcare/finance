import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    KeyRound, Plus, Copy, Check, Trash2, Loader2, ShieldCheck,
} from 'lucide-react';
import api from '../../lib/api';

interface CodeRow {
    id: number;
    code: string;
    note: string | null;
    used_at: string | null;
    created_at: string;
    creator: { id: number; name: string } | null;
    user: { id: number; name: string; email: string } | null;
}

interface CodesResponse {
    data: CodeRow[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
    counts: { total: number; used: number; unused: number };
}

type Tab = 'unused' | 'used' | 'all';

const TABS: { key: Tab; label: string }[] = [
    { key: 'unused', label: 'Unused' },
    { key: 'used', label: 'Used' },
    { key: 'all', label: 'All' },
];

export default function ActivationCodes() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>('unused');
    const [quantity, setQuantity] = useState('5');
    const [note, setNote] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const { data, isLoading } = useQuery<CodesResponse>({
        queryKey: ['admin-activation-codes', tab],
        queryFn: async () => (await api.get('/admin/activation-codes', { params: { status: tab } })).data,
    });

    const generate = useMutation({
        mutationFn: async () =>
            api.post('/admin/activation-codes', {
                quantity: Number(quantity),
                note: note || undefined,
            }),
        onSuccess: (res: any) => {
            toast.success(res.data.message ?? 'Codes generated.');
            setNote('');
            setTab('unused');
            queryClient.invalidateQueries({ queryKey: ['admin-activation-codes'] });
        },
        onError: (err: any) => {
            const first = err?.response?.data?.errors?.quantity?.[0];
            toast.error(first || err?.response?.data?.message || 'Could not generate codes.');
        },
    });

    const remove = useMutation({
        mutationFn: async (id: number) => api.delete(`/admin/activation-codes/${id}`),
        onSuccess: () => {
            toast.success('Code deleted.');
            queryClient.invalidateQueries({ queryKey: ['admin-activation-codes'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not delete code.'),
    });

    const copy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(code);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            toast.error('Could not copy to clipboard.');
        }
    };

    const copyAllUnused = async () => {
        const codes = (data?.data ?? []).filter(c => !c.used_at).map(c => c.code);
        if (codes.length === 0) return;
        try {
            await navigator.clipboard.writeText(codes.join('\n'));
            toast.success(`${codes.length} code(s) copied.`);
        } catch {
            toast.error('Could not copy to clipboard.');
        }
    };

    const counts = data?.counts;
    const rows = data?.data ?? [];
    const qtyValid = Number(quantity) >= 1 && Number(quantity) <= 500;

    const tile = 'bg-white rounded-xl border border-gray-100 p-4';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <KeyRound className="w-6 h-6 text-blue-600" /> Activation Codes
                </h1>
                <p className="text-sm text-gray-500">
                    Generate codes for new users. Each code activates exactly one account.
                </p>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3">
                <div className={tile}>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{counts?.total ?? '—'}</p>
                </div>
                <div className={tile}>
                    <p className="text-sm text-gray-500">Unused</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">{counts?.unused ?? '—'}</p>
                </div>
                <div className={tile}>
                    <p className="text-sm text-gray-500">Used</p>
                    <p className="mt-1 text-2xl font-bold text-gray-400">{counts?.used ?? '—'}</p>
                </div>
            </div>

            {/* Generate */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 lg:p-5">
                <h2 className="text-sm font-semibold text-gray-900">Generate new codes</h2>
                <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="sm:w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">How many</label>
                        <input
                            type="number" min="1" max="500" value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Note <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                            value={note} onChange={e => setNote(e.target.value)}
                            placeholder="e.g. October resellers"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => generate.mutate()}
                        disabled={!qtyValid || generate.isPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Generate
                    </button>
                </div>
                {!qtyValid && <p className="mt-2 text-xs text-red-600">Enter a number between 1 and 500.</p>}
            </div>

            {/* Tabs + list */}
            <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {t.label}
                                {t.key === 'unused' && counts ? ` (${counts.unused})` : ''}
                                {t.key === 'used' && counts ? ` (${counts.used})` : ''}
                            </button>
                        ))}
                    </div>
                    {tab !== 'used' && rows.some(r => !r.used_at) && (
                        <button onClick={copyAllUnused} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            Copy all unused
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <KeyRound className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                            {tab === 'used' ? 'No codes have been used yet.' : 'No codes yet. Generate some above.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Code</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Used by</th>
                                        <th className="px-4 py-3">Note</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map(row => (
                                        <tr key={row.id} className={row.used_at ? 'text-gray-500' : ''}>
                                            <td className="px-4 py-3 font-mono tracking-wide text-gray-900">{row.code}</td>
                                            <td className="px-4 py-3">
                                                {row.used_at ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                        <ShieldCheck className="w-3 h-3" /> Used
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                                        Available
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.user ? (
                                                    <span className="truncate">
                                                        <span className="block text-gray-900">{row.user.name}</span>
                                                        <span className="block text-xs text-gray-400">{row.user.email}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{row.note || <span className="text-gray-300">—</span>}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => copy(row.code)}
                                                        title="Copy code"
                                                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                    >
                                                        {copied === row.code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    {!row.used_at && (
                                                        <button
                                                            onClick={() => remove.mutate(row.id)}
                                                            disabled={remove.isPending}
                                                            title="Delete code"
                                                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {data?.meta && data.meta.last_page > 1 && (
                    <p className="mt-3 text-xs text-gray-400 text-center">
                        Showing page {data.meta.current_page} of {data.meta.last_page} ({data.meta.total} total)
                    </p>
                )}
            </div>

            <p className="text-xs text-gray-400">
                Used codes are kept as a record of which account each one activated, so they cannot be deleted.
            </p>
        </div>
    );
}
