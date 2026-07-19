<?php

namespace App\Services;

use App\Models\Workspace;
use App\Models\WorkspaceSettings;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate next invoice number for a workspace (thread-safe).
     */
    public function generateInvoiceNumber(int $workspaceId): string
    {
        return DB::transaction(function () use ($workspaceId) {
            $settings = WorkspaceSettings::where('workspace_id', $workspaceId)
                ->lockForUpdate()
                ->firstOrFail();

            $number = $settings->invoice_next_number;
            $settings->increment('invoice_next_number');

            return $this->formatNumber(
                $settings->invoice_prefix ?? 'INV-',
                $number,
                $settings->invoice_number_digits ?? 5,
                $settings->invoice_include_year ?? false
            );
        });
    }

    /**
     * Generate next quote number for a workspace (thread-safe).
     */
    public function generateQuoteNumber(int $workspaceId): string
    {
        return DB::transaction(function () use ($workspaceId) {
            $settings = WorkspaceSettings::where('workspace_id', $workspaceId)
                ->lockForUpdate()
                ->firstOrFail();

            $number = $settings->quote_next_number;
            $settings->increment('quote_next_number');

            return $this->formatNumber(
                $settings->quote_prefix ?? 'QT-',
                $number,
                5,
                false
            );
        });
    }

    /**
     * Generate next bill number for a workspace (thread-safe).
     */
    public function generateBillNumber(int $workspaceId): string
    {
        return DB::transaction(function () use ($workspaceId) {
            $settings = WorkspaceSettings::where('workspace_id', $workspaceId)
                ->lockForUpdate()
                ->firstOrFail();

            $number = $settings->bill_next_number;
            $settings->increment('bill_next_number');

            return $this->formatNumber(
                $settings->bill_prefix ?? 'BILL-',
                $number,
                5,
                false
            );
        });
    }

    /**
     * Format a document number with prefix, padding, and optional year.
     */
    private function formatNumber(string $prefix, int $number, int $digits, bool $includeYear): string
    {
        $paddedNumber = str_pad((string) $number, $digits, '0', STR_PAD_LEFT);

        if ($includeYear) {
            $year = now()->format('Y');
            return "{$prefix}{$year}-{$paddedNumber}";
        }

        return "{$prefix}{$paddedNumber}";
    }
}
