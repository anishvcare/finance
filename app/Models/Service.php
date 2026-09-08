<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'name',
        'code',
        'description',
        'category_id',
        'unit',
        'hourly_rate',
        'fixed_price',
        'minimum_charge',
        'default_quantity',
        'tax_id',
        'tax_inclusive',
        'currency',
        'estimated_duration',
        'internal_cost',
        'is_active',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'hourly_rate' => 'integer',
        'fixed_price' => 'integer',
        'minimum_charge' => 'integer',
        'default_quantity' => 'decimal:3',
        'tax_inclusive' => 'boolean',
        'internal_cost' => 'integer',
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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getDefaultPrice(): int
    {
        return $this->fixed_price ?? $this->hourly_rate ?? 0;
    }
}
