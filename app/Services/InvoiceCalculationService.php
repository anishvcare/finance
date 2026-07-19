<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;

class InvoiceCalculationService
{
    /**
     * Calculate line item totals.
     * All amounts in minor units (cents).
     */
    public function calculateLineItem(array $item): array
    {
        $quantity = (float) ($item['quantity'] ?? 1);
        $unitPrice = (int) ($item['unit_price'] ?? 0);
        $discountRate = (float) ($item['discount_rate'] ?? 0);
        $taxRate = (float) ($item['tax_rate'] ?? 0);
        $taxInclusive = (bool) ($item['tax_inclusive'] ?? false);

        // Line amount before discount
        $lineAmount = (int) round($quantity * $unitPrice);

        // Calculate discount
        $discountAmount = 0;
        if ($discountRate > 0) {
            $discountAmount = (int) round($lineAmount * ($discountRate / 100));
        } elseif (isset($item['discount_amount']) && $item['discount_amount'] > 0) {
            $discountAmount = (int) $item['discount_amount'];
        }

        // Amount after discount
        $amountAfterDiscount = $lineAmount - $discountAmount;

        // Tax calculation
        $taxAmount = 0;
        $lineTotal = 0;

        if ($taxInclusive) {
            // Tax is included in the price
            $taxableAmount = (int) round($amountAfterDiscount / (1 + $taxRate / 100));
            $taxAmount = $amountAfterDiscount - $taxableAmount;
            $lineTotal = $amountAfterDiscount;
        } else {
            // Tax is exclusive (added on top)
            $taxAmount = (int) round($amountAfterDiscount * ($taxRate / 100));
            $lineTotal = $amountAfterDiscount + $taxAmount;
        }

        return [
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount_rate' => $discountRate,
            'discount_amount' => $discountAmount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'line_total' => $lineTotal,
        ];
    }

    /**
     * Calculate document totals from line items.
     */
    public function calculateDocumentTotals(array $items, array $documentData = []): array
    {
        $subtotal = 0;
        $totalTax = 0;
        $calculatedItems = [];

        foreach ($items as $item) {
            $calculated = $this->calculateLineItem($item);
            $subtotal += $calculated['line_total'];
            $totalTax += $calculated['tax_amount'];
            $calculatedItems[] = array_merge($item, $calculated);
        }

        $discountAmount = (int) ($documentData['discount_amount'] ?? 0);
        $shippingAmount = (int) ($documentData['shipping_amount'] ?? 0);
        $additionalCharges = (int) ($documentData['additional_charges'] ?? 0);
        $roundingRule = $documentData['rounding_rule'] ?? 'none';

        $preRoundTotal = $subtotal - $discountAmount + $shippingAmount + $additionalCharges;
        $roundOff = $this->applyRounding($preRoundTotal, $roundingRule);
        $total = $preRoundTotal + $roundOff;

        $amountPaid = (int) ($documentData['amount_paid'] ?? 0);
        $balanceDue = $total - $amountPaid;

        return [
            'items' => $calculatedItems,
            'subtotal' => $subtotal,
            'tax_amount' => $totalTax,
            'discount_amount' => $discountAmount,
            'shipping_amount' => $shippingAmount,
            'additional_charges' => $additionalCharges,
            'round_off' => $roundOff,
            'total' => $total,
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
        ];
    }

    /**
     * Recalculate invoice totals from existing items.
     */
    public function recalculateInvoice(Invoice $invoice): array
    {
        $items = $invoice->items->map(function (InvoiceItem $item) {
            return [
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'discount_rate' => $item->discount_rate,
                'discount_amount' => $item->discount_amount,
                'tax_rate' => $item->tax_rate,
                'tax_inclusive' => false, // stored as exclusive in line items
            ];
        })->toArray();

        return $this->calculateDocumentTotals($items, [
            'discount_amount' => $invoice->discount_amount,
            'shipping_amount' => $invoice->shipping_amount,
            'additional_charges' => $invoice->additional_charges,
            'amount_paid' => $invoice->amount_paid,
        ]);
    }

    /**
     * Apply rounding rules.
     */
    private function applyRounding(int $amount, string $rule): int
    {
        return match ($rule) {
            'none' => 0,
            'nearest_5' => $this->roundToNearest($amount, 5) - $amount,
            'nearest_10' => $this->roundToNearest($amount, 10) - $amount,
            'nearest_50' => $this->roundToNearest($amount, 50) - $amount,
            'nearest_100' => $this->roundToNearest($amount, 100) - $amount,
            'down_100' => (int) (floor($amount / 100) * 100) - $amount,
            'up_100' => (int) (ceil($amount / 100) * 100) - $amount,
            default => 0,
        };
    }

    private function roundToNearest(int $amount, int $nearest): int
    {
        return (int) (round($amount / $nearest) * $nearest);
    }
}
