<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'name', 'email', 'phone', 'mobile',
        'organisation', 'role', 'notes', 'tags',
        'customer_id', 'supplier_id', 'is_active',
    ];

    protected $casts = ['tags' => 'array', 'is_active' => 'boolean'];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
}
