<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\User;
use App\Notifications\InvoiceDueReminder;
use Illuminate\Console\Command;

class SendInvoiceDueReminders extends Command
{
    protected $signature = 'reminders:send-invoice-due';
    protected $description = 'Send reminders for invoices due in 1, 3, 7 days';

    public function handle(): int
    {
        $dueSoon = Invoice::where('balance_due', '>', 0)
            ->whereIn('status', ['finalised', 'sent', 'viewed', 'partially_paid'])
            ->whereIn('due_date', [
                today()->addDay()->toDateString(),
                today()->addDays(3)->toDateString(),
                today()->addDays(7)->toDateString(),
            ])
            ->with('workspace', 'customer')
            ->get();

        $count = 0;
        foreach ($dueSoon as $invoice) {
            $owner = User::find($invoice->workspace->owner_id);
            if ($owner) {
                // Check we haven't already sent a reminder today
                $alreadySent = $owner->notifications()
                    ->where('data->invoice_id', $invoice->id)
                    ->where('data->subtype', 'due_soon')
                    ->where('created_at', '>=', today())
                    ->exists();

                if (!$alreadySent) {
                    $owner->notify(new InvoiceDueReminder($invoice, 'due_soon'));
                    $count++;
                }
            }
        }

        $this->info("Sent {$count} invoice due reminders.");
        return Command::SUCCESS;
    }
}
