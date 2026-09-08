<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'type' => fake()->randomElement(['individual', 'business']),
            'name' => fake()->name(),
            'business_name' => fake()->optional()->company(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'is_active' => true,
            'payment_terms' => 30,
            'opening_balance' => 0,
            'created_by' => User::factory(),
        ];
    }
}
