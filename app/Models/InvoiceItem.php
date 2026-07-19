<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'type',
        'product_id',
        'service_id',
        'name',
        'description',
        'unit',
        'quantity',
        'unit_price',
        'discount_rate',
        'discount_amount',
        'tax_id',
        'tax_rate',
        'tax_amount',
        'line_total',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'integer',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'integer',
        'tax_rate' => 'decimal:4',
        'tax_amount' => 'integer',
        'line_total' => 'integer',
        'sort_order' => 'integer',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function tax()
    {
        return $this->belongsTo(Tax::class);
    }
}
