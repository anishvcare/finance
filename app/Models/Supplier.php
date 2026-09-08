<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Supplier extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'name',
        'business_name',
        'contact_person',
        'email',
        'phone',
        'mobile',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_number',
        'currency',
        'payment_terms',
        'bank_account_name',
        'bank_name',
        'bank_account_number',
        'bank_bsb',
        'bank_swift',
        'bank_iban',
        'opening_balance',
        'notes',
        'tags',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'payment_terms' => 'integer',
        'opening_balance' => 'integer',
        'tags' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'bank_account_number',
    ];

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function bankAccountNumber(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? decrypt($value) : null,
            set: fn (?string $value) => $value ? encrypt($value) : null,
        );
    }

    public function outstandingBalance(): int
    {
        return $this->bills()
            ->whereNotIn('status', ['draft', 'cancelled', 'paid'])
            ->sum('balance_due');
    }
}
