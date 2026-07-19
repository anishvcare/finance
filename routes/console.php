<?php

use Illuminate\Support\Facades\Schedule;

// Process queued jobs (cPanel without Supervisor)
Schedule::command('queue:work --stop-when-empty --max-time=55')
    ->everyMinute()
    ->withoutOverlapping();

// Check for overdue invoices daily
Schedule::command('invoices:check-overdue')->dailyAt('08:00');

// Send invoice due reminders
Schedule::command('reminders:send-invoice-due')->dailyAt('09:00');
