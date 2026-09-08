<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;

class PaymentAllocationService
{
    /**
     * Allocate a payment to one or more invoices.
     */
    public function allocateToInvoices(Payment $payment, array $allocations): void
    {
        DB::transaction(function () use ($payment, $allocations) {
            $totalAllocated = 0;

            foreach ($allocations as $allocation) {
                $invoiceId = $allocation['invoice_id'];
                $amount = (int) $allocation['amount'];

                $invoice = Invoice::where('id', $invoiceId)
                    ->where('workspace_id', $payment->workspace_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Validate allocation doesn't exceed balance
                if ($amount > $invoice->balance_due) {
                    throw new \InvalidArgumentException(
                        "Allocation amount ({$amount}) exceeds invoice balance due ({$invoice->balance_due})"
                    );
                }

                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoiceId,
                    'amount' => $amount,
                ]);

                // Update invoice
                $invoice->amount_paid += $amount;
                $invoice->balance_due -= $amount;
                $invoice->status = $this->determineInvoiceStatus($invoice);

                if ($invoice->balance_due <= 0) {
                    $invoice->paid_at = now();
                }

                $invoice->save();
                $totalAllocated += $amount;
            }

            // Validate total doesn't exceed payment
            if ($totalAllocated > $payment->amount) {
                throw new \InvalidArgumentException(
                    "Total allocation ({$totalAllocated}) exceeds payment amount ({$payment->amount})"
                );
            }
        });
    }

    /**
     * Allocate a payment to one or more bills.
     */
    public function allocateToBills(Payment $payment, array $allocations): void
    {
        DB::transaction(function () use ($payment, $allocations) {
            $totalAllocated = 0;

            foreach ($allocations as $allocation) {
                $billId = $allocation['bill_id'];
                $amount = (int) $allocation['amount'];

                $bill = Bill::where('id', $billId)
                    ->where('workspace_id', $payment->workspace_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($amount > $bill->balance_due) {
                    throw new \InvalidArgumentException(
                        "Allocation amount ({$amount}) exceeds bill balance due ({$bill->balance_due})"
                    );
                }

                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'bill_id' => $billId,
                    'amount' => $amount,
                ]);

                $bill->amount_paid += $amount;
                $bill->balance_due -= $amount;
                $bill->status = $this->determineBillStatus($bill);
                $bill->save();

                $totalAllocated += $amount;
            }

            if ($totalAllocated > $payment->amount) {
                throw new \InvalidArgumentException(
                    "Total allocation ({$totalAllocated}) exceeds payment amount ({$payment->amount})"
                );
            }
        });
    }

    /**
     * Record a refund against an invoice.
     */
    public function recordRefund(Invoice $invoice, int $amount, array $paymentData): Payment
    {
        return DB::transaction(function () use ($invoice, $amount, $paymentData) {
            $payment = Payment::create(array_merge($paymentData, [
                'workspace_id' => $invoice->workspace_id,
                'type' => 'incoming',
                'customer_id' => $invoice->customer_id,
                'amount' => $amount,
                'is_refund' => true,
            ]));

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => -$amount, // Negative for refund
            ]);

            $invoice->amount_paid -= $amount;
            $invoice->balance_due += $amount;
            $invoice->status = $this->determineInvoiceStatus($invoice);
            $invoice->paid_at = null;
            $invoice->save();

            return $payment;
        });
    }

    private function determineInvoiceStatus(Invoice $invoice): string
    {
        if ($invoice->balance_due <= 0) {
            return 'paid';
        }

        if ($invoice->amount_paid > 0) {
            return 'partially_paid';
        }

        if ($invoice->due_date && $invoice->due_date->isPast()) {
            return 'overdue';
        }

        return $invoice->status;
    }

    private function determineBillStatus(Bill $bill): string
    {
        if ($bill->balance_due <= 0) {
            return 'paid';
        }

        if ($bill->amount_paid > 0) {
            return 'partially_paid';
        }

        if ($bill->due_date && $bill->due_date->isPast()) {
            return 'overdue';
        }

        return $bill->status;
    }
}
