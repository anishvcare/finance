<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    protected $fillable = [
        'workspace_id', 'name', 'company', 'email', 'mobile', 'phone', 'website',
        'city', 'state', 'country', 'channel', 'category', 'stage', 'priority',
        'estimated_value', 'currency', 'assigned_to', 'next_follow_up_date',
        'last_contacted_at', 'notes', 'tags', 'converted_customer_id', 'created_by',
    ];

    protected $casts = [
        'estimated_value' => 'integer',
        'next_follow_up_date' => 'date',
        'last_contacted_at' => 'date',
        'tags' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
