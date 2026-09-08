<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommitmentMilestone extends Model
{
    protected $fillable = [
        'commitment_id', 'title', 'description', 'due_date', 'completed_at', 'sort_order',
    ];

    protected $casts = ['due_date' => 'date', 'completed_at' => 'datetime', 'sort_order' => 'integer'];

    public function commitment() { return $this->belongsTo(Commitment::class); }
}
