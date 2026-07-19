<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $total = fake()->numberBetween(5000, 500000);
        return [
            'workspace_id' => Workspace::factory(),
            'invoice_number' => 'INV-' . str_pad(fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'customer_id' => Customer::factory(),
            'status' => 'draft',
            'invoice_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'currency' => 'USD',
            'payment_terms' => 30,
            'subtotal' => $total,
            'discount_amount' => 0,
            'shipping_amount' => 0,
            'tax_amount' => 0,
            'additional_charges' => 0,
            'round_off' => 0,
            'total' => $total,
            'amount_paid' => 0,
            'balance_due' => $total,
            'template' => 'clean',
            'created_by' => User::factory(),
        ];
    }

    public function finalised(): static
    {
        return $this->state(fn() => ['status' => 'finalised', 'finalised_at' => now()]);
    }

    public function paid(): static
    {
        return $this->state(fn(array $attrs) => [
            'status' => 'paid',
            'amount_paid' => $attrs['total'],
            'balance_due' => 0,
            'paid_at' => now(),
        ]);
    }
}
