import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { downloadFile, viewFile } from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Mail, Share2, CreditCard, Edit, CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatMoney } from '../../lib/currencies';

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', finalised: 'bg-blue-100 text-blue-700', sent: 'bg-indigo-100 text-indigo-700',
    partially_paid: 'bg-amber-100 text-amber-700', paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700', void: 'bg-gray-200 text-gray-500',
};

export default function InvoiceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPayment, setShowPayment] = useState(false);

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: async () => { const r = await api.get(`/invoices/${id}`); return r.data.data; },
    });

    const finaliseMutation = useMutation({
        mutationFn: async () => { const r = await api.post(`/invoices/${id}/finalise`); return r.data; },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', id] }); toast.success('Invoice finalised.'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    const sendMutation = useMutation({
        mutationFn: async () => { const r = await api.post(`/invoices/${id}/send`); return r.data; },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', id] }); toast.success('Invoice sent.'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    const voidMutation = useMutation({
        mutationFn: async () => { const r = await api.post(`/invoices/${id}/void`); return r.data; },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoice', id] }); toast.success('Invoice voided.'); },
    });

    if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div><div className="h-96 bg-gray-100 rounded"></div></div>;
    if (!invoice) return <div>Invoice not found.</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/invoices')} className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[invoice.status] || 'bg-gray-100'}`}>
                            {invoice.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {invoice.status === 'draft' && (
                        <>
                            <Link to={`/invoices/${id}/edit`} className="btn-secondary flex items-center space-x-1 text-sm"><Edit className="w-4 h-4" /><span>Edit</span></Link>
                            <button onClick={() => finaliseMutation.mutate()} disabled={finaliseMutation.isPending} className="btn-primary flex items-center space-x-1 text-sm"><CheckCircle className="w-4 h-4" /><span>Finalise</span></button>
                        </>
                    )}
                    {['finalised', 'sent', 'viewed', 'partially_paid', 'overdue'].includes(invoice.status) && (
                        <>
                            <button onClick={() => sendMutation.mutate()} className="btn-secondary flex items-center space-x-1 text-sm"><Mail className="w-4 h-4" /><span>Send</span></button>
                            <button onClick={() => setShowPayment(true)} className="btn-primary flex items-center space-x-1 text-sm"><CreditCard className="w-4 h-4" /><span>Record Payment</span></button>
                        </>
                    )}
                    <button onClick={() => viewFile(`/invoices/${id}/pdf`)} className="btn-secondary flex items-center space-x-1 text-sm"><Eye className="w-4 h-4" /><span>View</span></button>
                    <button onClick={() => downloadFile(`/invoices/${id}/pdf`, `${invoice.invoice_number}.pdf`)} className="btn-secondary flex items-center space-x-1 text-sm"><Download className="w-4 h-4" /><span>PDF</span></button>
                </div>
            </div>

            {/* Invoice Preview */}
            <div className="card">
                <div className="flex justify-between mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-800">Bill To</h3>
                        <p className="text-sm text-gray-600">{invoice.customer?.business_name || invoice.customer?.name}</p>
                        {invoice.customer?.email && <p className="text-xs text-gray-500">{invoice.customer.email}</p>}
                    </div>
                    <div className="text-right text-sm">
                        <p><span className="text-gray-500">Date:</span> {invoice.invoice_date}</p>
                        <p><span className="text-gray-500">Due:</span> {invoice.due_date}</p>
                        {invoice.reference_number && <p><span className="text-gray-500">Ref:</span> {invoice.reference_number}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-sm mb-6">
                    <thead><tr className="border-b text-xs text-gray-500 uppercase">
                        <th className="text-left py-2">#</th><th className="text-left py-2">Item</th><th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Price</th><th className="text-right py-2">Tax</th><th className="text-right py-2">Total</th>
                    </tr></thead>
                    <tbody>
                        {invoice.items?.map((item: any, i: number) => (
                            <tr key={item.id} className="border-b">
                                <td className="py-2">{i + 1}</td>
                                <td className="py-2"><span className="font-medium">{item.name}</span>{item.description && <p className="text-xs text-gray-500">{item.description}</p>}</td>
                                <td className="py-2 text-right">{parseFloat(item.quantity)} {item.unit}</td>
                                <td className="py-2 text-right">{formatMoney(item.unit_price, invoice.currency)}</td>
                                <td className="py-2 text-right">{parseFloat(item.tax_rate) > 0 ? `${item.tax_rate}%` : '-'}</td>
                                <td className="py-2 text-right font-medium">{formatMoney(item.line_total, invoice.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(invoice.subtotal, invoice.currency)}</span></div>
                        {invoice.discount_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatMoney(invoice.discount_amount, invoice.currency)}</span></div>}
                        {invoice.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatMoney(invoice.tax_amount, invoice.currency)}</span></div>}
                        {invoice.shipping_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatMoney(invoice.shipping_amount, invoice.currency)}</span></div>}
                        <div className="flex justify-between pt-2 border-t font-bold text-base"><span>Total</span><span>{formatMoney(invoice.total, invoice.currency)}</span></div>
                        {invoice.amount_paid > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>-{formatMoney(invoice.amount_paid, invoice.currency)}</span></div>}
                        {invoice.balance_due > 0 && <div className="flex justify-between font-bold text-red-600 text-base"><span>Balance Due</span><span>{formatMoney(invoice.balance_due, invoice.currency)}</span></div>}
                    </div>
                </div>

                {invoice.notes && <div className="mt-6 pt-4 border-t"><h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4><p className="text-sm text-gray-600">{invoice.notes}</p></div>}
            </div>

            {/* Payment Recording Modal */}
            {showPayment && <PaymentModal invoiceId={invoice.id} balanceDue={invoice.balance_due} currency={invoice.currency} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); queryClient.invalidateQueries({ queryKey: ['invoice', id] }); }} />}
        </div>
    );
}

function PaymentModal({ invoiceId, balanceDue, currency, onClose, onSuccess }: { invoiceId: number; balanceDue: number; currency: string; onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ amount: balanceDue, payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', account_id: '', reference_number: '', notes: '' });

    const { data: accounts } = useQuery({
        queryKey: ['accounts-list'],
        queryFn: async () => { const r = await api.get('/transactions', { params: { per_page: 1 } }); return []; }, // Simplified
    });

    const mutation = useMutation({
        mutationFn: async () => { await api.post(`/invoices/${invoiceId}/record-payment`, { ...form, amount: form.amount, account_id: parseInt(form.account_id) || 1 }); },
        onSuccess: () => { toast.success('Payment recorded.'); onSuccess(); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Failed.'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Record Payment</h2>
                <div className="space-y-4">
                    <div><label className="label">Amount ({currency})</label><input type="number" step="0.01" className="input" value={form.amount / 100} onChange={e => setForm(p => ({ ...p, amount: Math.round((parseFloat(e.target.value) || 0) * 100) }))} /></div>
                    <div><label className="label">Date</label><input type="date" className="input" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} /></div>
                    <div><label className="label">Method</label>
                        <select className="input" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                            <option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="card">Card</option>
                            <option value="upi">UPI</option><option value="cheque">Cheque</option><option value="other">Other</option>
                        </select>
                    </div>
                    <div><label className="label">Reference</label><input className="input" value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} placeholder="Transaction ID, cheque number..." /></div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Recording...' : 'Record Payment'}</button>
                </div>
            </div>
        </div>
    );
}
