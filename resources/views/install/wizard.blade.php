<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Install - {{ config('app.name', 'LifeLedger Pro') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8" id="installer">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span class="text-white font-bold text-2xl">LL</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">LifeLedger Pro Installation</h1>
            <p class="text-gray-500 mt-1">Let's set up your application</p>
        </div>

        <!-- Progress Steps -->
        <div class="flex items-center justify-center space-x-2 mb-8" id="progress">
            <div class="step-dot active" data-step="1"></div>
            <div class="step-dot" data-step="2"></div>
            <div class="step-dot" data-step="3"></div>
            <div class="step-dot" data-step="4"></div>
            <div class="step-dot" data-step="5"></div>
        </div>

        <!-- Step 1: Requirements -->
        <div class="step" id="step-1">
            <h2 class="text-lg font-semibold mb-4">Server Requirements</h2>
            <div id="requirements-list" class="space-y-2 mb-4">
                <p class="text-gray-500 text-sm">Checking...</p>
            </div>
            <button onclick="nextStep(2)" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700" id="btn-step1" disabled>Continue</button>
        </div>

        <!-- Step 2: Database -->
        <div class="step hidden" id="step-2">
            <h2 class="text-lg font-semibold mb-4">Database Configuration</h2>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Host</label><input id="db_host" value="localhost" class="w-full px-3 py-2 border rounded-lg"></div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Port</label><input id="db_port" value="3306" class="w-full px-3 py-2 border rounded-lg"></div>
                </div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Database Name</label><input id="db_database" class="w-full px-3 py-2 border rounded-lg" placeholder="lifeledger_db"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Username</label><input id="db_username" class="w-full px-3 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Password</label><input id="db_password" type="password" class="w-full px-3 py-2 border rounded-lg"></div>
                <button onclick="testDatabase()" class="text-sm text-blue-600 hover:underline" id="test-db-btn">Test Connection</button>
                <p id="db-status" class="text-sm hidden"></p>
            </div>
            <button onclick="nextStep(3)" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mt-4" id="btn-step2" disabled>Continue</button>
        </div>

        <!-- Step 3: Application Settings -->
        <div class="step hidden" id="step-3">
            <h2 class="text-lg font-semibold mb-4">Application Settings</h2>
            <div class="space-y-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Application Name</label><input id="app_name" value="LifeLedger Pro" class="w-full px-3 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Application URL</label><input id="app_url" class="w-full px-3 py-2 border rounded-lg" placeholder="https://yourdomain.com"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select id="app_currency" class="w-full px-3 py-2 border rounded-lg"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option><option value="AUD">AUD</option></select>
                    </div>
                    <div><label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label><input id="app_timezone" value="UTC" class="w-full px-3 py-2 border rounded-lg"></div>
                </div>
            </div>
            <button onclick="nextStep(4)" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mt-4">Continue</button>
        </div>

        <!-- Step 4: Admin Account -->
        <div class="step hidden" id="step-4">
            <h2 class="text-lg font-semibold mb-4">Create Admin Account</h2>
            <div class="space-y-4">
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Name</label><input id="admin_name" class="w-full px-3 py-2 border rounded-lg" placeholder="Admin"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Email</label><input id="admin_email" type="email" class="w-full px-3 py-2 border rounded-lg" placeholder="admin@example.com"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Password</label><input id="admin_password" type="password" class="w-full px-3 py-2 border rounded-lg" placeholder="Min 8 characters"></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input id="admin_password_confirm" type="password" class="w-full px-3 py-2 border rounded-lg"></div>
            </div>
            <button onclick="runInstallation()" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mt-4" id="btn-install">Install Now</button>
        </div>

        <!-- Step 5: Complete -->
        <div class="step hidden" id="step-5">
            <div class="text-center py-8">
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Installation Complete!</h2>
                <p class="text-gray-600 mt-2">Your application is ready to use.</p>
                <div class="mt-6 space-y-3">
                    <a href="/login" class="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center">Go to Login</a>
                    <div class="bg-amber-50 p-4 rounded-lg text-left text-sm">
                        <p class="font-medium text-amber-800">Important:</p>
                        <ul class="text-amber-700 mt-1 space-y-1 list-disc list-inside">
                            <li>Set up a cron job: <code class="bg-amber-100 px-1 rounded">* * * * * php /path/artisan schedule:run</code></li>
                            <li>Configure Cloudflare if using it (see docs)</li>
                            <li>Test email delivery from settings</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <p id="error-msg" class="text-red-600 text-sm mt-4 hidden"></p>
    </div>

    <style>
        .step-dot { width: 12px; height: 12px; border-radius: 50%; background: #e5e7eb; transition: all 0.3s; }
        .step-dot.active { background: #2563eb; width: 24px; border-radius: 6px; }
        .step-dot.done { background: #10b981; }
    </style>

    <script>
    const csrf = document.querySelector('meta[name="csrf-token"]').content;
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf };

    // Step 1: Check requirements on load
    fetch('/install/check-requirements', { method: 'POST', headers }).then(r => r.json()).then(data => {
        const list = document.getElementById('requirements-list');
        list.innerHTML = '';
        for (const [key, passed] of Object.entries(data.requirements)) {
            list.innerHTML += `<div class="flex items-center justify-between py-1"><span class="text-sm">${key.replace('_', ' ')}</span><span class="${passed ? 'text-green-600' : 'text-red-600'}">${passed ? '✓' : '✗'}</span></div>`;
        }
        list.innerHTML += `<div class="flex items-center justify-between py-1 border-t mt-2 pt-2"><span class="text-sm font-medium">PHP Version</span><span class="text-sm">${data.php_version}</span></div>`;
        document.getElementById('btn-step1').disabled = !data.all_passed;
    });

    function nextStep(n) {
        document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
        document.getElementById('step-' + n).classList.remove('hidden');
        document.querySelectorAll('.step-dot').forEach((d, i) => { d.classList.toggle('active', i === n-1); d.classList.toggle('done', i < n-1); });
    }

    function testDatabase() {
        const data = { host: gv('db_host'), port: gv('db_port'), database: gv('db_database'), username: gv('db_username'), password: gv('db_password') };
        fetch('/install/test-database', { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json()).then(res => {
            const el = document.getElementById('db-status');
            el.classList.remove('hidden');
            el.className = `text-sm ${res.success ? 'text-green-600' : 'text-red-600'}`;
            el.textContent = res.message;
            document.getElementById('btn-step2').disabled = !res.success;
        });
    }

    async function runInstallation() {
        const btn = document.getElementById('btn-install');
        btn.disabled = true; btn.textContent = 'Installing...';
        try {
            // Configure app and write .env
            await post('/install/configure-app', { app_name: gv('app_name'), app_url: gv('app_url') || window.location.origin, timezone: gv('app_timezone'), currency: gv('app_currency'), db_host: gv('db_host'), db_port: gv('db_port'), db_database: gv('db_database'), db_username: gv('db_username'), db_password: gv('db_password'), mail_host: '', mail_port: '', mail_username: '', mail_password: '', mail_encryption: 'tls', mail_from_address: gv('admin_email'), google_client_id: '', google_client_secret: '' });
            // Run migrations
            await post('/install/run-migration', {});
            // Run seeders
            await post('/install/run-seeder', {});
            // Create admin
            await post('/install/create-admin', { name: gv('admin_name'), email: gv('admin_email'), password: gv('admin_password'), password_confirmation: gv('admin_password_confirm') });
            // Finalize
            await post('/install/finalize', {});
            nextStep(5);
        } catch (e) { showError(e.message || 'Installation failed.'); btn.disabled = false; btn.textContent = 'Retry Installation'; }
    }

    async function post(url, data) {
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) });
        const json = await r.json();
        if (!r.ok || json.success === false) throw new Error(json.message || 'Step failed');
        return json;
    }

    function gv(id) { return document.getElementById(id)?.value || ''; }
    function showError(msg) { const el = document.getElementById('error-msg'); el.textContent = msg; el.classList.remove('hidden'); }
    </script>
</body>
</html>
