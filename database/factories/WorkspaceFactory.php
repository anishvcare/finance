<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class WorkspaceFactory extends Factory
{
    protected $model = Workspace::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'name' => fake()->company(),
            'type' => fake()->randomElement(['personal', 'business']),
            'owner_id' => User::factory(),
            'currency' => 'USD',
            'timezone' => 'UTC',
            'financial_year_start' => 1,
            'is_active' => true,
        ];
    }
}
