<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'type',
        'customer_id',
        'supplier_id',
        'account_id',
        'amount',
        'currency',
        'exchange_rate',
        'payment_date',
        'payment_method',
        'reference_number',
        'notes',
        'attachment_path',
        'is_refund',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'exchange_rate' => 'decimal:6',
        'payment_date' => 'date',
        'is_refund' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function allocatedAmount(): int
    {
        return $this->allocations()->sum('amount');
    }

    public function unallocatedAmount(): int
    {
        return $this->amount - $this->allocatedAmount();
    }
}
