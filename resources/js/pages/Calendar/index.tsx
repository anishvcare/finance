import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { ChevronLeft, ChevronRight, FileText, Receipt, Handshake } from 'lucide-react';

interface CalEvent {
    date: string;
    label: string;
    kind: 'invoice' | 'bill' | 'commitment';
    to?: string;
}

const KIND_META = {
    invoice: { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', Icon: FileText },
    bill: { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', Icon: Receipt },
    commitment: { color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50', Icon: Handshake },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ymd(d: Date): string { return d.toISOString().split('T')[0]; }

export default function Calendar() {
    const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [selected, setSelected] = useState<string>(ymd(new Date()));

    const { data: invoices } = useQuery({ queryKey: ['cal-invoices'], queryFn: async () => (await api.get('/invoices', { params: { per_page: 100 } })).data });
    const { data: bills } = useQuery({ queryKey: ['cal-bills'], queryFn: async () => (await api.get('/bills', { params: { per_page: 100 } })).data });
    const { data: commitments } = useQuery({ queryKey: ['cal-commitments'], queryFn: async () => (await api.get('/commitments', { params: { per_page: 100 } })).data });

    const events = useMemo(() => {
        const list: CalEvent[] = [];
        invoices?.data?.forEach((i: any) => { if (i.due_date && i.status !== 'paid') list.push({ date: i.due_date.split('T')[0], label: `Invoice ${i.invoice_number} due`, kind: 'invoice', to: `/invoices/${i.id}` }); });
        bills?.data?.forEach((b: any) => { if (b.due_date && b.status !== 'paid') list.push({ date: b.due_date.split('T')[0], label: `Bill ${b.bill_number} due`, kind: 'bill', to: '/bills' }); });
        commitments?.data?.forEach((c: any) => { if (c.due_date && c.status !== 'completed' && c.status !== 'cancelled') list.push({ date: c.due_date.split('T')[0], label: c.title, kind: 'commitment', to: '/commitments' }); });
        return list;
    }, [invoices, bills, commitments]);

    const eventsByDate = useMemo(() => {
        const map: Record<string, CalEvent[]> = {};
        events.forEach(e => { (map[e.date] ||= []).push(e); });
        return map;
    }, [events]);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

    const todayStr = ymd(new Date());
    const selectedEvents = eventsByDate[selected] || [];

    const upcoming = useMemo(() => [...events].filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8), [events, todayStr]);

    return (
        <div className="space-y-6">
            <div className="page-header"><h1 className="page-title">Calendar</h1></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(ymd(d)); }} className="text-sm px-2 py-1 rounded hover:bg-gray-100">Today</button>
                            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-1">
                        {DOW.map(d => <div key={d} className="py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((date, i) => {
                            if (!date) return <div key={i} />;
                            const ds = ymd(date);
                            const dayEvents = eventsByDate[ds] || [];
                            const isToday = ds === todayStr;
                            const isSelected = ds === selected;
                            return (
                                <button key={i} onClick={() => setSelected(ds)}
                                    className={`min-h-[64px] p-1 rounded-lg border text-left transition ${isSelected ? 'border-blue-500 ring-1 ring-blue-300' : 'border-gray-100 hover:border-gray-300'} ${isToday ? 'bg-blue-50' : ''}`}>
                                    <span className={`text-xs ${isToday ? 'font-bold text-blue-700' : 'text-gray-600'}`}>{date.getDate()}</span>
                                    <div className="mt-1 space-y-0.5">
                                        {dayEvents.slice(0, 3).map((e, idx) => <div key={idx} className={`w-full h-1.5 rounded-full ${KIND_META[e.kind].color}`} />)}
                                        {dayEvents.length > 3 && <span className="text-[10px] text-gray-400">+{dayEvents.length - 3}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Invoices</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Bills</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Commitments</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-semibold mb-3">{new Date(selected + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                        {selectedEvents.length === 0 ? <p className="text-sm text-gray-400">No events.</p> : (
                            <div className="space-y-2">
                                {selectedEvents.map((e, i) => { const M = KIND_META[e.kind]; return (
                                    <Link key={i} to={e.to || '#'} className={`flex items-center gap-2 p-2 rounded-lg ${M.bg}`}>
                                        <M.Icon className={`w-4 h-4 ${M.text}`} /><span className="text-sm text-gray-700">{e.label}</span>
                                    </Link>
                                ); })}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="font-semibold mb-3">Upcoming</h3>
                        {upcoming.length === 0 ? <p className="text-sm text-gray-400">Nothing upcoming.</p> : (
                            <div className="space-y-2">
                                {upcoming.map((e, i) => { const M = KIND_META[e.kind]; return (
                                    <Link key={i} to={e.to || '#'} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1.5 rounded">
                                        <span className={`w-2 h-2 rounded-full ${M.color}`} />
                                        <span className="text-gray-400 w-14 shrink-0">{e.date.slice(5)}</span>
                                        <span className="text-gray-700 truncate">{e.label}</span>
                                    </Link>
                                ); })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
