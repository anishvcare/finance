<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'type',
        'name',
        'business_name',
        'contact_person',
        'email',
        'phone',
        'mobile',
        'billing_address_line_1',
        'billing_address_line_2',
        'billing_city',
        'billing_state',
        'billing_postal_code',
        'billing_country',
        'shipping_address_line_1',
        'shipping_address_line_2',
        'shipping_city',
        'shipping_state',
        'shipping_postal_code',
        'shipping_country',
        'tax_number',
        'currency',
        'payment_terms',
        'credit_limit',
        'default_discount',
        'default_tax_id',
        'opening_balance',
        'notes',
        'tags',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'payment_terms' => 'integer',
        'credit_limit' => 'integer',
        'default_discount' => 'decimal:2',
        'opening_balance' => 'integer',
        'tags' => 'array',
        'is_active' => 'boolean',
    ];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function defaultTax()
    {
        return $this->belongsTo(Tax::class, 'default_tax_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function outstandingBalance(): int
    {
        return $this->invoices()
            ->whereNotIn('status', ['draft', 'void', 'cancelled', 'paid'])
            ->sum('balance_due');
    }
}
