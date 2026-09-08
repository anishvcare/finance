<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceDueReminder extends Notification
{
    use Queueable;

    public function __construct(private Invoice $invoice, private string $type = 'due_soon') {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->type === 'overdue'
            ? "Invoice {$this->invoice->invoice_number} is overdue"
            : "Invoice {$this->invoice->invoice_number} is due soon";

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},")
            ->line($this->type === 'overdue'
                ? "Invoice {$this->invoice->invoice_number} for {$this->invoice->customer->name} is now overdue."
                : "Invoice {$this->invoice->invoice_number} for {$this->invoice->customer->name} is due on {$this->invoice->due_date->format('d M Y')}.")
            ->line("Amount due: " . number_format($this->invoice->balance_due / 100, 2) . " {$this->invoice->currency}")
            ->action('View Invoice', url("/app/invoices/{$this->invoice->id}"))
            ->line('Please ensure timely follow-up.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'invoice_reminder',
            'subtype' => $this->type,
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'customer_name' => $this->invoice->customer->name ?? '',
            'amount' => $this->invoice->balance_due,
            'currency' => $this->invoice->currency,
            'due_date' => $this->invoice->due_date->toDateString(),
            'message' => $this->type === 'overdue'
                ? "Invoice {$this->invoice->invoice_number} is overdue"
                : "Invoice {$this->invoice->invoice_number} due {$this->invoice->due_date->format('d M')}",
        ];
    }
}
