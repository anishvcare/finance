<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'workspace_id', 'account_id', 'type', 'amount', 'currency',
        'date', 'time', 'category_id', 'customer_id', 'supplier_id',
        'invoice_id', 'bill_id', 'payment_id', 'description', 'notes',
        'payment_method', 'reference', 'tags', 'is_recurring', 'recurrence_rule',
        'ocr_import_id', 'ocr_confidence', 'review_status', 'transfer_pair_id',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'integer', 'date' => 'date', 'tags' => 'array',
        'is_recurring' => 'boolean', 'ocr_confidence' => 'decimal:2',
    ];

    public function account() { return $this->belongsTo(Account::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function invoice() { return $this->belongsTo(Invoice::class); }
    public function bill() { return $this->belongsTo(Bill::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function transferPair() { return $this->belongsTo(Transaction::class, 'transfer_pair_id'); }
}
