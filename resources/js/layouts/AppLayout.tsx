import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { canInstall, promptInstall, isInstalled, isIOS } from '../lib/pwa';
import {
    LayoutDashboard, Package, Briefcase, Users, Truck, FileText,
    Receipt, CreditCard, ArrowLeftRight, CheckSquare, Target,
    Contact, Calendar, BarChart3, Settings, Menu, X, LogOut,
    ChevronDown, ChevronRight, Bell, Plus, UserPlus, ShoppingBag, Download,
    ArrowDownRight, ArrowUpRight, Home
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
    const [showInstall, setShowInstall] = useState(!isInstalled());
    const { user, workspace, logout } = useAuth();
    const location = useLocation();
    const isBusiness = (workspace?.type ?? 'business') !== 'personal';

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const salesActive = (nav.find(n => n.kind === 'group') as NavGroup | undefined)?.children.some(c => isActive(c.path)) ?? false;
    const [salesOpen, setSalesOpen] = useState(salesActive);
    useEffect(() => { if (salesActive) setSalesOpen(true); }, [salesActive]);

    useEffect(() => {
        const onInstalled = () => setShowInstall(false);
        window.addEventListener('pwa-installed', onInstalled);
        return () => window.removeEventListener('pwa-installed', onInstalled);
    }, []);

    const handleInstall = async () => {
        if (isIOS()) {
            toast('On iPhone: tap the Share icon, then "Add to Home Screen".', { duration: 7000, icon: '📲' });
            return;
        }
        if (canInstall()) {
            const ok = await promptInstall();
            if (ok) { setShowInstall(false); return; }
        }
        toast('No install prompt available. Use your browser menu → "Install app" / "Add to Home screen".', { duration: 7000, icon: '📲' });
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

                    {/* Install app */}
                    {showInstall && (
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
                    <Link to="/dashboard" title="Dashboard" className={`flex items-center space-x-1 p-2 rounded-lg text-sm font-medium ${isActive('/dashboard') ? 'text-blue-700 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <Home className="w-5 h-5" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <div className="flex-1" />
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                        {isBusiness ? (
                            <>
                                <Link to="/invoices/create" title="New Invoice" className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Receipt className="w-5 h-5" /></Link>
                                <Link to="/quotes/create" title="New Quote" className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><FileText className="w-5 h-5" /></Link>
                                <Link to="/leads?new=1" title="New Lead" className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><UserPlus className="w-5 h-5" /></Link>
                                <Link to="/bills?new=1" title="New Bill" className="hidden sm:inline-flex p-2 rounded-lg text-amber-600 hover:bg-amber-50"><CreditCard className="w-5 h-5" /></Link>
                            </>
                        ) : (
                            <>
                                <Link to="/transactions?new=income" title="Add Income" className="p-2 rounded-lg text-green-600 hover:bg-green-50"><ArrowDownRight className="w-5 h-5" /></Link>
                                <Link to="/transactions?new=expense" title="Add Expense" className="p-2 rounded-lg text-red-600 hover:bg-red-50"><ArrowUpRight className="w-5 h-5" /></Link>
                                <Link to="/tasks?new=1" title="New Task" className="p-2 rounded-lg text-purple-600 hover:bg-purple-50"><CheckSquare className="w-5 h-5" /></Link>
                                <Link to="/commitments?new=1" title="New Commitment" className="hidden sm:inline-flex p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Target className="w-5 h-5" /></Link>
                            </>
                        )}
                        <span className="w-px h-6 bg-gray-200 mx-1" />
                        <button title="Notifications" className="p-2 text-gray-400 hover:text-gray-600 relative"><Bell className="w-5 h-5" /></button>
                        {isBusiness ? (
                            <Link to="/invoices/create" title="New Invoice" className="hidden md:flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 ml-1">
                                <Plus className="w-4 h-4" /><span>New Invoice</span>
                            </Link>
                        ) : (
                            <Link to="/transactions?new=expense" title="Add Expense" className="hidden md:flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 ml-1">
                                <Plus className="w-4 h-4" /><span>Add Entry</span>
                            </Link>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
