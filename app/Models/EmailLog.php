<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'workspace_id', 'to_email', 'to_name', 'subject', 'type',
        'related_type', 'related_id', 'status', 'error_message', 'sent_at',
    ];

    protected $casts = ['sent_at' => 'datetime'];

    public function related() { return $this->morphTo(); }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }
}
