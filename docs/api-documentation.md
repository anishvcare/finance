# LifeLedger Pro - API Documentation

## Base URL
```
https://yourdomain.com/api
```

## Authentication
All API endpoints (except public auth endpoints) require session authentication via Laravel Sanctum.

### Headers Required:
```
Accept: application/json
X-XSRF-TOKEN: {csrf_token_from_cookie}
Content-Type: application/json
```

### Get CSRF Cookie:
```
GET /sanctum/csrf-cookie
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new user account.
```json
Request: { "name": "string", "email": "string", "password": "string", "password_confirmation": "string" }
Response 201: { "user": {...}, "message": "Registration successful" }
```

### POST /api/auth/login
```json
Request: { "email": "string", "password": "string" }
Response 200: { "user": {...}, "workspace": {...} }
Response 422: { "message": "Invalid credentials" }
```

### POST /api/auth/logout
```json
Response 200: { "message": "Logged out" }
```

### POST /api/auth/forgot-password
```json
Request: { "email": "string" }
Response 200: { "message": "Reset link sent" }
```

### POST /api/auth/reset-password
```json
Request: { "token": "string", "email": "string", "password": "string", "password_confirmation": "string" }
Response 200: { "message": "Password reset successful" }
```

### GET /api/auth/user
Get current authenticated user with workspaces.
```json
Response 200: { "id": 1, "name": "...", "email": "...", "workspaces": [...], "current_workspace": {...} }
```

### POST /api/auth/google
Handle Google OAuth callback.
```json
Request: { "code": "string", "state": "string" }
Response 200: { "user": {...}, "workspace": {...}, "is_new": boolean }
```

---

## Workspace Endpoints

### GET /api/workspaces
List user's workspaces.

### POST /api/workspaces
Create new workspace.
```json
Request: { "name": "string", "type": "personal|business", "currency": "USD", "timezone": "UTC" }
```

### POST /api/workspaces/{id}/switch
Switch active workspace.

---

## Product Endpoints

### GET /api/products
List products (paginated, filterable).
Query params: `search`, `category_id`, `is_active`, `page`, `per_page`, `sort_by`, `sort_dir`

### POST /api/products
```json
Request: { "name": "string", "code": "string?", "sales_price": 1999, "unit": "each", "tax_id": 1, ... }
Response 201: { "data": { "id": 1, ... } }
```

### GET /api/products/{id}
### PUT /api/products/{id}
### DELETE /api/products/{id} (soft delete/archive)
### POST /api/products/{id}/restore
### POST /api/products/{id}/duplicate
### POST /api/products/import (CSV)
### GET /api/products/export (CSV download)

---

## Service Endpoints
Same pattern as products: GET, POST, PUT, DELETE, restore, duplicate, import, export.

---

## Customer Endpoints

### GET /api/customers
### POST /api/customers
### GET /api/customers/{id}
### PUT /api/customers/{id}
### DELETE /api/customers/{id}
### GET /api/customers/{id}/statement
### GET /api/customers/{id}/invoices
### GET /api/customers/{id}/payments

---

## Supplier Endpoints
Same pattern as customers plus bill history.

---

## Quote Endpoints

### GET /api/quotes
### POST /api/quotes
```json
Request: {
  "customer_id": 1,
  "quote_date": "2026-01-15",
  "expiry_date": "2026-02-14",
  "items": [
    { "type": "product", "product_id": 1, "quantity": 2, "unit_price": 5000, "discount_rate": 10, "tax_id": 1 },
    { "type": "service", "service_id": 1, "quantity": 5, "unit_price": 8000 },
    { "type": "custom", "name": "Setup Fee", "quantity": 1, "unit_price": 15000 }
  ],
  "notes": "string?",
  "terms": "string?"
}
```
### GET /api/quotes/{id}
### PUT /api/quotes/{id}
### DELETE /api/quotes/{id}
### POST /api/quotes/{id}/send
### POST /api/quotes/{id}/accept
### POST /api/quotes/{id}/reject
### POST /api/quotes/{id}/convert (convert to invoice)
### GET /api/quotes/{id}/pdf

---

## Invoice Endpoints

### GET /api/invoices
### POST /api/invoices
### GET /api/invoices/{id}
### PUT /api/invoices/{id} (draft only)
### POST /api/invoices/{id}/finalise
### POST /api/invoices/{id}/send
### POST /api/invoices/{id}/void
### POST /api/invoices/{id}/record-payment
```json
Request: { "amount": 50000, "payment_date": "2026-01-20", "payment_method": "bank_transfer", "account_id": 1, "reference": "REF123" }
```
### GET /api/invoices/{id}/pdf
### POST /api/invoices/{id}/share-link
### GET /api/invoices/{id}/payments

---

## Bill Endpoints

### GET /api/bills
### POST /api/bills
### GET /api/bills/{id}
### PUT /api/bills/{id}
### POST /api/bills/{id}/record-payment
### GET /api/bills/{id}/pdf
### DELETE /api/bills/{id}

---

## Payment Endpoints

### GET /api/payments
### POST /api/payments
### GET /api/payments/{id}
### POST /api/payments/{id}/allocate
```json
Request: { "allocations": [{ "invoice_id": 1, "amount": 25000 }, { "invoice_id": 2, "amount": 25000 }] }
```
### POST /api/payments/{id}/refund
### GET /api/payments/{id}/receipt

---

## Transaction Endpoints

### GET /api/transactions
### POST /api/transactions
### GET /api/transactions/{id}
### PUT /api/transactions/{id}
### DELETE /api/transactions/{id}
### POST /api/transactions/transfer
```json
Request: { "from_account_id": 1, "to_account_id": 2, "amount": 10000, "date": "2026-01-15" }
```

---

## Task Endpoints

### GET /api/tasks
### POST /api/tasks
### GET /api/tasks/{id}
### PUT /api/tasks/{id}
### DELETE /api/tasks/{id}
### POST /api/tasks/{id}/complete
### POST /api/tasks/{id}/subtasks

---

## Commitment Endpoints

### GET /api/commitments
### POST /api/commitments
### GET /api/commitments/{id}
### PUT /api/commitments/{id}
### DELETE /api/commitments/{id}
### POST /api/commitments/{id}/milestones

---

## Report Endpoints

### GET /api/reports/sales
### GET /api/reports/purchases
### GET /api/reports/invoice-ageing
### GET /api/reports/bill-ageing
### GET /api/reports/cash-flow
### GET /api/reports/profit-loss
### GET /api/reports/income-expense
### GET /api/reports/tasks

Query params: `from_date`, `to_date`, `customer_id`, `supplier_id`, `category_id`

---

## Dashboard Endpoint

### GET /api/dashboard
Returns aggregated dashboard data for current workspace.

---

## Settings Endpoints

### GET /api/settings
### PUT /api/settings
### POST /api/settings/logo (multipart upload)
### POST /api/settings/signature (multipart upload)

---

## Notification Endpoints

### GET /api/notifications
### POST /api/notifications/{id}/read
### POST /api/notifications/read-all

---

## OCR Endpoint

### POST /api/ocr/save
Save OCR extracted data (after client-side processing).
```json
Request: { "amount": 50000, "currency": "INR", "date": "2026-01-15", "merchant": "Shop Name", "reference": "TXN123", "source_app": "googlepay", "confidence": 85.5, "link_to": "invoice|bill|transaction", "link_id": 1, "retain_image": false }
```

---

## Pagination Format
All list endpoints return:
```json
{
  "data": [...],
  "meta": { "current_page": 1, "last_page": 10, "per_page": 20, "total": 200 },
  "links": { "first": "...", "last": "...", "next": "...", "prev": null }
}
```

## Error Format
```json
{
  "message": "Human-readable error message",
  "errors": { "field": ["Validation error message"] }
}
```

## HTTP Status Codes
- 200: Success
- 201: Created
- 204: No Content (delete)
- 401: Unauthenticated
- 403: Forbidden (wrong workspace/role)
- 404: Not Found
- 422: Validation Error
- 429: Rate Limited
- 500: Server Error
