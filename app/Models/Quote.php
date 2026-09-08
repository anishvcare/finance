<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'quote_number',
        'customer_id',
        'status',
        'quote_date',
        'expiry_date',
        'currency',
        'subtotal',
        'discount_amount',
        'shipping_amount',
        'tax_amount',
        'additional_charges',
        'round_off',
        'total',
        'notes',
        'terms',
        'customer_message',
        'internal_notes',
        'converted_invoice_id',
        'template',
        'created_by',
        'sent_at',
        'viewed_at',
        'accepted_at',
        'rejected_at',
    ];

    protected $casts = [
        'quote_date' => 'date',
        'expiry_date' => 'date',
        'subtotal' => 'integer',
        'discount_amount' => 'integer',
        'shipping_amount' => 'integer',
        'tax_amount' => 'integer',
        'additional_charges' => 'integer',
        'round_off' => 'integer',
        'total' => 'integer',
        'sent_at' => 'datetime',
        'viewed_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(QuoteItem::class)->orderBy('sort_order');
    }

    public function convertedInvoice()
    {
        return $this->belongsTo(Invoice::class, 'converted_invoice_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast() && $this->status === 'sent';
    }

    public function isConvertible(): bool
    {
        return in_array($this->status, ['accepted', 'sent', 'viewed']) && !$this->converted_invoice_id;
    }
}
