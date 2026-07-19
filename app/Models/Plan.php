<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'price_monthly', 'price_yearly', 'currency',
        'max_workspaces', 'max_members', 'max_products', 'max_services',
        'max_customers', 'max_invoices_monthly', 'max_bills_monthly',
        'max_transactions_monthly', 'max_ocr_monthly', 'max_storage_mb',
        'features', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'integer', 'price_yearly' => 'integer',
        'features' => 'array', 'is_active' => 'boolean', 'sort_order' => 'integer',
    ];

    public function subscriptions() { return $this->hasMany(Subscription::class); }
}
