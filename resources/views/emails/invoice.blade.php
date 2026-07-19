<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px; color: #1a1a1a;">{{ $settings?->business_name ?? config('app.name') }}</h2>
        <p style="margin: 0; color: #666; font-size: 14px;">Invoice {{ $invoice->invoice_number }}</p>
    </div>

    <p>Hi {{ $customer->contact_person ?? $customer->name }},</p>

    @if($customBody)
        <p>{{ $customBody }}</p>
    @else
        <p>Please find attached invoice <strong>{{ $invoice->invoice_number }}</strong> for your reference.</p>
    @endif

    <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 5px 0; color: #666;">Invoice Number:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">{{ $invoice->invoice_number }}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Date:</td><td style="padding: 5px 0; text-align: right;">{{ $invoice->invoice_date->format('d M Y') }}</td></tr>
            <tr><td style="padding: 5px 0; color: #666;">Due Date:</td><td style="padding: 5px 0; text-align: right;">{{ $invoice->due_date->format('d M Y') }}</td></tr>
            <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 5px; color: #666; font-weight: 600;">Amount Due:</td><td style="padding: 10px 0 5px; text-align: right; font-weight: 700; font-size: 18px; color: #2563eb;">{{ $invoice->currency }} {{ number_format($invoice->balance_due / 100, 2) }}</td></tr>
        </table>
    </div>

    @if($settings?->payment_instructions)
        <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 5px; font-weight: 600; font-size: 13px; color: #1e40af;">Payment Instructions</p>
            <p style="margin: 0; font-size: 13px; color: #374151;">{{ $settings->payment_instructions }}</p>
        </div>
    @endif

    <p style="font-size: 13px; color: #666;">The invoice PDF is attached to this email for your records.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #999; margin: 0;">
        {{ $settings?->business_name ?? config('app.name') }}<br>
        @if($settings?->email){{ $settings->email }}<br>@endif
        @if($settings?->phone){{ $settings->phone }}@endif
    </p>
</body>
</html>
