<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstallController extends Controller
{
    public function index()
    {
        if (file_exists(storage_path('installed.lock'))) {
            abort(404);
        }

        return view('install.wizard');
    }

    public function checkRequirements(): JsonResponse
    {
        $requirements = [
            'php_version' => version_compare(PHP_VERSION, '8.2.0', '>='),
            'bcmath' => extension_loaded('bcmath'),
            'ctype' => extension_loaded('ctype'),
            'curl' => extension_loaded('curl'),
            'dom' => extension_loaded('dom'),
            'fileinfo' => extension_loaded('fileinfo'),
            'gd' => extension_loaded('gd'),
            'json' => extension_loaded('json'),
            'mbstring' => extension_loaded('mbstring'),
            'openssl' => extension_loaded('openssl'),
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'tokenizer' => extension_loaded('tokenizer'),
            'xml' => extension_loaded('xml'),
            'zip' => extension_loaded('zip'),
        ];

        $allPassed = !in_array(false, $requirements);

        return response()->json([
            'requirements' => $requirements,
            'php_version' => PHP_VERSION,
            'all_passed' => $allPassed,
        ]);
    }

    public function checkPermissions(): JsonResponse
    {
        $paths = [
            'storage' => storage_path(),
            'storage/app' => storage_path('app'),
            'storage/logs' => storage_path('logs'),
            'storage/framework' => storage_path('framework'),
            'bootstrap/cache' => base_path('bootstrap/cache'),
        ];

        $permissions = [];
        foreach ($paths as $label => $path) {
            $permissions[$label] = is_writable($path);
        }

        $envWritable = is_writable(base_path()) || is_writable(base_path('.env'));
        $permissions['.env'] = $envWritable;

        return response()->json([
            'permissions' => $permissions,
            'all_passed' => !in_array(false, $permissions),
            'env_writable' => $envWritable,
        ]);
    }

    public function testDatabase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => 'required|string',
            'port' => 'required|numeric',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        try {
            $dsn = "mysql:host={$validated['host']};port={$validated['port']};dbname={$validated['database']}";
            $pdo = new \PDO($dsn, $validated['username'], $validated['password'] ?? '');
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            return response()->json(['success' => true, 'message' => 'Database connection successful.']);
        } catch (\PDOException $e) {
            return response()->json(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()], 422);
        }
    }

    public function configureApp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'timezone' => 'required|string',
            'currency' => 'required|string|size:3',
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_database' => 'required|string',
            'db_username' => 'required|string',
            'db_password' => 'nullable|string',
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|numeric',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|email',
            'google_client_id' => 'nullable|string',
            'google_client_secret' => 'nullable|string',
        ]);

        $envContent = $this->generateEnvContent($validated);

        try {
            file_put_contents(base_path('.env'), $envContent);
            return response()->json(['success' => true, 'message' => '.env file created successfully.']);
        } catch (\Exception $e) {
            // Return content for manual creation
            return response()->json([
                'success' => false,
                'manual_required' => true,
                'env_content' => $envContent,
                'message' => 'Could not write .env file. Please create it manually.',
            ], 200);
        }
    }

    public function runMigration(): JsonResponse
    {
        try {
            Artisan::call('migrate', ['--force' => true]);
            return response()->json(['success' => true, 'message' => 'Database migration successful.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Migration failed: ' . $e->getMessage()], 422);
        }
    }

    public function runSeeder(): JsonResponse
    {
        try {
            Artisan::call('db:seed', ['--force' => true]);
            return response()->json(['success' => true, 'message' => 'Seeding successful.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Seeding failed: ' . $e->getMessage()], 422);
        }
    }

    public function createAdmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_super_admin' => true,
            'email_verified_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Admin account created.']);
    }

    public function finalize(): JsonResponse
    {
        try {
            // Generate APP_KEY if not set
            if (!config('app.key')) {
                Artisan::call('key:generate', ['--force' => true]);
            }

            // Create storage link
            Artisan::call('storage:link');

            // Lock installation
            file_put_contents(storage_path('installed.lock'), json_encode([
                'installed_at' => now()->toISOString(),
                'version' => '1.0.0',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Installation complete! You can now log in.',
                'login_url' => '/login',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    private function generateEnvContent(array $config): string
    {
        $key = 'base64:' . base64_encode(random_bytes(32));

        return <<<ENV
APP_NAME="{$config['app_name']}"
APP_SHORT_NAME="LifeLedger"
APP_ENV=production
APP_KEY={$key}
APP_DEBUG=false
APP_URL={$config['app_url']}
APP_TIMEZONE={$config['timezone']}

FORCE_HTTPS=true

DB_CONNECTION=mysql
DB_HOST={$config['db_host']}
DB_PORT={$config['db_port']}
DB_DATABASE={$config['db_database']}
DB_USERNAME={$config['db_username']}
DB_PASSWORD={$config['db_password']}

CACHE_DRIVER=file
QUEUE_CONNECTION=database
SESSION_DRIVER=database
SESSION_LIFETIME=120

MAIL_MAILER=smtp
MAIL_HOST={$config['mail_host']}
MAIL_PORT={$config['mail_port']}
MAIL_USERNAME={$config['mail_username']}
MAIL_PASSWORD={$config['mail_password']}
MAIL_ENCRYPTION={$config['mail_encryption']}
MAIL_FROM_ADDRESS="{$config['mail_from_address']}"
MAIL_FROM_NAME="\${APP_NAME}"

GOOGLE_CLIENT_ID={$config['google_client_id']}
GOOGLE_CLIENT_SECRET={$config['google_client_secret']}
GOOGLE_REDIRECT_URI="{$config['app_url']}/auth/google/callback"

DEFAULT_CURRENCY={$config['currency']}
DEFAULT_TIMEZONE={$config['timezone']}

PWA_THEME_COLOR=#2563EB
PWA_BACKGROUND_COLOR=#ffffff
ENV;
    }
}
