import React from 'react';
import { CURRENCIES } from '../lib/currencies';

interface Props {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function CurrencySelect({ value, onChange, label = 'Currency' }: Props) {
    return (
        <div>
            <label className="label">{label}</label>
            <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
                <option value="">Select currency...</option>
                {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
                ))}
            </select>
        </div>
    );
}
