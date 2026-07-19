<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPrice extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'product_id', 'price_type', 'amount', 'effective_from', 'effective_to', 'created_by',
    ];

    protected $casts = [
        'amount' => 'integer', 'effective_from' => 'date', 'effective_to' => 'date',
    ];

    public function product() { return $this->belongsTo(Product::class); }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }
}
