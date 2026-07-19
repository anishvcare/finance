<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Commitment extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'title', 'description', 'type', 'status', 'priority',
        'start_date', 'due_date', 'completed_at', 'progress_percentage',
        'customer_id', 'supplier_id', 'invoice_id', 'bill_id', 'contact_id',
        'amount', 'currency', 'notes', 'tags', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date', 'due_date' => 'date', 'completed_at' => 'datetime',
        'progress_percentage' => 'integer', 'amount' => 'integer', 'tags' => 'array',
    ];

    public function milestones() { return $this->hasMany(CommitmentMilestone::class)->orderBy('sort_order'); }
    public function tasks() { return $this->hasMany(Task::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function contact() { return $this->belongsTo(Contact::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
