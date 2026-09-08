# LifeLedger Pro - Invoice Template Guide

## 1. Available Templates

### Clean Professional
- Minimal, traditional business invoice
- Logo top-left, company details top-right
- Clear table with borders
- Suitable for formal B2B transactions

### Modern
- Contemporary design with accent color header
- Full-width header band with logo and company info
- Rounded table corners, alternating row colors
- Suitable for creative businesses and freelancers

### Compact
- Optimized for maximum content per page
- Smaller fonts, tighter spacing
- Best for invoices with many line items
- Suitable for product-heavy businesses

## 2. Template Structure

### Header Section
```
┌─────────────────────────────────────────────────┐
│  [LOGO]          INVOICE                         │
│  Company Name    Invoice #: INV-00001            │
│  Address         Date: 2026-01-15                │
│  Phone/Email     Due Date: 2026-02-14            │
│  Tax Number      Reference: PO-123              │
└─────────────────────────────────────────────────┘
```

### Customer Section
```
┌────────────────────────┬────────────────────────┐
│  Bill To:              │  Ship To:              │
│  Customer Name         │  Customer Name         │
│  Address               │  Shipping Address      │
│  City, State, Zip      │  City, State, Zip      │
│  Tax Number            │                        │
└────────────────────────┴────────────────────────┘
```

### Line Items Table
```
┌─────┬────────────────┬──────┬───┬────────┬──────┬─────┬─────────┐
│  #  │  Description   │ Qty  │ U │  Price │ Disc │ Tax │  Total  │
├─────┼────────────────┼──────┼───┼────────┼──────┼─────┼─────────┤
│  1  │  Product Name  │  2   │ea │ $50.00 │  10% │ GST │ $99.00  │
│     │  Details...    │      │   │        │      │     │         │
├─────┼────────────────┼──────┼───┼────────┼──────┼─────┼─────────┤
│  2  │  Service Name  │  5   │hr │ $80.00 │   -  │ GST │ $440.00 │
└─────┴────────────────┴──────┴───┴────────┴──────┴─────┴─────────┘
```

### Totals Section
```
                              Subtotal:    $539.00
                              Discount:    - $0.00
                              Tax (GST):   + $53.90
                              Shipping:    + $10.00
                              ─────────────────────
                              TOTAL:       $602.90
                              Amount Paid: $200.00
                              BALANCE DUE: $402.90
```

### Footer Section
```
┌─────────────────────────────────────────────────┐
│  Payment Instructions:                           │
│  Bank: Example Bank | BSB: 000-000               │
│  Account: 12345678 | Ref: INV-00001              │
│                                                  │
│  Terms: Payment due within 30 days               │
│  Thank you for your business!                    │
│                                                  │
│  [Signature]                [Stamp]              │
└─────────────────────────────────────────────────┘
```

## 3. Customization Options

### Branding
| Setting | Options |
|---------|---------|
| Logo | Upload (max 2MB, png/jpg/svg) |
| Logo size | Small (100px), Medium (150px), Large (200px) |
| Logo alignment | Left, Center, Right |
| Accent color | Hex color picker |
| Header background | Accent color or white |

### Content Visibility
| Field | Show/Hide |
|-------|-----------|
| Company tax number | Toggle |
| Customer tax number | Toggle |
| Discount column | Toggle |
| Tax column | Toggle |
| Unit column | Toggle |
| Bank details | Toggle |
| Payment instructions | Toggle |
| Signature | Toggle |
| Stamp | Toggle |
| Footer | Toggle |
| Notes | Toggle |

### Text Customization
| Field | Editable |
|-------|----------|
| Invoice title | "INVOICE", "TAX INVOICE", "PROFORMA" |
| Column headers | Customizable labels |
| Footer text | Custom HTML-safe text |
| Terms text | Custom per workspace |
| Thank-you message | Custom per workspace |

## 4. PDF Rendering Rules

### Page Size
- A4 (default): 210mm x 297mm
- Letter: 216mm x 279mm
- Configurable per workspace

### Margins
- Top: 15mm, Bottom: 20mm, Left: 15mm, Right: 15mm

### Fonts
- Primary: DejaVu Sans (Unicode support)
- Fallback: Helvetica, Arial
- Sizes: Header 16pt, Body 10pt, Small 8pt

### Page Breaks
- Automatic when content exceeds page
- Table headers repeat on new pages
- Footer appears on last page only
- Page numbers on multi-page invoices

### Image Handling
- Logo: max 200px width, auto-height
- Signature: max 150px width
- Stamp: max 100px width
- All images embedded as base64 in PDF

## 5. Currency Formatting

| Currency | Format | Symbol |
|----------|--------|--------|
| USD | $1,234.56 | $ |
| EUR | EUR 1.234,56 | EUR |
| GBP | GBP 1,234.56 | GBP |
| INR | INR 1,23,456.78 | INR |
| AUD | $1,234.56 | A$ |
| Custom | Configurable | User-defined |

### Formatting Rules:
- Decimal places: 2 (configurable 0-4)
- Thousands separator: , or . (locale-dependent)
- Symbol position: Before or After amount
- Indian numbering: xx,xx,xxx format supported

## 6. Multi-Page Handling

For invoices with many line items:
1. Header appears on first page only
2. Carried-forward subtotal shown at page bottom
3. "Continued on next page" indicator
4. Table headers repeat on each page
5. Final totals on last page only
6. Footer on last page only
7. Maximum recommended: 50+ line items tested
