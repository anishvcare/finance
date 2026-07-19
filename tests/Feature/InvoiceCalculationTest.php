<?php

namespace Tests\Feature;

use App\Services\InvoiceCalculationService;
use Tests\TestCase;

class InvoiceCalculationTest extends TestCase
{
    private InvoiceCalculationService $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new InvoiceCalculationService();
    }

    public function test_line_item_calculation_basic(): void
    {
        $result = $this->calculator->calculateLineItem([
            'quantity' => 2,
            'unit_price' => 5000, // $50.00
            'discount_rate' => 0,
            'tax_rate' => 0,
            'tax_inclusive' => false,
        ]);

        $this->assertEquals(5000, $result['unit_price']);
        $this->assertEquals(0, $result['discount_amount']);
        $this->assertEquals(0, $result['tax_amount']);
        $this->assertEquals(10000, $result['line_total']); // $100.00
    }

    public function test_line_item_with_discount(): void
    {
        $result = $this->calculator->calculateLineItem([
            'quantity' => 1,
            'unit_price' => 10000, // $100.00
            'discount_rate' => 10,
            'tax_rate' => 0,
            'tax_inclusive' => false,
        ]);

        $this->assertEquals(1000, $result['discount_amount']); // $10.00
        $this->assertEquals(9000, $result['line_total']); // $90.00
    }

    public function test_line_item_with_tax_exclusive(): void
    {
        $result = $this->calculator->calculateLineItem([
            'quantity' => 1,
            'unit_price' => 10000, // $100.00
            'discount_rate' => 0,
            'tax_rate' => 10,
            'tax_inclusive' => false,
        ]);

        $this->assertEquals(1000, $result['tax_amount']); // $10.00
        $this->assertEquals(11000, $result['line_total']); // $110.00
    }

    public function test_line_item_with_tax_inclusive(): void
    {
        $result = $this->calculator->calculateLineItem([
            'quantity' => 1,
            'unit_price' => 11000, // $110.00 (tax inclusive)
            'discount_rate' => 0,
            'tax_rate' => 10,
            'tax_inclusive' => true,
        ]);

        $this->assertEquals(1000, $result['tax_amount']); // $10.00
        $this->assertEquals(11000, $result['line_total']); // $110.00 (total = price when inclusive)
    }

    public function test_line_item_with_discount_and_tax(): void
    {
        $result = $this->calculator->calculateLineItem([
            'quantity' => 3,
            'unit_price' => 2000, // $20.00
            'discount_rate' => 10,
            'tax_rate' => 18,
            'tax_inclusive' => false,
        ]);

        // Line amount: 3 * 2000 = 6000
        // Discount: 6000 * 10% = 600
        // After discount: 5400
        // Tax: 5400 * 18% = 972
        // Total: 5400 + 972 = 6372
        $this->assertEquals(6000, 3 * 2000);
        $this->assertEquals(600, $result['discount_amount']);
        $this->assertEquals(972, $result['tax_amount']);
        $this->assertEquals(6372, $result['line_total']);
    }

    public function test_document_totals_calculation(): void
    {
        $items = [
            ['quantity' => 2, 'unit_price' => 5000, 'discount_rate' => 0, 'tax_rate' => 10, 'tax_inclusive' => false, 'type' => 'product', 'name' => 'A'],
            ['quantity' => 1, 'unit_price' => 8000, 'discount_rate' => 5, 'tax_rate' => 10, 'tax_inclusive' => false, 'type' => 'service', 'name' => 'B'],
        ];

        $result = $this->calculator->calculateDocumentTotals($items, []);

        // Item 1: 2*5000=10000, tax=1000, total=11000
        // Item 2: 1*8000=8000, disc=400, after=7600, tax=760, total=8360
        // Subtotal: 11000 + 8360 = 19360
        $this->assertEquals(19360, $result['subtotal']);
        $this->assertEquals(1760, $result['tax_amount']); // 1000 + 760
        $this->assertEquals(19360, $result['total']);
        $this->assertEquals(19360, $result['balance_due']);
    }

    public function test_no_floating_point_errors(): void
    {
        // Classic floating point problem: $19.99 * 3
        $result = $this->calculator->calculateLineItem([
            'quantity' => 3,
            'unit_price' => 1999, // $19.99 in cents
            'discount_rate' => 0,
            'tax_rate' => 0,
            'tax_inclusive' => false,
        ]);

        $this->assertEquals(5997, $result['line_total']); // $59.97 exactly
    }

    public function test_large_invoice_accuracy(): void
    {
        $items = [];
        for ($i = 0; $i < 100; $i++) {
            $items[] = [
                'quantity' => 1,
                'unit_price' => 999, // $9.99
                'discount_rate' => 0,
                'tax_rate' => 10,
                'tax_inclusive' => false,
                'type' => 'product',
                'name' => "Item {$i}",
            ];
        }

        $result = $this->calculator->calculateDocumentTotals($items, []);

        // Each item: 999 + tax(100) = 1099
        // 100 items: 109900
        $this->assertEquals(109900, $result['subtotal']);
    }

    public function test_balance_due_with_payment(): void
    {
        $items = [
            ['quantity' => 1, 'unit_price' => 10000, 'discount_rate' => 0, 'tax_rate' => 0, 'tax_inclusive' => false, 'type' => 'custom', 'name' => 'X'],
        ];

        $result = $this->calculator->calculateDocumentTotals($items, [
            'amount_paid' => 3000,
        ]);

        $this->assertEquals(10000, $result['total']);
        $this->assertEquals(3000, $result['amount_paid']);
        $this->assertEquals(7000, $result['balance_due']);
    }
}
