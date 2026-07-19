import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { ArrowLeft, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react';

function formatMoney(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount / 100);
}

export default function CustomerDetail() {
    const { id } = useParams();

    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => { const r = await api.get(`/customers/${id}`); return r.data.data; },
    });

    const { data: statement } = useQuery({
        queryKey: ['customer-statement', id],
        queryFn: async () => { const r = await api.get(`/customers/${id}/statement`); return r.data; },
        enabled: !!id,
    });

    if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4"></div><div className="h-64 bg-gray-100 rounded"></div></div>;
    if (!customer) return <div>Customer not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Link to="/customers" className="p-2 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                    {customer.business_name && <p className="text-sm text-gray-500">{customer.business_name}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="card space-y-4">
                    <h2 className="font-semibold text-gray-800">Contact Info</h2>
                    {customer.email && <div className="flex items-center space-x-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{customer.email}</span></div>}
                    {customer.phone && <div className="flex items-center space-x-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{customer.phone}</span></div>}
                    {customer.billing_address_line_1 && (
                        <div className="flex items-start space-x-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <p>{customer.billing_address_line_1}</p>
                                {customer.billing_city && <p>{customer.billing_city}, {customer.billing_state} {customer.billing_postal_code}</p>}
                            </div>
                        </div>
                    )}
                    <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="capitalize">{customer.type}</span></div>
                        <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Payment Terms</span><span>{customer.payment_terms || 30} days</span></div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="card space-y-4">
                    <h2 className="font-semibold text-gray-800">Financial Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-gray-500">Outstanding</span><span className="font-semibold text-red-600">{formatMoney(statement?.outstanding_balance || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-500">Total Invoices</span><span className="font-medium">{statement?.invoices?.length || 0}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-gray-500">Total Payments</span><span className="font-medium">{statement?.payments?.length || 0}</span></div>
                    </div>
                    <div className="pt-2 flex space-x-2">
                        <Link to={`/invoices/create?customer_id=${id}`} className="btn-primary text-xs flex items-center space-x-1"><FileText className="w-3 h-3" /><span>New Invoice</span></Link>
                        <Link to={`/quotes/create?customer_id=${id}`} className="btn-secondary text-xs flex items-center space-x-1"><CreditCard className="w-3 h-3" /><span>New Quote</span></Link>
                    </div>
                </div>

                {/* Notes */}
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-2">Notes</h2>
                    <p className="text-sm text-gray-600">{customer.notes || 'No notes.'}</p>
                </div>
            </div>

            {/* Recent Invoices */}
            {statement?.invoices?.length > 0 && (
                <div className="card">
                    <h2 className="font-semibold text-gray-800 mb-4">Invoices</h2>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left py-2">Number</th><th className="text-left py-2">Date</th><th className="text-left py-2">Status</th><th className="text-right py-2">Total</th><th className="text-right py-2">Balance</th></tr></thead>
                        <tbody>
                            {statement.invoices.map((inv: any) => (
                                <tr key={inv.id} className="border-b last:border-0">
                                    <td className="py-2"><Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.invoice_number}</Link></td>
                                    <td className="py-2">{inv.invoice_date}</td>
                                    <td className="py-2 capitalize">{inv.status.replace('_', ' ')}</td>
                                    <td className="py-2 text-right">{formatMoney(inv.total)}</td>
                                    <td className="py-2 text-right font-medium">{inv.balance_due > 0 ? <span className="text-red-600">{formatMoney(inv.balance_due)}</span> : <span className="text-green-600">Paid</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
