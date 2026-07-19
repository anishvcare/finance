@extends('layouts.public')

@section('title', config('app.name', 'LifeLedger Pro') . ' - Personal Finance & Business Management')
@section('meta_description', 'Track personal finances, manage business invoicing, products, services, tasks and commitments. All in one powerful PWA.')

@section('content')
<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
                <h1 class="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Your Finances.<br>
                    Your Business.<br>
                    <span class="text-blue-600">One Platform.</span>
                </h1>
                <p class="mt-6 text-lg text-gray-600 max-w-xl">
                    Track personal income and expenses. Create professional invoices. Manage products, services, customers, and tasks. Install as an app on any device.
                </p>
                <div class="mt-8 flex flex-wrap gap-4">
                    <a href="/register" class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25">
                        Get Started Free
                    </a>
                    <a href="/features" class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition">
                        See Features
                    </a>
                </div>
                <p class="mt-4 text-sm text-gray-500">No credit card required. Free plan available.</p>
            </div>
            <div class="hidden lg:block">
                <div class="relative">
                    <div class="bg-white rounded-2xl shadow-2xl p-6 transform rotate-1">
                        <div class="bg-gray-100 rounded-lg p-4 space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-600">Monthly Revenue</span>
                                <span class="text-lg font-bold text-green-600">$12,450</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-600">Pending Invoices</span>
                                <span class="text-lg font-bold text-amber-600">$3,200</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-600">Tasks Due Today</span>
                                <span class="text-lg font-bold text-blue-600">5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Features Overview -->
<section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p class="mt-4 text-lg text-gray-600">One application for personal finance, business management, and productivity.</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Finance Management</h3>
                <p class="mt-2 text-gray-600">Track income, expenses, budgets, and account balances. Import from payment screenshots.</p>
            </div>
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Professional Invoicing</h3>
                <p class="mt-2 text-gray-600">Create quotes, generate invoices, track payments, and email documents to customers.</p>
            </div>
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Products & Services</h3>
                <p class="mt-2 text-gray-600">Manage your catalogue with pricing, tax rates, categories, and inventory tracking.</p>
            </div>
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Tasks & Commitments</h3>
                <p class="mt-2 text-gray-600">Manage tasks, track commitments and deadlines, set milestones, receive reminders.</p>
            </div>
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Install as App</h3>
                <p class="mt-2 text-gray-600">Install on your phone or desktop. Works offline. Syncs automatically when connected.</p>
            </div>
            <div class="p-6 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition">
                <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Reports & Insights</h3>
                <p class="mt-2 text-gray-600">Sales, expenses, profitability, cash flow, and productivity reports with exports.</p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-blue-600">
    <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold text-white">Ready to Take Control?</h2>
        <p class="mt-4 text-lg text-blue-100">Start managing your finances and business in minutes. No credit card needed.</p>
        <a href="/register" class="mt-8 inline-block bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition">
            Create Free Account
        </a>
    </div>
</section>
@endsection
