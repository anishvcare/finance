<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use BelongsToWorkspace;

    protected $fillable = [
        'workspace_id', 'name', 'type', 'parent_id',
        'color', 'icon', 'is_system', 'sort_order',
    ];

    protected $casts = ['is_system' => 'boolean', 'sort_order' => 'integer'];

    public function parent() { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children() { return $this->hasMany(Category::class, 'parent_id'); }
}
