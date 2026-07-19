<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'name',
        'code',
        'sku',
        'barcode',
        'description',
        'category_id',
        'unit',
        'sales_price',
        'purchase_price',
        'cost_price',
        'wholesale_price',
        'tax_id',
        'tax_inclusive',
        'currency',
        'track_inventory',
        'opening_stock',
        'current_stock',
        'low_stock_level',
        'image_path',
        'is_active',
        'notes',
        'supplier_id',
        'created_by',
    ];

    protected $casts = [
        'sales_price' => 'integer',
        'purchase_price' => 'integer',
        'cost_price' => 'integer',
        'wholesale_price' => 'integer',
        'tax_inclusive' => 'boolean',
        'track_inventory' => 'boolean',
        'opening_stock' => 'decimal:3',
        'current_stock' => 'decimal:3',
        'low_stock_level' => 'decimal:3',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function tax()
    {
        return $this->belongsTo(Tax::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function priceHistory()
    {
        return $this->hasMany(ProductPrice::class)->orderByDesc('effective_from');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isLowStock(): bool
    {
        if (!$this->track_inventory || !$this->low_stock_level) {
            return false;
        }
        return $this->current_stock <= $this->low_stock_level;
    }
}
