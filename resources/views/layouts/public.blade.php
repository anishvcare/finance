<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="@yield('meta_description', 'Personal Finance & Business Management - Track income, expenses, invoices, and tasks in one place.')">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', config('app.name', 'LifeLedger Pro'))</title>
    <link rel="icon" href="/icons/favicon.ico">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="{{ config('app.pwa_theme_color', '#2563EB') }}">
    @vite(['resources/css/app.css'])
    @stack('head')
</head>
<body class="min-h-screen bg-white text-gray-900 antialiased">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="/" class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-sm">LL</span>
                        </div>
                        <span class="font-bold text-xl text-gray-900">{{ config('app.name', 'LifeLedger Pro') }}</span>
                    </a>
                    <div class="hidden md:flex ml-10 space-x-8">
                        <a href="/features" class="text-gray-600 hover:text-blue-600 text-sm font-medium">Features</a>
                        <a href="/pricing" class="text-gray-600 hover:text-blue-600 text-sm font-medium">Pricing</a>
                        <a href="/how-it-works" class="text-gray-600 hover:text-blue-600 text-sm font-medium">How It Works</a>
                        <a href="/contact" class="text-gray-600 hover:text-blue-600 text-sm font-medium">Contact</a>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    @auth
                        <a href="/app/dashboard" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Dashboard</a>
                    @else
                        <a href="/login" class="text-gray-600 hover:text-blue-600 text-sm font-medium">Login</a>
                        <a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Get Started</a>
                    @endauth
                </div>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="text-white font-semibold mb-4">Product</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/features" class="hover:text-white">Features</a></li>
                        <li><a href="/pricing" class="hover:text-white">Pricing</a></li>
                        <li><a href="/install-app" class="hover:text-white">Install App</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-white font-semibold mb-4">Features</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/features/finance" class="hover:text-white">Finance</a></li>
                        <li><a href="/features/invoicing" class="hover:text-white">Invoicing</a></li>
                        <li><a href="/features/products" class="hover:text-white">Products</a></li>
                        <li><a href="/features/tasks" class="hover:text-white">Tasks</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-white font-semibold mb-4">Legal</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
                        <li><a href="/terms" class="hover:text-white">Terms of Service</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-white font-semibold mb-4">Support</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/faq" class="hover:text-white">FAQ</a></li>
                        <li><a href="/contact" class="hover:text-white">Contact Us</a></li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
                <p>&copy; {{ date('Y') }} {{ config('app.name', 'LifeLedger Pro') }}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    @stack('scripts')
</body>
</html>
