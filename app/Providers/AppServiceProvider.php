<?php

namespace App\Providers;

use App\Models\Invoice;
use App\Models\Product;
use App\Models\Workspace;
use App\Policies\InvoicePolicy;
use App\Policies\ProductPolicy;
use App\Policies\WorkspacePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Force HTTPS in production or behind Cloudflare
        if (config('app.force_https') || $this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Register policies
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Workspace::class, WorkspacePolicy::class);
    }
}
