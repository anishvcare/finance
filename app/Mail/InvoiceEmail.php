<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\WorkspaceSettings;
use App\Services\PdfGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $customSubject = '',
        public string $customBody = '',
    ) {}

    public function envelope(): Envelope
    {
        $settings = WorkspaceSettings::where('workspace_id', $this->invoice->workspace_id)->first();
        $businessName = $settings?->business_name ?? config('app.name');

        $subject = $this->customSubject ?: "Invoice {$this->invoice->invoice_number} from {$businessName}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.invoice', with: [
            'invoice' => $this->invoice,
            'customer' => $this->invoice->customer,
            'settings' => WorkspaceSettings::where('workspace_id', $this->invoice->workspace_id)->first(),
            'customBody' => $this->customBody,
        ]);
    }

    public function attachments(): array
    {
        $pdfService = app(PdfGenerationService::class);
        $path = $pdfService->generateInvoicePdf($this->invoice);

        return [
            Attachment::fromStorageDisk('private', $path)
                ->as("{$this->invoice->invoice_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
