# LifeLedger Pro - Release Checklist

## Pre-Release Checks

### Code Quality
- [ ] All tests passing (`pest --parallel`)
- [ ] No PHP deprecation warnings
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint warnings in production code
- [ ] No console.log statements in production code
- [ ] Debug mode disabled in .env.example

### Security
- [ ] All secrets use .env (none hardcoded)
- [ ] CSRF protection active on all forms
- [ ] Rate limiting configured on auth endpoints
- [ ] File upload validation working
- [ ] SQL injection tests passing
- [ ] XSS protection verified
- [ ] Workspace isolation tests passing
- [ ] .env not accessible via HTTP
- [ ] storage/ not publicly browsable
- [ ] Installer lock mechanism working

### Financial Accuracy
- [ ] Invoice calculation tests all passing
- [ ] No floating-point arithmetic for money
- [ ] Server-side recalculation verified
- [ ] Payment allocation correct
- [ ] Balance due calculation accurate
- [ ] Tax calculation (inclusive/exclusive) verified
- [ ] Multi-line invoice totals correct
- [ ] Price snapshots preserved on invoices

### PDF Generation
- [ ] Single-page invoice renders correctly
- [ ] Multi-page invoice handles page breaks
- [ ] Logo displays properly in PDF
- [ ] Currency symbols render (Unicode)
- [ ] All three templates working
- [ ] Quote PDF working
- [ ] Receipt PDF working

### PWA
- [ ] Manifest.json valid
- [ ] Service worker registers
- [ ] Offline page displays
- [ ] Install prompt works (Chrome)
- [ ] iOS instructions display
- [ ] IndexedDB stores data
- [ ] Sync queue processes on reconnect
- [ ] Logout clears local data

### Email
- [ ] Invoice email delivers with PDF
- [ ] Quote email delivers
- [ ] Reminder emails send
- [ ] Email templates render correctly
- [ ] SMTP test function works
- [ ] Failed email logged properly

## Build Process

### 1. Frontend Build
```bash
npm run build
# Verify: public/build/ contains hashed assets
# Verify: manifest.json updated
# Verify: service worker generated
```

### 2. Backend Preparation
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. Create Release Package
```bash
# Include:
# - All PHP source files
# - vendor/ directory (production only)
# - public/build/ (compiled assets)
# - public/icons/ (PWA icons)
# - public/manifest.json
# - public/sw.js
# - .env.example
# - .htaccess files
# - database/migrations/
# - database/seeders/
# - docs/
# - storage/ (empty structure)
# - bootstrap/cache/ (empty)

# Exclude:
# - node_modules/
# - .git/
# - tests/ (optional, exclude for smaller package)
# - .env (never include actual env)
# - storage/logs/* (clear)
# - storage/app/* (user data)
```

### 4. ZIP Package
```bash
zip -r lifeledger-pro-v1.0.0.zip lifeledger-pro/ \
  --exclude="node_modules/*" \
  --exclude=".git/*" \
  --exclude="*.log"
```

## Post-Release Verification

### Fresh Installation Test
- [ ] Upload ZIP to clean hosting
- [ ] Navigate to /install
- [ ] Complete all wizard steps
- [ ] Verify database tables created
- [ ] Login as admin
- [ ] Create workspace
- [ ] Create product
- [ ] Create customer
- [ ] Create and finalise invoice
- [ ] Download PDF
- [ ] Send invoice email
- [ ] Install PWA
- [ ] Verify cron works

### Upgrade Test (if applicable)
- [ ] Upload new files over existing installation
- [ ] Run migrations via admin panel
- [ ] Verify existing data intact
- [ ] Verify new features available
- [ ] No breaking changes to existing invoices

## Version Naming
Format: `v{major}.{minor}.{patch}`
- Major: Breaking changes, major new modules
- Minor: New features, non-breaking
- Patch: Bug fixes, security patches

## Documentation Delivery
Ensure the following docs are included:
- [ ] requirements.md
- [ ] design.md
- [ ] database-schema.md
- [ ] security-model.md
- [ ] pwa-architecture.md
- [ ] ocr-parsing-rules.md
- [ ] invoice-calculation-rules.md
- [ ] invoice-template-guide.md
- [ ] installation-guide.md
- [ ] cpanel-deployment.md
- [ ] cloudflare-setup.md
- [ ] google-oauth-setup.md
- [ ] testing-plan.md
- [ ] api-documentation.md
- [ ] user-guide.md
- [ ] admin-guide.md
- [ ] release-checklist.md (this file)
- [ ] tasks.md
