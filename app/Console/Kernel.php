<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Process queued jobs (for cPanel without Supervisor)
        $schedule->command('queue:work --stop-when-empty --max-time=55')
            ->everyMinute()
            ->withoutOverlapping();

        // Check for overdue invoices daily
        $schedule->command('invoices:check-overdue')
            ->dailyAt('08:00');

        // Send invoice due reminders
        $schedule->command('reminders:send-invoice-due')
            ->dailyAt('09:00');

        // Send task due reminders
        $schedule->command('reminders:send-task-due')
            ->dailyAt('08:00');

        // Check expired quotes
        $schedule->command('quotes:check-expired')
            ->dailyAt('00:05');

        // Clean expired share links
        $schedule->command('invoices:clean-expired-links')
            ->weekly();

        // Clean old activity logs (keep 90 days)
        $schedule->command('logs:clean --days=90')
            ->monthly();
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
    }
}
