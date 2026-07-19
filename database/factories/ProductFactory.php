<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->words(3, true),
            'code' => strtoupper(fake()->bothify('??-####')),
            'unit' => fake()->randomElement(['each', 'piece', 'box', 'kg', 'hour']),
            'sales_price' => fake()->numberBetween(500, 50000),
            'currency' => 'USD',
            'is_active' => true,
            'track_inventory' => false,
            'tax_inclusive' => false,
            'created_by' => User::factory(),
        ];
    }
}
