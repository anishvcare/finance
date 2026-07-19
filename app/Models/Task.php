<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'title', 'description', 'status', 'priority',
        'due_date', 'due_time', 'completed_at', 'parent_id', 'assignee_id',
        'customer_id', 'supplier_id', 'invoice_id', 'bill_id', 'commitment_id',
        'is_recurring', 'recurrence_rule', 'tags', 'sort_order', 'created_by',
    ];

    protected $casts = [
        'due_date' => 'date', 'completed_at' => 'datetime',
        'is_recurring' => 'boolean', 'tags' => 'array', 'sort_order' => 'integer',
    ];

    public function parent() { return $this->belongsTo(Task::class, 'parent_id'); }
    public function subtasks() { return $this->hasMany(Task::class, 'parent_id'); }
    public function assignee() { return $this->belongsTo(User::class, 'assignee_id'); }
    public function commitment() { return $this->belongsTo(Commitment::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
