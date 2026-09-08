import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatMoney } from '../lib/currencies';
import { Search, Package, Briefcase, PlusCircle } from 'lucide-react';

export interface PickedItem {
    type: 'product' | 'service' | 'custom';
    product_id?: number;
    service_id?: number;
    name: string;
    description: string;
    unit: string;
    unit_price: number;   // minor units (cents)
    tax_rate: number;
    tax_id?: number;
}

interface Props {
    onSelect: (item: PickedItem) => void;
    placeholder?: string;
}

/**
 * Searchable dropdown to add an existing Product or Service as a line item,
 * or create a brand-new custom item on the fly.
 */
export default function ItemPicker({ onSelect, placeholder = 'Search products or services to add…' }: Props) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const { data: products } = useQuery({
        queryKey: ['picker-products'],
        queryFn: async () => (await api.get('/products', { params: { per_page: 100, is_active: true } })).data.data,
    });
    const { data: services } = useQuery({
        queryKey: ['picker-services'],
        queryFn: async () => (await api.get('/services', { params: { per_page: 100 } })).data.data,
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const matches = useMemo(() => {
        const term = query.trim().toLowerCase();
        const match = (name: string, code?: string | null) => !term || name.toLowerCase().includes(term) || (code || '').toLowerCase().includes(term);

        const prod = (products || []).filter((p: any) => match(p.name, p.code)).map((p: any) => ({
            kind: 'product' as const, id: p.id, name: p.name, code: p.code,
            price: p.sales_price, unit: p.unit || 'each', tax_rate: p.tax?.rate || 0, tax_id: p.tax_id, description: p.description || '',
        }));
        const serv = (services || []).filter((s: any) => match(s.name, s.code)).map((s: any) => ({
            kind: 'service' as const, id: s.id, name: s.name, code: s.code,
            price: s.fixed_price || s.hourly_rate || 0, unit: s.unit || 'each', tax_rate: s.tax?.rate || 0, tax_id: s.tax_id, description: s.description || '',
        }));
        return [...prod, ...serv].slice(0, 40);
    }, [products, services, query]);

    const pick = (m: any) => {
        onSelect({
            type: m.kind,
            product_id: m.kind === 'product' ? m.id : undefined,
            service_id: m.kind === 'service' ? m.id : undefined,
            name: m.name, description: m.description, unit: m.unit,
            unit_price: m.price, tax_rate: m.tax_rate, tax_id: m.tax_id,
        });
        setQuery(''); setOpen(false);
    };

    const addCustom = () => {
        onSelect({ type: 'custom', name: query.trim(), description: '', unit: 'each', unit_price: 0, tax_rate: 0 });
        setQuery(''); setOpen(false);
    };

    return (
        <div className="relative" ref={wrapRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    className="input pl-9"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                />
            </div>
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    {matches.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No matching products or services.</div>
                    )}
                    {matches.map((m: any) => (
                        <button
                            key={`${m.kind}-${m.id}`}
                            type="button"
                            onClick={() => pick(m)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                {m.kind === 'product'
                                    ? <Package className="w-4 h-4 text-blue-500 shrink-0" />
                                    : <Briefcase className="w-4 h-4 text-purple-500 shrink-0" />}
                                <span className="text-sm text-gray-800 truncate">{m.name}</span>
                                {m.code && <span className="text-xs text-gray-400 shrink-0">{m.code}</span>}
                            </span>
                            <span className="text-sm text-gray-500 shrink-0 ml-2">{formatMoney(m.price)}</span>
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={addCustom}
                        className="w-full flex items-center gap-2 px-3 py-2 border-t border-gray-100 hover:bg-gray-50 text-left text-blue-600"
                    >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span className="text-sm">Add {query.trim() ? `"${query.trim()}"` : 'a custom item'} as a new line</span>
                    </button>
                </div>
            )}
        </div>
    );
}
