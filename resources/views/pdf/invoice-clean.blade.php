<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; color: #333; line-height: 1.5; }
        .container { padding: 30px; }
        .header { display: table; width: 100%; margin-bottom: 30px; }
        .header-left { display: table-cell; width: 50%; vertical-align: top; }
        .header-right { display: table-cell; width: 50%; vertical-align: top; text-align: right; }
        .logo { max-width: 150px; max-height: 60px; }
        .company-name { font-size: 16pt; font-weight: bold; color: #1a1a1a; }
        .company-details { font-size: 8pt; color: #666; margin-top: 5px; }
        .invoice-title { font-size: 20pt; font-weight: bold; color: {{ $settings->accent_color ?? '#2563EB' }}; margin-bottom: 10px; }
        .invoice-meta { font-size: 9pt; }
        .invoice-meta table { margin-left: auto; }
        .invoice-meta td { padding: 2px 0; }
        .invoice-meta td:first-child { font-weight: bold; padding-right: 15px; color: #555; }
        .customer-section { display: table; width: 100%; margin-bottom: 25px; }
        .bill-to { display: table-cell; width: 50%; vertical-align: top; }
        .bill-to h3 { font-size: 9pt; font-weight: bold; color: #999; text-transform: uppercase; margin-bottom: 5px; }
        .bill-to p { font-size: 9pt; color: #333; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.items th { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 8pt; text-transform: uppercase; color: #555; font-weight: bold; text-align: left; }
        table.items td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 9pt; vertical-align: top; }
        table.items tr:nth-child(even) td { background: #fafafa; }
        .text-right { text-align: right; }
        .totals { width: 300px; margin-left: auto; margin-bottom: 30px; }
        .totals table { width: 100%; }
        .totals td { padding: 5px 0; font-size: 9pt; }
        .totals .total-row td { font-size: 12pt; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; }
        .totals .balance-row td { font-size: 11pt; font-weight: bold; color: {{ $settings->accent_color ?? '#2563EB' }}; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
        .footer-section { margin-bottom: 15px; }
        .footer-section h4 { font-size: 9pt; font-weight: bold; color: #555; margin-bottom: 5px; }
        .footer-section p { font-size: 8pt; color: #666; }
        .signatures { display: table; width: 100%; margin-top: 30px; }
        .signature-block { display: table-cell; width: 50%; text-align: center; }
        .signature-img { max-width: 120px; max-height: 50px; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                @if($logo_url && file_exists($logo_url))
                    <img src="{{ $logo_url }}" class="logo" alt="Logo">
                @endif
                <div class="company-name">{{ $settings->business_name ?? $settings->owner_name ?? '' }}</div>
                <div class="company-details">
                    @if($settings->address_line_1){{ $settings->address_line_1 }}<br>@endif
                    @if($settings->city){{ $settings->city }}, @endif
                    @if($settings->state){{ $settings->state }} @endif
                    @if($settings->postal_code){{ $settings->postal_code }}@endif
                    @if($settings->country)<br>{{ $settings->country }}@endif
                    @if($settings->phone)<br>Phone: {{ $settings->phone }}@endif
                    @if($settings->email)<br>{{ $settings->email }}@endif
                    @if($settings->tax_number)<br>Tax: {{ $settings->tax_number }}@endif
                </div>
            </div>
            <div class="header-right">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                    <table>
                        <tr><td>Invoice #:</td><td>{{ $invoice->invoice_number }}</td></tr>
                        <tr><td>Date:</td><td>{{ $invoice->invoice_date->format('d M Y') }}</td></tr>
                        <tr><td>Due Date:</td><td>{{ $invoice->due_date->format('d M Y') }}</td></tr>
                        @if($invoice->reference_number)<tr><td>Reference:</td><td>{{ $invoice->reference_number }}</td></tr>@endif
                        @if($invoice->purchase_order)<tr><td>PO #:</td><td>{{ $invoice->purchase_order }}</td></tr>@endif
                    </table>
                </div>
            </div>
        </div>

        <!-- Customer -->
        <div class="customer-section">
            <div class="bill-to">
                <h3>Bill To</h3>
                <p>
                    <strong>{{ $customer->business_name ?? $customer->name }}</strong><br>
                    @if($customer->contact_person && $customer->business_name){{ $customer->contact_person }}<br>@endif
                    @if($customer->billing_address_line_1){{ $customer->billing_address_line_1 }}<br>@endif
                    @if($customer->billing_city){{ $customer->billing_city }}, @endif
                    @if($customer->billing_state){{ $customer->billing_state }} @endif
                    @if($customer->billing_postal_code){{ $customer->billing_postal_code }}@endif
                    @if($customer->email)<br>{{ $customer->email }}@endif
                    @if($customer->tax_number)<br>Tax: {{ $customer->tax_number }}@endif
                </p>
            </div>
        </div>

        <!-- Line Items -->
        <table class="items">
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 35%">Description</th>
                    <th style="width: 10%" class="text-right">Qty</th>
                    <th style="width: 8%">Unit</th>
                    <th style="width: 14%" class="text-right">Price</th>
                    <th style="width: 10%" class="text-right">Tax</th>
                    <th style="width: 18%" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->name }}</strong>
                        @if($item->description)<br><span style="font-size: 8pt; color: #666;">{{ $item->description }}</span>@endif
                    </td>
                    <td class="text-right">{{ number_format($item->quantity, $item->quantity == intval($item->quantity) ? 0 : 2) }}</td>
                    <td>{{ $item->unit }}</td>
                    <td class="text-right">{{ number_format($item->unit_price / 100, 2) }}</td>
                    <td class="text-right">{{ $item->tax_rate > 0 ? number_format($item->tax_rate, 1) . '%' : '-' }}</td>
                    <td class="text-right">{{ number_format($item->line_total / 100, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <table>
                <tr><td>Subtotal:</td><td class="text-right">{{ number_format($invoice->subtotal / 100, 2) }}</td></tr>
                @if($invoice->discount_amount > 0)
                <tr><td>Discount:</td><td class="text-right">-{{ number_format($invoice->discount_amount / 100, 2) }}</td></tr>
                @endif
                @if($invoice->tax_amount > 0)
                <tr><td>Tax:</td><td class="text-right">{{ number_format($invoice->tax_amount / 100, 2) }}</td></tr>
                @endif
                @if($invoice->shipping_amount > 0)
                <tr><td>Shipping:</td><td class="text-right">{{ number_format($invoice->shipping_amount / 100, 2) }}</td></tr>
                @endif
                @if($invoice->round_off != 0)
                <tr><td>Round Off:</td><td class="text-right">{{ number_format($invoice->round_off / 100, 2) }}</td></tr>
                @endif
                <tr class="total-row"><td>Total:</td><td class="text-right">{{ $invoice->currency }} {{ number_format($invoice->total / 100, 2) }}</td></tr>
                @if($invoice->amount_paid > 0)
                <tr><td>Amount Paid:</td><td class="text-right">{{ number_format($invoice->amount_paid / 100, 2) }}</td></tr>
                @endif
                @if($invoice->balance_due > 0)
                <tr class="balance-row"><td>Balance Due:</td><td class="text-right">{{ $invoice->currency }} {{ number_format($invoice->balance_due / 100, 2) }}</td></tr>
                @endif
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            @if($invoice->payment_instructions ?? $settings->payment_instructions)
            <div class="footer-section">
                <h4>Payment Instructions</h4>
                <p>{!! nl2br(e($invoice->payment_instructions ?? $settings->payment_instructions)) !!}</p>
            </div>
            @endif

            @if($invoice->notes)
            <div class="footer-section">
                <h4>Notes</h4>
                <p>{{ $invoice->notes }}</p>
            </div>
            @endif

            @if($invoice->terms ?? $settings->default_terms)
            <div class="footer-section">
                <h4>Terms & Conditions</h4>
                <p>{{ $invoice->terms ?? $settings->default_terms }}</p>
            </div>
            @endif
        </div>

        @if(($signature_url && file_exists($signature_url)) || ($stamp_url && file_exists($stamp_url)))
        <div class="signatures">
            @if($signature_url && file_exists($signature_url))
            <div class="signature-block">
                <img src="{{ $signature_url }}" class="signature-img" alt="Signature">
                <br><span style="font-size: 8pt; color: #666;">Authorized Signature</span>
            </div>
            @endif
            @if($stamp_url && file_exists($stamp_url))
            <div class="signature-block">
                <img src="{{ $stamp_url }}" class="signature-img" alt="Stamp">
            </div>
            @endif
        </div>
        @endif
    </div>
</body>
</html>
