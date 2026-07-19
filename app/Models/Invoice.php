<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'invoice_number',
        'customer_id',
        'quote_id',
        'status',
        'invoice_date',
        'due_date',
        'currency',
        'payment_terms',
        'reference_number',
        'purchase_order',
        'salesperson',
        'subtotal',
        'discount_amount',
        'shipping_amount',
        'tax_amount',
        'additional_charges',
        'round_off',
        'total',
        'amount_paid',
        'balance_due',
        'notes',
        'terms',
        'payment_instructions',
        'internal_notes',
        'footer',
        'template',
        'share_token',
        'share_expires_at',
        'finalised_at',
        'sent_at',
        'viewed_at',
        'paid_at',
        'voided_at',
        'created_by',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'payment_terms' => 'integer',
        'subtotal' => 'integer',
        'discount_amount' => 'integer',
        'shipping_amount' => 'integer',
        'tax_amount' => 'integer',
        'additional_charges' => 'integer',
        'round_off' => 'integer',
        'total' => 'integer',
        'amount_paid' => 'integer',
        'balance_due' => 'integer',
        'finalised_at' => 'datetime',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
        'share_expires_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    public function payments()
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function emailLogs()
    {
        return $this->morphMany(EmailLog::class, 'related');
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'subject');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isFinalised(): bool
    {
        return in_array($this->status, ['finalised', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue']);
    }

    public function isEditable(): bool
    {
        return $this->status === 'draft';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->balance_due > 0 && $this->due_date->isPast() && !in_array($this->status, ['void', 'cancelled', 'paid']);
    }
}
