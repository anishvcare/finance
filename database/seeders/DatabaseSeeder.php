<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPlans();
        $this->seedDefaultSettings();
    }

    private function seedPlans(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'For personal use and getting started',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'currency' => 'USD',
                'max_workspaces' => 1,
                'max_members' => 1,
                'max_products' => 20,
                'max_services' => 20,
                'max_customers' => 20,
                'max_invoices_monthly' => 10,
                'max_bills_monthly' => 10,
                'max_transactions_monthly' => 50,
                'max_ocr_monthly' => 5,
                'max_storage_mb' => 50,
                'features' => json_encode(['invoicing' => true, 'quotes' => false, 'reports_advanced' => false, 'custom_templates' => false, 'team_roles' => false, 'email_reminders' => false]),
                'sort_order' => 1,
            ],
            [
                'name' => 'Personal',
                'slug' => 'personal',
                'description' => 'For individuals managing personal finances',
                'price_monthly' => 999, // $9.99
                'price_yearly' => 9990, // $99.90
                'currency' => 'USD',
                'max_workspaces' => 2,
                'max_members' => 1,
                'max_products' => 100,
                'max_services' => 100,
                'max_customers' => 100,
                'max_invoices_monthly' => 50,
                'max_bills_monthly' => 50,
                'max_transactions_monthly' => 500,
                'max_ocr_monthly' => 30,
                'max_storage_mb' => 200,
                'features' => json_encode(['invoicing' => true, 'quotes' => true, 'reports_advanced' => false, 'custom_templates' => false, 'team_roles' => false, 'email_reminders' => true]),
                'sort_order' => 2,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'For small businesses and freelancers',
                'price_monthly' => 2499, // $24.99
                'price_yearly' => 24990,
                'currency' => 'USD',
                'max_workspaces' => 5,
                'max_members' => 5,
                'max_products' => 500,
                'max_services' => 500,
                'max_customers' => 500,
                'max_invoices_monthly' => 200,
                'max_bills_monthly' => 200,
                'max_transactions_monthly' => 2000,
                'max_ocr_monthly' => 100,
                'max_storage_mb' => 1000,
                'features' => json_encode(['invoicing' => true, 'quotes' => true, 'reports_advanced' => true, 'custom_templates' => true, 'team_roles' => true, 'email_reminders' => true, 'csv_export' => true]),
                'sort_order' => 3,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'For growing businesses needing more',
                'price_monthly' => 4999,
                'price_yearly' => 49990,
                'currency' => 'USD',
                'max_workspaces' => -1, // unlimited
                'max_members' => 20,
                'max_products' => -1,
                'max_services' => -1,
                'max_customers' => -1,
                'max_invoices_monthly' => -1,
                'max_bills_monthly' => -1,
                'max_transactions_monthly' => -1,
                'max_ocr_monthly' => -1,
                'max_storage_mb' => 5000,
                'features' => json_encode(['invoicing' => true, 'quotes' => true, 'reports_advanced' => true, 'custom_templates' => true, 'team_roles' => true, 'email_reminders' => true, 'csv_export' => true, 'api_access' => true, 'push_notifications' => true]),
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }

    private function seedDefaultSettings(): void
    {
        $settings = [
            ['key' => 'app_name', 'value' => 'LifeLedger Pro', 'type' => 'string', 'group' => 'app'],
            ['key' => 'app_short_name', 'value' => 'LifeLedger', 'type' => 'string', 'group' => 'app'],
            ['key' => 'default_currency', 'value' => 'USD', 'type' => 'string', 'group' => 'app'],
            ['key' => 'default_timezone', 'value' => 'UTC', 'type' => 'string', 'group' => 'app'],
            ['key' => 'registration_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'app'],
            ['key' => 'email_verification_required', 'value' => 'true', 'type' => 'boolean', 'group' => 'app'],
            ['key' => 'default_plan', 'value' => 'free', 'type' => 'string', 'group' => 'app'],
            ['key' => 'pwa_theme_color', 'value' => '#2563EB', 'type' => 'string', 'group' => 'pwa'],
            ['key' => 'pwa_background_color', 'value' => '#ffffff', 'type' => 'string', 'group' => 'pwa'],
            ['key' => 'google_oauth_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'oauth'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
