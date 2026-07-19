<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'workspace_id', 'plan_id', 'status', 'started_at', 'expires_at', 'cancelled_at',
    ];

    protected $casts = [
        'started_at' => 'datetime', 'expires_at' => 'datetime', 'cancelled_at' => 'datetime',
    ];

    public function workspace() { return $this->belongsTo(Workspace::class); }
    public function plan() { return $this->belongsTo(Plan::class); }

    public function isActive(): bool { return $this->status === 'active'; }
}
