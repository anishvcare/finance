<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'is_super_admin',
        'is_active',
        'onboarding_completed',
        'timezone',
        'date_format',
        'current_workspace_id',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'is_super_admin' => 'boolean',
        'is_active' => 'boolean',
        'onboarding_completed' => 'boolean',
    ];

    public function workspaces()
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
            ->withPivot('role', 'accepted_at')
            ->withTimestamps();
    }

    public function ownedWorkspaces()
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    public function currentWorkspace()
    {
        return $this->belongsTo(Workspace::class, 'current_workspace_id');
    }

    public function belongsToWorkspace(int $workspaceId): bool
    {
        return $this->workspaces()->where('workspaces.id', $workspaceId)->exists();
    }

    public function workspaceRole(int $workspaceId): ?string
    {
        $member = $this->workspaces()->where('workspaces.id', $workspaceId)->first();
        return $member?->pivot?->role;
    }

    public function hasWorkspaceRole(int $workspaceId, array $roles): bool
    {
        $role = $this->workspaceRole($workspaceId);
        return $role && in_array($role, $roles);
    }

    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin;
    }
}
