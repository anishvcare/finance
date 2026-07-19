import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Building2, FileText, Palette, CreditCard, Bell, Users } from 'lucide-react';

const tabs = [
    { id: 'workspace', label: 'Organisation', icon: Building2 },
    { id: 'invoicing', label: 'Invoicing', icon: FileText },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'payment', label: 'Payment Info', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'team', label: 'Team', icon: Users },
];

function extractError(err: any, fallback: string): string {
    const res = err?.response?.data;
    if (res?.errors) {
        const first = Object.values(res.errors)[0];
        if (Array.isArray(first) && first[0]) return first[0] as string;
    }
    return res?.message || fallback;
}

export default function Settings() {
    const { section } = useParams();
    const [activeTab, setActiveTab] = useState(section || 'workspace');
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => { const r = await api.get('/settings'); return r.data.data; },
    });

    const mutation = useMutation({
        mutationFn: async (data: Record<string, any>) => {
            const r = await api.put('/settings', data);
            return r.data.data;
        },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved.'); },
        onError: (err: any) => { toast.error(extractError(err, 'Failed to save settings.')); },
    });

    const handleSave = (data: Record<string, any>) => mutation.mutate(data);

    if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="h-64 bg-gray-100 rounded"></div></div>;

    return (
        <div className="space-y-6">
            <h1 className="page-title">Settings</h1>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs */}
                <div className="lg:w-56 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <Icon className="w-4 h-4" /><span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'workspace' && <WorkspaceSettings settings={settings} onSave={handleSave} saving={mutation.isPending} />}
                    {activeTab === 'invoicing' && <InvoicingSettings settings={settings} onSave={handleSave} saving={mutation.isPending} />}
                    {activeTab === 'branding' && <BrandingSettings settings={settings} onSave={handleSave} saving={mutation.isPending} />}
                    {activeTab === 'payment' && <PaymentSettings settings={settings} onSave={handleSave} saving={mutation.isPending} />}
                    {activeTab === 'notifications' && <div className="card"><p className="text-gray-500">Notification preferences coming soon.</p></div>}
                    {activeTab === 'team' && <div className="card"><p className="text-gray-500">Team management coming soon.</p></div>}
                </div>
            </div>
        </div>
    );
}

