import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { canInstall, promptInstall, isInstalled, isIOS } from '../lib/pwa';
import {
    LayoutDashboard, Package, Briefcase, Users, Truck, FileText,
    Receipt, CreditCard, ArrowLeftRight, CheckSquare, Target,
    Contact, Calendar, BarChart3, Settings, Menu, X, LogOut,
    ChevronDown, ChevronRight, Bell, Plus, UserPlus, ShoppingBag, Download
} from 'lucide-react';

interface NavItem { label: string; path: string; icon: React.ElementType; }
interface NavGroup { label: string; icon: React.ElementType; children: NavItem[]; }
type NavEntry = ({ kind: 'item' } & NavItem) | ({ kind: 'group' } & NavGroup);

const nav: NavEntry[] = [
    { kind: 'item', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
        kind: 'group', label: 'Sales', icon: ShoppingBag, children: [
            { label: 'Products', path: '/products', icon: Package },
            { label: 'Services', path: '/services', icon: Briefcase },
            { label: 'Customers', path: '/customers', icon: Users },
            { label: 'Suppliers', path: '/suppliers', icon: Truck },
            { label: 'Leads', path: '/leads', icon: UserPlus },
            { label: 'Quotes', path: '/quotes', icon: FileText },
            { label: 'Invoices', path: '/invoices', icon: Receipt },
            { label: 'Bills', path: '/bills', icon: CreditCard },
        ],
    },
    { kind: 'item', label: 'Payments', path: '/payments', icon: ArrowLeftRight },
    { kind: 'item', label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { kind: 'item', label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { kind: 'item', label: 'Commitments', path: '/commitments', icon: Target },
    { kind: 'item', label: 'Contacts', path: '/contacts', icon: Contact },
    { kind: 'item', label: 'Calendar', path: '/calendar', icon: Calendar },
    { kind: 'item', label: 'Reports', path: '/reports', icon: BarChart3 },
    { kind: 'item', label: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [installable, setInstallable] = useState(false);
    const { user, workspace, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const salesActive = (nav.find(n => n.kind === 'group') as NavGroup | undefined)?.children.some(c => isActive(c.path)) ?? false;
    const [salesOpen, setSalesOpen] = useState(salesActive);
    useEffect(() => { if (salesActive) setSalesOpen(true); }, [salesActive]);

    useEffect(() => {
        if (isInstalled()) return;
        const check = () => setInstallable(canInstall() || isIOS());
        check();
        window.addEventListener('pwa-install-available', check);
        return () => window.removeEventListener('pwa-install-available', check);
    }, []);

    const handleInstall = async () => {
        if (isIOS()) {
            toast('On iPhone: tap the Share button, then "Add to Home Screen".', { duration: 6000, icon: '📲' });
            return;
        }
        const ok = await promptInstall();
        if (!ok) toast('If no prompt appeared, use your browser menu → "Install app" / "Add to Home screen".', { duration: 6000 });
    };

    const navLinkClass = (active: boolean) =>
        `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`;

    return (
        <div className="flex h-screen bg-gray-50">
            {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">LL</span></div>
                            <span className="font-bold text-gray-900">LifeLedger</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Workspace */}
                    <div className="px-3 py-3 border-b border-gray-100">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm">
                            <div className="flex items-center space-x-2 truncate">
                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center"><span className="text-blue-600 text-xs font-bold">{workspace?.name?.[0] || 'W'}</span></div>
                                <span className="font-medium text-gray-700 truncate">{workspace?.name || 'Workspace'}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                        {nav.map((entry) => {
                            if (entry.kind === 'item') {
                                const Icon = entry.icon;
                                const active = isActive(entry.path);
                                return (
                                    <Link key={entry.path} to={entry.path} onClick={() => setSidebarOpen(false)} className={navLinkClass(active)}>
                                        <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <span>{entry.label}</span>
                                    </Link>
                                );
                            }
                            // group
                            const GIcon = entry.icon;
                            return (
                                <div key={entry.label}>
                                    <button onClick={() => setSalesOpen(o => !o)} className={`w-full ${navLinkClass(salesActive && !salesOpen)} justify-between`}>
                                        <span className="flex items-center space-x-3">
                                            <GIcon className={`w-5 h-5 ${salesActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <span>{entry.label}</span>
                                        </span>
                                        {salesOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    </button>
                                    {salesOpen && (
                                        <div className="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-1">
                                            {entry.children.map((child) => {
                                                const CIcon = child.icon;
                                                const active = isActive(child.path);
                                                return (
                                                    <Link key={child.path} to={child.path} onClick={() => setSidebarOpen(false)} className={navLinkClass(active)}>
                                                        <CIcon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                                        <span>{child.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Install app (mobile / supported browsers) */}
                    {installable && (
                        <div className="px-3 pb-2">
                            <button onClick={handleInstall} className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                                <Download className="w-4 h-4" /><span>Install App</span>
                            </button>
                        </div>
                    )}

                    {/* User */}
                    <div className="border-t border-gray-100 p-3">
                        <div className="flex items-center space-x-3 px-3 py-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {user?.avatar ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" /> : <span className="text-gray-600 text-sm font-medium">{user?.name?.[0]}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button onClick={logout} className="p-1 text-gray-400 hover:text-red-600" title="Logout"><LogOut className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600"><Menu className="w-5 h-5" /></button>
                    <div className="flex-1" />
                    <div className="flex items-center space-x-3">
                        <button className="p-2 text-gray-400 hover:text-gray-600 relative"><Bell className="w-5 h-5" /></button>
                        <Link to="/invoices/create" className="hidden sm:flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                            <Plus className="w-4 h-4" /><span>New Invoice</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
