# LifeLedger Pro - Testing Plan

## 1. Testing Strategy

### Test Types:
- **Unit Tests**: Individual service/action classes
- **Feature Tests**: API endpoint integration tests
- **Browser Tests**: (Optional) Critical user flows
- **Security Tests**: Tenant isolation, auth bypass attempts

### Framework: Pest PHP (Laravel)
- Parallel test execution
- Dataset-driven tests for calculations
- Fluent assertions

## 2. Test Categories

### Authentication Tests
```
- Register with valid email/password
- Register with existing email (rejected)
- Login with correct credentials
- Login with wrong password (rejected)
- Login rate limiting (5 attempts)
- Google OAuth first-time registration
- Google OAuth returning user login
- Google OAuth with existing email (account link)
- Password reset flow
- Email verification flow
- Logout clears session
- Session regeneration on auth state change
- Suspended user cannot login
```

### Workspace Isolation Tests
```
- User A cannot access User B's invoices
- User A cannot access User B's customers
- User A cannot download User B's PDF
- User A cannot record payment on User B's invoice
- User A cannot modify User B's products
- API returns 403 for cross-workspace access
- URL manipulation with foreign workspace_id blocked
- Exported reports only contain own workspace data
- Share links only work for correct invoice
```

### Product & Service Tests
```
- Create product with all fields
- Create product with minimum fields
- Update product price creates history
- Archive product (soft delete)
- Restore archived product
- Product workspace isolation
- Product CSV import
- Product CSV export
- Duplicate product
- Product with tax configuration
- Low stock warning trigger
- Service creation and management
- Service pricing (hourly, fixed, minimum)
```

### Quote Tests
```
- Create quote with products and services
- Line item calculation accuracy
- Tax calculation (inclusive and exclusive)
- Discount calculation
- Quote total matches sum of lines
- Save as draft
- Send quote (status change)
- Mark as accepted
- Mark as rejected
- Quote expiry detection
- Convert quote to invoice
- Conversion preserves prices
- Conversion links quote to invoice
- Quote PDF generation
- Quote email delivery
- Duplicate quote
```

### Invoice Tests
```
- Invoice number auto-generation
- Invoice number uniqueness per workspace
- Sequential number generation (no gaps under normal use)
- Concurrent number generation (thread safety)
- Line item calculations
- Discount (percentage and fixed)
- Tax exclusive calculation
- Tax inclusive calculation
- Multiple tax rates
- Subtotal accuracy
- Total accuracy
- Finalise invoice (status change)
- Cannot edit financial totals after finalise
- Partial payment recording
- Full payment recording
- Overpayment handling
- Balance due recalculation
- Overdue status auto-detection
- Void invoice
- Invoice PDF generation
- Invoice PDF with logo
- Invoice PDF multi-page (many items)
- Invoice email delivery
- Email log creation
- Reminder generation
- Share link creation
- Share link expiry
- Share link does not expose internal notes
- Historical price preservation
```

### Bill Tests
```
- Create bill from supplier
- Bill number generation
- Bill payment recording
- Partial bill payment
- Full bill payment
- Bill outstanding amount
- Overdue detection
- Bill workspace isolation
- Bill attachment upload
- Linked expense transaction created on payment
- Duplicate prevention
```

### Payment Tests
```
- Record incoming payment
- Allocate payment to single invoice
- Allocate payment to multiple invoices
- Partial payment allocation
- Payment receipt generation
- Record outgoing payment (bill)
- Refund recording
- Refund updates invoice balance
- Payment reversal
- Overpayment stored as credit
- Payment workspace isolation
- Payment method validation
- Payment date validation
```

### Financial Calculation Tests (Unit)
```
- Integer arithmetic for line totals
- No floating point errors on $19.99 * 3
- Tax calculation precision
- Rounding rule: nearest cent
- Rounding rule: nearest 5 cents
- Rounding rule: round down
- Large invoice (100+ items) total accuracy
- Currency with 0 decimal places (JPY)
- Currency with 3 decimal places (KWD)
- Discount then tax (correct order)
- Tax inclusive reverse calculation
```

### OCR Tests
```
- Google Pay screenshot parsing
- PhonePe screenshot parsing
- Generic UPI screenshot parsing
- Amount extraction accuracy
- Date extraction accuracy
- Merchant name extraction
- Reference number extraction
- Low confidence handling
- Missing date handling
- Duplicate transaction detection
- Review before save (no auto-creation)
```

### Installer Tests
```
- Requirement check (PHP version)
- Requirement check (extensions)
- Permission check (storage writable)
- Database connection test (valid creds)
- Database connection test (invalid creds)
- Migration execution
- Seeder execution
- Admin account creation
- .env file generation
- .env write failure fallback
- Installation lock after completion
- Installer blocked when locked
- Re-install attempt rejected
```

### PWA Tests
```
- Manifest.json accessible and valid
- Service worker registration
- Offline page displayed when offline
- App shell cached
- Offline draft creation
- Sync queue population
- Background sync execution
- UUID uniqueness
- Duplicate prevention during sync
- Logout clears IndexedDB
- Update notification displayed
```

## 3. Test Data Factories

```php
// Key factories needed:
UserFactory
WorkspaceFactory
ProductFactory
ServiceFactory
CustomerFactory
SupplierFactory
QuoteFactory (with items)
InvoiceFactory (with items)
BillFactory (with items)
PaymentFactory
TransactionFactory
TaskFactory
CommitmentFactory
TaxFactory
CategoryFactory
AccountFactory
```

## 4. Performance Testing Checklist

- [ ] Dashboard loads in < 500ms (with 1000 transactions)
- [ ] Invoice list pagination (1000 invoices)
- [ ] Product search response time
- [ ] PDF generation time (< 5 seconds)
- [ ] No N+1 queries on list endpoints
- [ ] Report generation time (1 year data)

## 5. Security Testing Checklist

- [ ] SQL injection on search endpoints
- [ ] XSS in invoice notes/descriptions
- [ ] CSRF on all POST/PUT/DELETE
- [ ] Rate limiting on auth endpoints
- [ ] File upload validates MIME type
- [ ] Private files require authentication
- [ ] .env not accessible via HTTP
- [ ] Debug mode disabled in production
- [ ] Sensitive data not in error responses
- [ ] Cross-workspace access blocked (all entities)

## 6. Continuous Integration

```yaml
# Suggested CI workflow
- Run: pest --parallel
- PHP versions: 8.2, 8.3
- Database: MySQL 8.0
- Cache: file driver (no Redis needed)
- Queue: sync (for test simplicity)
```
