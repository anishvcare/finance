import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Building2, User, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        workspace_type: 'business' as 'personal' | 'business',
        workspace_name: '',
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        business_name: '',
        email: '',
        phone: '',
        country: '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Create workspace
            const wsRes = await api.post('/workspaces', {
                name: formData.workspace_name || formData.business_name || 'My Workspace',
                type: formData.workspace_type,
                currency: formData.currency,
                timezone: formData.timezone,
            });

            // Update settings
            if (formData.business_name || formData.email) {
                await api.put('/settings', {
                    business_name: formData.business_name,
                    email: formData.email,
                    phone: formData.phone,
                    country: formData.country,
                });
            }

            // Mark onboarding complete
            await api.put('/auth/user', { onboarding_completed: true });
            await refreshUser();

            toast.success('Workspace created successfully!');
            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Setup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
                {/* Progress */}
                <div className="flex items-center justify-center space-x-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? 'bg-blue-600 w-12' : 'bg-gray-200 w-8'}`} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome! Let's get started</h2>
                            <p className="mt-2 text-gray-600">What type of workspace would you like to create?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleChange('workspace_type', 'personal')}
                                className={`p-6 rounded-xl border-2 text-center transition ${formData.workspace_type === 'personal' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <User className={`w-8 h-8 mx-auto mb-2 ${formData.workspace_type === 'personal' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="font-medium text-sm">Personal</span>
                                <p className="text-xs text-gray-500 mt-1">Track personal finances & tasks</p>
                            </button>
                            <button
                                onClick={() => handleChange('workspace_type', 'business')}
                                className={`p-6 rounded-xl border-2 text-center transition ${formData.workspace_type === 'business' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <Building2 className={`w-8 h-8 mx-auto mb-2 ${formData.workspace_type === 'business' ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="font-medium text-sm">Business</span>
                                <p className="text-xs text-gray-500 mt-1">Invoicing, products & customers</p>
                            </button>
                        </div>
                        <button onClick={() => setStep(2)} className="btn-primary w-full flex items-center justify-center space-x-2">
                            <span>Continue</span><ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                            <p className="mt-2 text-gray-600">This will appear on your invoices and documents.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="label">{formData.workspace_type === 'business' ? 'Business Name' : 'Display Name'}</label>
                                <input className="input" placeholder="Your name or business name" value={formData.business_name} onChange={e => handleChange('business_name', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Workspace Name</label>
                                <input className="input" placeholder="e.g. My Business, Personal" value={formData.workspace_name} onChange={e => handleChange('workspace_name', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input className="input" type="email" placeholder="contact@example.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Phone</label>
                                <input className="input" placeholder="+1 234 567 890" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                            <button onClick={() => setStep(3)} className="btn-primary flex-1 flex items-center justify-center space-x-2">
                                <span>Continue</span><ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
                            <p className="mt-2 text-gray-600">Set your default currency and timezone.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Currency</label>
                                <select className="input" value={formData.currency} onChange={e => handleChange('currency', e.target.value)}>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="INR">INR - Indian Rupee</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="SGD">SGD - Singapore Dollar</option>
                                    <option value="JPY">JPY - Japanese Yen</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Timezone</label>
                                <input className="input" value={formData.timezone} onChange={e => handleChange('timezone', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Country</label>
                                <input className="input" placeholder="Your country" value={formData.country} onChange={e => handleChange('country', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center space-x-2">
                                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <><Check className="w-4 h-4" /><span>Complete Setup</span></>}
                            </button>
                        </div>
                        <button onClick={() => { navigate('/dashboard'); }} className="w-full text-sm text-gray-500 hover:text-gray-700">
                            Skip for now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
