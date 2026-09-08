<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    @php $accent = $settings->accent_color ?? '#2563EB'; @endphp
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; color: #333; line-height: 1.5; }
        .band { height: 8px; background: {{ $accent }}; }
        .container { padding: 32px 36px; }
        .header { display: table; width: 100%; margin-bottom: 26px; }
        .header-left { display: table-cell; width: 58%; vertical-align: top; }
        .header-right { display: table-cell; width: 42%; vertical-align: top; text-align: right; }
        .logo { max-width: 170px; max-height: 70px; margin-bottom: 8px; }
        .company-name { font-size: 15pt; font-weight: bold; color: #1a1a1a; }
        .company-details { font-size: 8.5pt; color: #666; margin-top: 4px; }
        .doc-title { font-size: 24pt; font-weight: bold; color: {{ $accent }}; letter-spacing: 1px; }
        .meta { margin-top: 10px; font-size: 9pt; }
        .meta table { margin-left: auto; }
        .meta td { padding: 2px 0; }
        .meta td:first-child { font-weight: bold; padding-right: 14px; color: #777; text-align: right; }
        .parties { display: table; width: 100%; margin-bottom: 22px; }
        .party { display: table-cell; width: 50%; vertical-align: top; }
        .party h3 { font-size: 8pt; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .party p { font-size: 9pt; color: #333; }
        .msg { margin-bottom: 18px; font-size: 9pt; color: #444; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        table.items thead th { background: {{ $accent }}; color: #fff; padding: 9px 10px; font-size: 8pt; text-transform: uppercase; letter-spacing: .4px; text-align: left; }
        table.items tbody td { border-bottom: 1px solid #eee; padding: 8px 10px; font-size: 9pt; vertical-align: top; }
        .text-right { text-align: right; }
        .totals { width: 46%; margin-left: auto; margin-bottom: 10px; }
        .totals table { width: 100%; }
        .totals td { padding: 4px 2px; font-size: 9.5pt; }
        .totals td:first-child { color: #666; }
        .totals .total-row td { font-size: 12pt; font-weight: bold; border-top: 2px solid {{ $accent }}; padding-top: 8px; color: #1a1a1a; }
        .section { margin-top: 18px; }
        .section h4 { font-size: 8.5pt; font-weight: bold; color: {{ $accent }}; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
        .section p { font-size: 8.5pt; color: #555; }
        .validity { margin-top: 16px; padding: 10px 14px; background: #f7f9fc; border-left: 3px solid {{ $accent }}; font-size: 8.5pt; color: #555; }
        .signatures { display: table; width: 100%; margin-top: 40px; }
        .sig-block { display: table-cell; width: 50%; vertical-align: bottom; text-align: center; }
        .sig-img { max-width: 130px; max-height: 55px; }
        .sig-label { font-size: 8pt; color: #777; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 4px; display: inline-block; min-width: 150px; }
        .doc-footer { margin-top: 34px; padding-top: 12px; border-top: 1px solid #eee; text-align: center; font-size: 8pt; color: #999; }
    </style>
</head>
<body>
    <div class="band"></div>
    <div class="container">
        <div class="header">
            <div class="header-left">
                @if($logo_url && file_exists($logo_url))
                    <img src="{{ $logo_url }}" class="logo" alt="Logo">
                @endif
                <div class="company-name">{{ $settings->business_name ?? $settings->owner_name ?? '' }}</div>
                <div class="company-details">
                    @if($settings->address_line_1){{ $settings->address_line_1 }}<br>@endif
                    @if($settings->address_line_2){{ $settings->address_line_2 }}<br>@endif
                    @if($settings->city){{ $settings->city }}@endif @if($settings->state), {{ $settings->state }}@endif @if($settings->postal_code) {{ $settings->postal_code }}@endif
                    @if($settings->country)<br>{{ $settings->country }}@endif
                    @if($settings->mobile ?? $settings->phone)<br>Mobile: {{ $settings->mobile ?? $settings->phone }}@endif
                    @if($settings->email)<br>{{ $settings->email }}@endif
                    @if($settings->gst_number)<br>GSTIN: {{ $settings->gst_number }}@elseif($settings->tax_number)<br>Tax No: {{ $settings->tax_number }}@endif
                </div>
            </div>
            <div class="header-right">
                <div class="doc-title">QUOTATION</div>
                <div class="meta">
                    <table>
                        <tr><td>Quote #</td><td>{{ $quote->quote_number }}</td></tr>
                        <tr><td>Date</td><td>{{ $quote->quote_date->format('d M Y') }}</td></tr>
                        @if($quote->expiry_date)<tr><td>Valid Until</td><td>{{ $quote->expiry_date->format('d M Y') }}</td></tr>@endif
                    </table>
                </div>
            </div>
        </div>

        <div class="parties">
            <div class="party">
                <h3>Prepared For</h3>
                <p>
                    <strong>{{ $customer->business_name ?? $customer->name }}</strong><br>
                    @if($customer->contact_person && $customer->business_name){{ $customer->contact_person }}<br>@endif
                    @if($customer->billing_address_line_1){{ $customer->billing_address_line_1 }}<br>@endif
                    @if($customer->billing_city){{ $customer->billing_city }}@endif @if($customer->billing_state), {{ $customer->billing_state }}@endif @if($customer->billing_postal_code) {{ $customer->billing_postal_code }}@endif
                    @if($customer->billing_country)<br>{{ $customer->billing_country }}@endif
                    @if($customer->mobile)<br>Mobile: {{ $customer->mobile }}@endif
                    @if($customer->email)<br>{{ $customer->email }}@endif
                </p>
            </div>
        </div>

        @if($quote->customer_message)
        <div class="msg">{!! nl2br(e($quote->customer_message)) !!}</div>
        @endif

        <table class="items">
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 39%">Description</th>
                    <th style="width: 10%" class="text-right">Qty</th>
                    <th style="width: 8%">Unit</th>
                    <th style="width: 14%" class="text-right">Price</th>
                    <th style="width: 8%" class="text-right">Tax</th>
                    <th style="width: 16%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->name }}</strong>
                        @if($item->description)<br><span style="font-size: 8pt; color: #888;">{{ $item->description }}</span>@endif
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

        <div class="totals">
            <table>
                <tr><td>Subtotal</td><td class="text-right">{{ number_format($quote->subtotal / 100, 2) }}</td></tr>
                @if($quote->discount_amount > 0)<tr><td>Discount</td><td class="text-right">-{{ number_format($quote->discount_amount / 100, 2) }}</td></tr>@endif
                @if($quote->tax_amount > 0)<tr><td>Tax</td><td class="text-right">{{ number_format($quote->tax_amount / 100, 2) }}</td></tr>@endif
                @if($quote->shipping_amount > 0)<tr><td>Shipping</td><td class="text-right">{{ number_format($quote->shipping_amount / 100, 2) }}</td></tr>@endif
                <tr class="total-row"><td>Total</td><td class="text-right">{{ $quote->currency }} {{ number_format($quote->total / 100, 2) }}</td></tr>
            </table>
        </div>

        @if($quote->expiry_date)
        <div class="validity">This quotation is valid until <strong>{{ $quote->expiry_date->format('d M Y') }}</strong>. Prices are subject to change after this date.</div>
        @endif

        @if($quote->notes)
        <div class="section"><h4>Notes</h4><p>{!! nl2br(e($quote->notes)) !!}</p></div>
        @endif
        @if($quote->terms ?? $settings->default_terms)
        <div class="section"><h4>Terms &amp; Conditions</h4><p>{!! nl2br(e($quote->terms ?? $settings->default_terms)) !!}</p></div>
        @endif

        <div class="signatures">
            <div class="sig-block"></div>
            <div class="sig-block">
                @if($stamp_url && file_exists($stamp_url))<img src="{{ $stamp_url }}" class="sig-img" alt="Stamp" style="margin-bottom:-10px;">@endif
                @if($signature_url && file_exists($signature_url))<br><img src="{{ $signature_url }}" class="sig-img" alt="Signature">@endif
                <br><span class="sig-label">For {{ $settings->business_name ?? '' }}</span>
            </div>
        </div>

        <div class="doc-footer">
            {{ $settings->default_quote_footer ?? 'We look forward to working with you.' }}
        </div>
    </div>
</body>
</html>
