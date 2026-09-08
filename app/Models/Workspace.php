<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'type',
        'owner_id',
        'currency',
        'timezone',
        'financial_year_start',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'financial_year_start' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Workspace $workspace) {
            $workspace->uuid = $workspace->uuid ?? Str::uuid()->toString();
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'workspace_members')
            ->withPivot('role', 'accepted_at')
            ->withTimestamps();
    }

    public function settings()
    {
        return $this->hasOne(WorkspaceSettings::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function commitments()
    {
        return $this->hasMany(Commitment::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function taxes()
    {
        return $this->hasMany(Tax::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->where('status', 'active');
    }
}
