<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use BelongsToWorkspace;

    protected $fillable = [
        'workspace_id', 'name', 'code', 'rate', 'type',
        'is_compound', 'is_active', 'description',
    ];

    protected $casts = [
        'rate' => 'decimal:4', 'is_compound' => 'boolean', 'is_active' => 'boolean',
    ];
}
