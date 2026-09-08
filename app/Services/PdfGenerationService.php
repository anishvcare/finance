<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Quote;
use App\Models\WorkspaceSettings;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfGenerationService
{
    /**
     * Generate invoice PDF and return path.
     */
    public function generateInvoicePdf(Invoice $invoice): string
    {
        $invoice->load('items', 'customer', 'workspace.settings');
        $settings = $invoice->workspace->settings;

        $template = $this->getInvoiceTemplate($invoice->template ?? 'clean');

        $data = [
            'invoice' => $invoice,
            'items' => $invoice->items,
            'customer' => $invoice->customer,
            'settings' => $settings,
            'logo_url' => $settings->logo_path ? Storage::url($settings->logo_path) : null,
            'signature_url' => $settings->signature_path ? Storage::url($settings->signature_path) : null,
            'stamp_url' => $settings->stamp_path ? Storage::url($settings->stamp_path) : null,
        ];

        $pdf = Pdf::loadView($template, $data)
            ->setPaper('a4')
            ->setOptions([
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'dpi' => 150,
                'isPhpEnabled' => true,
            ]);

        $filename = "invoices/{$invoice->workspace_id}/{$invoice->invoice_number}.pdf";
        Storage::disk('private')->put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Generate quote PDF and return path.
     */
    public function generateQuotePdf(Quote $quote): string
    {
        $quote->load('items', 'customer', 'workspace.settings');
        $settings = $quote->workspace->settings;

        $data = [
            'quote' => $quote,
            'items' => $quote->items,
            'customer' => $quote->customer,
            'settings' => $settings,
            'logo_url' => $settings->logo_path ? Storage::url($settings->logo_path) : null,
        ];

        $pdf = Pdf::loadView('pdf.quote', $data)
            ->setPaper('a4')
            ->setOptions([
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);

        $filename = "quotes/{$quote->workspace_id}/{$quote->quote_number}.pdf";
        Storage::disk('private')->put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Stream invoice PDF for download.
     */
    public function streamInvoicePdf(Invoice $invoice)
    {
        $invoice->load('items', 'customer', 'workspace.settings');
        $settings = $invoice->workspace->settings;
        $template = $this->getInvoiceTemplate($invoice->template ?? 'clean');

        $data = [
            'invoice' => $invoice,
            'items' => $invoice->items,
            'customer' => $invoice->customer,
            'settings' => $settings,
            'logo_url' => $settings->logo_path ? storage_path('app/public/' . $settings->logo_path) : null,
            'signature_url' => $settings->signature_path ? storage_path('app/public/' . $settings->signature_path) : null,
            'stamp_url' => $settings->stamp_path ? storage_path('app/public/' . $settings->stamp_path) : null,
        ];

        return Pdf::loadView($template, $data)
            ->setPaper('a4')
            ->setOptions([
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ])
            ->download("{$invoice->invoice_number}.pdf");
    }

    private function getInvoiceTemplate(string $template): string
    {
        return match ($template) {
            'modern' => 'pdf.invoice-modern',
            'compact' => 'pdf.invoice-compact',
            default => 'pdf.invoice-clean',
        };
    }
}
