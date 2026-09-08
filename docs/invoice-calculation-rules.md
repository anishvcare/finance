# LifeLedger Pro - Invoice Calculation Rules

## 1. Principles

1. All monetary values stored as integers in minor units (cents/paise)
2. Server is the authoritative calculator - frontend is preview only
3. Historical prices are snapshots - never recalculated from current product prices
4. Database transactions protect all financial operations
5. Rounding applied once at the end, not per-line

## 2. Line Item Calculation

### Tax-Exclusive Items (default)
```
line_amount = quantity * unit_price
discount_amount = line_amount * (discount_rate / 100)
  OR fixed discount_amount (whichever specified)
taxable_amount = line_amount - discount_amount
tax_amount = taxable_amount * (tax_rate / 100)
line_total = taxable_amount + tax_amount
```

### Tax-Inclusive Items
```
line_amount = quantity * unit_price
discount_amount = line_amount * (discount_rate / 100)
amount_after_discount = line_amount - discount_amount
taxable_amount = amount_after_discount / (1 + tax_rate / 100)
tax_amount = amount_after_discount - taxable_amount
line_total = amount_after_discount  (tax is embedded)
```

## 3. Document Total Calculation

```
subtotal = SUM(all line_totals)
total_tax = SUM(all line tax_amounts)
additional_discount = flat amount or percentage of subtotal
net_after_discount = subtotal - additional_discount
shipping = flat amount (may have its own tax)
additional_charges = flat amount
pre_round_total = net_after_discount + shipping + additional_charges
round_off = apply_rounding(pre_round_total)
total = pre_round_total + round_off
balance_due = total - amount_paid
```

## 4. Rounding Rules

### Configurable Options:
- No rounding (exact cents)
- Round to nearest cent (default)
- Round to nearest 5 cents
- Round to nearest 10 cents
- Round to nearest dollar/unit
- Round down always
- Round up always

### Implementation:
```php
function applyRounding(int $amount, string $rule): int {
    return match($rule) {
        'none' => 0,
        'nearest_cent' => 0, // already in cents
        'nearest_5' => roundToNearest($amount, 5) - $amount,
        'nearest_10' => roundToNearest($amount, 10) - $amount,
        'nearest_100' => roundToNearest($amount, 100) - $amount,
        'down' => floor($amount / 100) * 100 - $amount,
        'up' => ceil($amount / 100) * 100 - $amount,
    };
}
```

## 5. Payment Tracking

```
amount_paid = SUM(all allocated payments for this invoice)
balance_due = total - amount_paid
status = determine_status(balance_due, due_date)
```

### Status Determination:
```
if (balance_due == 0 && total > 0) → 'paid'
if (balance_due > 0 && amount_paid > 0) → 'partially_paid'
if (balance_due > 0 && due_date < today) → 'overdue'
if (status == 'sent' || status == 'finalised') → keep current
```

## 6. Multi-Currency Handling

- Each invoice stores its own currency
- Exchange rates stored at payment time
- Workspace has default currency
- Reports can show in original or workspace currency
- Currency conversion only for reporting/dashboard aggregation

## 7. Discount Types

### Line-Level Discount:
- Percentage discount (discount_rate column)
- Fixed amount discount (discount_amount column)
- Only one active per line (percentage takes precedence if both set)

### Document-Level Discount:
- Applied after subtotal
- Percentage or fixed amount
- Stored as discount_amount on document

## 8. Tax Handling

### Single Tax:
- One tax rate per line item
- Tax can be inclusive or exclusive per line

### Compound Tax (future):
- Apply first tax, then apply second on (amount + first tax)
- Not enabled in v1 unless specifically required

### Tax Exemption:
- Customer-level exemption (skip tax for this customer)
- Line-level override (0% tax on specific item)
- Document-level override

## 9. Price Snapshot Rules

When creating an invoice/quote:
1. Copy current product/service name to line item `name`
2. Copy current price to line item `unit_price`
3. Copy current tax rate to line item `tax_rate`
4. Copy description to line item `description`
5. Store product_id/service_id as reference only
6. These snapshots are IMMUTABLE after finalisation

If product price changes later:
- Existing finalised invoices: no change
- Existing draft invoices: user can manually update or keep old price
- New invoices: show current price as default

## 10. Sequence Number Generation

### Thread-Safe Implementation:
```php
DB::transaction(function () use ($workspace, $type) {
    $sequence = DocumentSequence::where('workspace_id', $workspace->id)
        ->where('type', $type)
        ->lockForUpdate()
        ->first();

    $number = $sequence->next_number;
    $sequence->increment('next_number');

    return $this->formatNumber($sequence, $number);
});
```

### Number Format:
```
{prefix}{year?}{padded_number}
Example: INV-2026-00001
```

### Year Reset Logic:
- If reset_yearly enabled, check if current year > last_reset_year
- If so, reset next_number to 1 and update last_reset_year
- Financial year start month determines the reset boundary

## 11. Overpayment Handling

- Payment amount can exceed invoice balance_due
- Excess stored as credit on customer account
- Credit can be applied to future invoices
- Activity log records overpayment
- Balance_due shows as negative (credit) or stored separately

## 12. Refund Calculation

```
refund_payment.amount = refund_amount
refund_payment.is_refund = true
invoice.amount_paid -= refund_amount
invoice.balance_due += refund_amount
invoice.status = recalculate_status()
```

## 13. Validation Rules

Before saving any financial document:
- All quantities > 0
- Unit prices >= 0
- Tax rates >= 0 and <= 100
- Discount rates >= 0 and <= 100
- Total must be recalculated and match
- balance_due = total - amount_paid (enforced)
- amount_paid cannot exceed total (except overpayment flag)
