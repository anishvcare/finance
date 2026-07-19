import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
    LayoutDashboard, Package, Briefcase, Users, Truck, FileText,
    Receipt, CreditCard, ArrowLeftRight, CheckSquare, Target,
    Contact, Calendar, BarChart3, Settings, Menu, X, LogOut,
    ChevronDown, Bell, Plus, UserPlus
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Services', path: '/services', icon: Briefcase },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Suppliers', path: '/suppliers', icon: Truck },
    { label: 'Leads', path: '/leads', icon: UserPlus },
    { label: 'Quotes', path: '/quotes', icon: FileText },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Bills', path: '/bills', icon: CreditCard },
    { label: 'Payments', path: '/payments', icon: ArrowLeftRight },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Commitments', path: '/commitments', icon: Target },
    { label: 'Contacts', path: '/contacts', icon: Contact },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, workspace, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">LL</span>
                            </div>
                            <span className="font-bold text-gray-900">LifeLedger</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Workspace selector */}
                    <div className="px-3 py-3 border-b border-gray-100">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm">
                            <div className="flex items-center space-x-2 truncate">
                                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-bold">{workspace?.name?.[0] || 'W'}</span>
                                </div>
                                <span className="font-medium text-gray-700 truncate">{workspace?.name || 'Select Workspace'}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        active
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t border-gray-100 p-3">
                        <div className="flex items-center space-x-3 px-3 py-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                                ) : (
                                    <span className="text-gray-600 text-sm font-medium">{user?.name?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button onClick={logout} className="p-1 text-gray-400 hover:text-red-600" title="Logout">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center space-x-3">
                        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                            <Bell className="w-5 h-5" />
                        </button>
                        <Link to="/invoices/create" className="hidden sm:flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                            <Plus className="w-4 h-4" />
                            <span>New Invoice</span>
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
