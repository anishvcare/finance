import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api, { downloadFile, viewFile } from '../../lib/api';
import toast from 'react-hot-toast';
import { formatMoney } from '../../lib/currencies';
import { Plus, Search, FileText, Send, Check, X as XIcon, ArrowRightLeft, Trash2, Download, Eye } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    converted: 'bg-purple-100 text-purple-700',
    expired: 'bg-amber-100 text-amber-700',
};

export default function Quotes() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['quotes', page, search, status],
        queryFn: async () => { const r = await api.get('/quotes', { params: { page, search, status: status || undefined, per_page: 20 } }); return r.data; },
    });

    const action = useMutation({
        mutationFn: async ({ id, verb }: { id: number; verb: string }) => api.post(`/quotes/${id}/${verb}`),
        onSuccess: (_res, vars) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success(vars.verb === 'convert' ? 'Converted to invoice.' : `Quote ${vars.verb === 'accept' ? 'accepted' : vars.verb === 'reject' ? 'rejected' : 'sent'}.`);
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Action failed.'),
    });

    const del = useMutation({
        mutationFn: async (id: number) => api.delete(`/quotes/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Quote deleted.'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Only draft quotes can be deleted.'),
    });

    return (
        <div className="space-y-6">
            <div className="page-header">
                <h1 className="page-title">Quotes</h1>
                <Link to="/quotes/create" className="btn-primary flex items-center space-x-1"><Plus className="w-4 h-4" /><span>New Quote</span></Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search quote #..." className="input pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="input max-w-[160px]" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All statuses</option>
                    {['draft', 'sent', 'accepted', 'rejected', 'converted'].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="bg-gray-50 border-b">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Quote #</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Total</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>) :
                            data?.data?.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">No quotes yet. <Link to="/quotes/create" className="text-blue-600 hover:underline">Create one</Link></p></td></tr> :
                            data?.data?.map((q: any) => (
                                <tr key={q.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3"><Link to={`/quotes/${q.id}`} className="font-medium text-blue-600 hover:underline">{q.quote_number}</Link></td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{q.customer?.business_name || q.customer?.name || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{q.quote_date}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">{formatMoney(q.total, q.currency)}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[q.status] || 'bg-gray-100 text-gray-600'}`}>{q.status}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button onClick={() => viewFile(`/quotes/${q.id}/pdf`).catch(() => toast.error('Failed to open PDF.'))} className="p-1.5 text-gray-400 hover:text-gray-700" title="View PDF"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => downloadFile(`/quotes/${q.id}/pdf`, `${q.quote_number}.pdf`).catch(() => toast.error('Failed to download PDF.'))} className="p-1.5 text-gray-400 hover:text-gray-700" title="Download PDF"><Download className="w-4 h-4" /></button>
                                            {q.status === 'draft' && <button onClick={() => action.mutate({ id: q.id, verb: 'send' })} className="p-1.5 text-gray-400 hover:text-blue-600" title="Send"><Send className="w-4 h-4" /></button>}
                                            {q.status === 'sent' && <button onClick={() => action.mutate({ id: q.id, verb: 'accept' })} className="p-1.5 text-gray-400 hover:text-green-600" title="Mark accepted"><Check className="w-4 h-4" /></button>}
                                            {q.status === 'sent' && <button onClick={() => action.mutate({ id: q.id, verb: 'reject' })} className="p-1.5 text-gray-400 hover:text-red-600" title="Mark rejected"><XIcon className="w-4 h-4" /></button>}
                                            {q.status === 'accepted' && <button onClick={() => action.mutate({ id: q.id, verb: 'convert' })} className="p-1.5 text-gray-400 hover:text-purple-600" title="Convert to invoice"><ArrowRightLeft className="w-4 h-4" /></button>}
                                            {q.status === 'draft' && <button onClick={() => { if (confirm(`Delete ${q.quote_number}?`)) del.mutate(q.id); }} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data && data.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">Page {data.current_page} of {data.last_page} ({data.total} total)</p>
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
