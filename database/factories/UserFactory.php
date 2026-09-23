<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'is_super_admin' => false,
            'is_active' => true,
            'onboarding_completed' => true,
            // Default to an activated account: the factory should produce a
            // user that can actually use the app. Use unactivated() for the
            // just-signed-up state.
            'activated_at' => now(),
            'timezone' => 'UTC',
            'date_format' => 'Y-m-d',
            'remember_token' => Str::random(10),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn() => ['is_super_admin' => true]);
    }

    public function suspended(): static
    {
        return $this->state(fn() => ['is_active' => false]);
    }

    /** A freshly registered account that has not redeemed an activation code. */
    public function unactivated(): static
    {
        return $this->state(fn() => [
            'activated_at' => null,
            'onboarding_completed' => false,
        ]);
    }
}
