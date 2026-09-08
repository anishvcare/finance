<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'bill_number', 'supplier_id', 'supplier_invoice_number',
        'status', 'bill_date', 'due_date', 'currency', 'payment_terms',
        'subtotal', 'discount_amount', 'shipping_amount', 'tax_amount',
        'additional_charges', 'round_off', 'total', 'amount_paid', 'balance_due',
        'notes', 'internal_notes', 'attachment_path', 'created_by',
    ];

    protected $casts = [
        'bill_date' => 'date', 'due_date' => 'date',
        'subtotal' => 'integer', 'discount_amount' => 'integer',
        'shipping_amount' => 'integer', 'tax_amount' => 'integer',
        'additional_charges' => 'integer', 'round_off' => 'integer',
        'total' => 'integer', 'amount_paid' => 'integer', 'balance_due' => 'integer',
    ];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(BillItem::class)->orderBy('sort_order'); }
    public function payments() { return $this->hasMany(PaymentAllocation::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
