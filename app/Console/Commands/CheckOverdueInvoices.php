<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\User;
use App\Notifications\InvoiceDueReminder;
use Illuminate\Console\Command;

class CheckOverdueInvoices extends Command
{
    protected $signature = 'invoices:check-overdue';
    protected $description = 'Mark overdue invoices and send notifications';

    public function handle(): int
    {
        $overdueInvoices = Invoice::where('balance_due', '>', 0)
            ->whereIn('status', ['finalised', 'sent', 'viewed', 'partially_paid'])
            ->where('due_date', '<', today())
            ->get();

        $count = 0;
        foreach ($overdueInvoices as $invoice) {
            if ($invoice->status !== 'overdue') {
                $invoice->update(['status' => 'overdue']);

                // Notify workspace owner
                $owner = User::find($invoice->workspace->owner_id);
                if ($owner) {
                    $owner->notify(new InvoiceDueReminder($invoice, 'overdue'));
                }
                $count++;
            }
        }

        $this->info("Marked {$count} invoices as overdue.");
        return Command::SUCCESS;
    }
}