function WorkspaceSettings({ settings, onSave, saving }: { settings: any; onSave: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({
        business_name: '', legal_name: '', trading_name: '', owner_name: '',
        email: '', mobile: '', website: '',
        address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: '',
        tax_number: '', gst_number: '', vat_number: '',
    });

    useEffect(() => {
        if (settings) {
            setForm({
                business_name: settings.business_name || '',
                legal_name: settings.legal_name || '',
                trading_name: settings.trading_name || '',
                owner_name: settings.owner_name || '',
                email: settings.email || '',
                mobile: settings.mobile || '',
                website: settings.website || '',
                address_line_1: settings.address_line_1 || '',
                address_line_2: settings.address_line_2 || '',
                city: settings.city || '',
                state: settings.state || '',
                postal_code: settings.postal_code || '',
                country: settings.country || '',
                tax_number: settings.tax_number || '',
                gst_number: settings.gst_number || '',
                vat_number: settings.vat_number || '',
            });
        }
    }, [settings]);

    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Organisation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Business Name</label><input className="input" value={form.business_name} onChange={e => update('business_name', e.target.value)} /></div>
                <div><label className="label">Legal Name</label><input className="input" value={form.legal_name} onChange={e => update('legal_name', e.target.value)} /></div>
                <div><label className="label">Trading Name</label><input className="input" value={form.trading_name} onChange={e => update('trading_name', e.target.value)} /></div>
                <div><label className="label">Owner Name</label><input className="input" value={form.owner_name} onChange={e => update('owner_name', e.target.value)} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => update('mobile', e.target.value)} /></div>
                <div><label className="label">Website</label><input className="input" value={form.website} onChange={e => update('website', e.target.value)} /></div>
            </div>
            <h3 className="text-md font-semibold text-gray-800 pt-2">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="label">Address Line 1</label><input className="input" value={form.address_line_1} onChange={e => update('address_line_1', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="label">Address Line 2</label><input className="input" value={form.address_line_2} onChange={e => update('address_line_2', e.target.value)} /></div>
                <div><label className="label">City</label><input className="input" value={form.city} onChange={e => update('city', e.target.value)} /></div>
                <div><label className="label">State</label><input className="input" value={form.state} onChange={e => update('state', e.target.value)} /></div>
                <div><label className="label">Postal Code</label><input className="input" value={form.postal_code} onChange={e => update('postal_code', e.target.value)} /></div>
                <div><label className="label">Country</label><input className="input" value={form.country} onChange={e => update('country', e.target.value)} /></div>
            </div>
            <h3 className="text-md font-semibold text-gray-800 pt-2">Tax Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="label">Tax Number</label><input className="input" value={form.tax_number} onChange={e => update('tax_number', e.target.value)} /></div>
                <div><label className="label">GST Number</label><input className="input" value={form.gst_number} onChange={e => update('gst_number', e.target.value)} /></div>
                <div><label className="label">VAT Number</label><input className="input" value={form.vat_number} onChange={e => update('vat_number', e.target.value)} /></div>
            </div>
            <div className="pt-4">
                <button onClick={() => onSave(form)} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
}

function InvoicingSettings({ settings, onSave, saving }: { settings: any; onSave: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({
        invoice_prefix: 'INV-', invoice_number_digits: 5, invoice_include_year: false,
        default_payment_terms: 30, invoice_template: 'clean',
        default_invoice_notes: '', default_terms: '', default_invoice_footer: '',
    });

    useEffect(() => {
        if (settings) {
            setForm({
                invoice_prefix: settings.invoice_prefix || 'INV-',
                invoice_number_digits: settings.invoice_number_digits || 5,
                invoice_include_year: settings.invoice_include_year || false,
                default_payment_terms: settings.default_payment_terms || 30,
                invoice_template: settings.invoice_template || 'clean',
                default_invoice_notes: settings.default_invoice_notes || '',
                default_terms: settings.default_terms || '',
                default_invoice_footer: settings.default_invoice_footer || '',
            });
        }
    }, [settings]);

    const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Invoice Prefix</label><input className="input" value={form.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)} placeholder="INV-" /></div>
                <div><label className="label">Number Digits</label><input className="input" type="number" min="3" max="10" value={form.invoice_number_digits} onChange={e => update('invoice_number_digits', parseInt(e.target.value))} /></div>
                <div><label className="label">Include Year in Number</label>
                    <select className="input" value={form.invoice_include_year ? 'yes' : 'no'} onChange={e => update('invoice_include_year', e.target.value === 'yes')}>
                        <option value="no">No (INV-00001)</option><option value="yes">Yes (INV-2026-00001)</option>
                    </select>
                </div>
                <div><label className="label">Default Payment Terms (days)</label><input className="input" type="number" min="0" value={form.default_payment_terms} onChange={e => update('default_payment_terms', parseInt(e.target.value))} /></div>
                <div><label className="label">Default Template</label>
                    <select className="input" value={form.invoice_template} onChange={e => update('invoice_template', e.target.value)}>
                        <option value="clean">Clean Professional</option><option value="modern">Modern</option><option value="compact">Compact</option>
                    </select>
                </div>
            </div>
            <div><label className="label">Default Invoice Notes</label><textarea className="input" rows={3} value={form.default_invoice_notes} onChange={e => update('default_invoice_notes', e.target.value)} placeholder="Notes shown on every invoice..." /></div>
            <div><label className="label">Default Terms & Conditions</label><textarea className="input" rows={3} value={form.default_terms} onChange={e => update('default_terms', e.target.value)} placeholder="Payment terms, warranty info..." /></div>
            <div><label className="label">Default Footer</label><textarea className="input" rows={2} value={form.default_invoice_footer} onChange={e => update('default_invoice_footer', e.target.value)} placeholder="Thank you for your business!" /></div>
            <div className="pt-4"><button onClick={() => onSave(form)} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}

function BrandingSettings({ settings, onSave, saving }: { settings: any; onSave: (d: any) => void; saving: boolean }) {
    const queryClient = useQueryClient();
    const [accentColor, setAccentColor] = useState('#2563EB');
    const [uploading, setUploading] = useState<string | null>(null);

    useEffect(() => {
        if (settings) setAccentColor(settings.accent_color || '#2563EB');
    }, [settings]);

    const uploadFile = async (field: 'logo' | 'signature' | 'stamp', file: File) => {
        const formData = new FormData();
        formData.append(field, file);
        setUploading(field);
        try {
            await api.post(`/settings/${field}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            await queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} uploaded.`);
        } catch (err: any) {
            toast.error(extractError(err, 'Upload failed.'));
        } finally {
            setUploading(null);
        }
    };

    const handleFile = (field: 'logo' | 'signature' | 'stamp') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(field, file);
    };

    return (
        <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Branding</h2>

            <div>
                <label className="label">Logo</label>
                <div className="flex items-center space-x-4">
                    {settings?.logo_path && <img src={`/storage/${settings.logo_path}`} className="h-16 w-auto rounded border" alt="Logo" />}
                    <input type="file" accept="image/*" onChange={handleFile('logo')} disabled={uploading === 'logo'} className="text-sm text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max 2MB. Recommended: PNG or SVG, 400x200px</p>
            </div>

            <div>
                <label className="label">Signature</label>
                <div className="flex items-center space-x-4">
                    {settings?.signature_path && <img src={`/storage/${settings.signature_path}`} className="h-14 w-auto rounded border" alt="Signature" />}
                    <input type="file" accept="image/*" onChange={handleFile('signature')} disabled={uploading === 'signature'} className="text-sm text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max 1MB. Shown on invoices and quotes.</p>
            </div>

            <div>
                <label className="label">Stamp</label>
                <div className="flex items-center space-x-4">
                    {settings?.stamp_path && <img src={`/storage/${settings.stamp_path}`} className="h-16 w-auto rounded border" alt="Stamp" />}
                    <input type="file" accept="image/*" onChange={handleFile('stamp')} disabled={uploading === 'stamp'} className="text-sm text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max 1MB. Company stamp/seal for documents.</p>
            </div>

            <div>
                <label className="label">Accent Color</label>
                <div className="flex items-center space-x-3">
                    <input type="color" value={accentColor} className="h-10 w-10 rounded border cursor-pointer" onChange={e => setAccentColor(e.target.value)} />
                    <input className="input w-32" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                </div>
            </div>

            <div className="pt-4 border-t">
                <button onClick={() => onSave({ accent_color: accentColor })} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
}

function PaymentSettings({ settings, onSave, saving }: { settings: any; onSave: (d: any) => void; saving: boolean }) {
    const [form, setForm] = useState({
        upi_id: '', bank_account_name: '', bank_name: '', bank_account_number: '',
        bank_swift: '', bank_iban: '', payment_instructions: '',
    });

    useEffect(() => {
        if (settings) {
            setForm({
                upi_id: settings.upi_id || '',
                bank_account_name: settings.bank_account_name || '',
                bank_name: settings.bank_name || '',
                bank_account_number: settings.bank_account_number || '',
                bank_swift: settings.bank_swift || '',
                bank_iban: settings.bank_iban || '',
                payment_instructions: settings.payment_instructions || '',
            });
        }
    }, [settings]);

    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
            <p className="text-sm text-gray-500">This appears on your invoices for customers to pay you.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">UPI ID</label><input className="input" value={form.upi_id} onChange={e => update('upi_id', e.target.value)} placeholder="yourname@upi" /></div>
                <div><label className="label">Bank Account Name</label><input className="input" value={form.bank_account_name} onChange={e => update('bank_account_name', e.target.value)} /></div>
                <div><label className="label">Bank Name</label><input className="input" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} /></div>
                <div><label className="label">Account Number</label><input className="input" value={form.bank_account_number} onChange={e => update('bank_account_number', e.target.value)} /></div>
                <div><label className="label">SWIFT/BIC</label><input className="input" value={form.bank_swift} onChange={e => update('bank_swift', e.target.value)} /></div>
                <div><label className="label">IBAN</label><input className="input" value={form.bank_iban} onChange={e => update('bank_iban', e.target.value)} /></div>
            </div>
            <div><label className="label">Payment Instructions</label><textarea className="input" rows={4} value={form.payment_instructions} onChange={e => update('payment_instructions', e.target.value)} placeholder="Bank transfer instructions, payment methods accepted..." /></div>
            <div className="pt-4"><button onClick={() => onSave(form)} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
    );
}
