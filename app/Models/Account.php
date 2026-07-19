<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'name', 'type', 'currency', 'opening_balance',
        'current_balance', 'is_default', 'is_active', 'color', 'icon', 'notes',
    ];

    protected $casts = [
        'opening_balance' => 'integer', 'current_balance' => 'integer',
        'is_default' => 'boolean', 'is_active' => 'boolean',
    ];

    public function transactions() { return $this->hasMany(Transaction::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
