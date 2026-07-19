import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { AppLayout } from './layouts/AppLayout';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/Products/ProductForm'));
const Services = lazy(() => import('./pages/Services'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/Customers/CustomerDetail'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Leads = lazy(() => import('./pages/Leads'));
const Quotes = lazy(() => import('./pages/Quotes'));
const QuoteForm = lazy(() => import('./pages/Quotes/QuoteForm'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceForm = lazy(() => import('./pages/Invoices/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/Invoices/InvoiceDetail'));
const Bills = lazy(() => import('./pages/Bills'));
const Payments = lazy(() => import('./pages/Payments'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Commitments = lazy(() => import('./pages/Commitments'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}

export function AppRoutes() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return null;
    }

    if (!user.onboarding_completed && !user.current_workspace_id) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="*" element={<Navigate to="/onboarding" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <AppLayout>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/create" element={<ProductForm />} />
                    <Route path="/products/:id/edit" element={<ProductForm />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/quotes" element={<Quotes />} />
                    <Route path="/quotes/create" element={<QuoteForm />} />
                    <Route path="/quotes/:id" element={<QuoteForm />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/invoices/create" element={<InvoiceForm />} />
                    <Route path="/invoices/:id" element={<InvoiceDetail />} />
                    <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/commitments" element={<Commitments />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/:type" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/:section" element={<Settings />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Suspense>
        </AppLayout>
    );
}
