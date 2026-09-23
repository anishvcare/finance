import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, LogOut, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';

/**
 * Shown after signup until the account redeems an activation code.
 * On success the backend also provisions the first workspace, so the user can
 * go straight to a working dashboard.
 */
export default function Activate() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Codes are XXXX-XXXX-XXXX. Insert the dashes as they type so what they see
    // matches what the admin panel shows.
    const handleChange = (raw: string) => {
        const bare = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
        const groups = bare.match(/.{1,4}/g) ?? [];
        setCode(groups.join('-'));
        setError(null);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setError(null);
        try {
            await api.post('/auth/activate', { code });
            await refreshUser();
            toast.success('Account activated.');
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const status = err?.response?.status;
            const fieldError = err?.response?.data?.errors?.code?.[0];

            if (status === 429) {
                setError('Too many attempts. Please wait a minute and try again.');
            } else {
                setError(fieldError || err?.response?.data?.message || 'Activation failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const complete = code.replace(/-/g, '').length === 12;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">Activate your account</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter the activation code you were given to finish setting up.
                    </p>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                            Activation code
                        </label>
                        <input
                            id="code"
                            value={code}
                            onChange={e => handleChange(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX"
                            autoComplete="off"
                            autoFocus
                            spellCheck={false}
                            className={`w-full rounded-lg border px-3 py-2.5 text-center font-mono text-lg tracking-widest uppercase focus:ring-1 ${
                                error
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={!complete || submitting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submitting ? 'Activating…' : 'Activate'}
                    </button>
                </form>

                <p className="mt-6 text-xs text-gray-500 text-center">
                    Don&apos;t have a code? Contact the administrator to request one.
                </p>

                <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">Signed in as {user?.email}</span>
                    <button onClick={logout} className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 flex-shrink-0">
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
