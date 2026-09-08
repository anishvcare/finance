# LifeLedger Pro

A production-ready, multi-user SaaS Progressive Web Application combining **personal finance**, **business billing & invoicing**, and **task/commitment management**.

## Tech Stack

- **Backend:** Laravel 11, PHP 8.2+, MySQL/MariaDB, Sanctum, Socialite
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, TanStack Query, React Router
- **PDF:** DomPDF (pure PHP — works on shared hosting)
- **OCR:** Tesseract.js (browser-side)
- **PWA:** Vite PWA Plugin + Workbox + Dexie.js (IndexedDB)
- **Hosting:** Designed for ordinary cPanel shared hosting behind Cloudflare

## Project Structure

```
lifeledger-pro/
├── app/
│   ├── Console/           # Scheduler + artisan commands (reminders, overdue checks)
│   ├── Http/Controllers/  # Api/, Admin/, Install/ controllers
│   ├── Http/Middleware/   # Workspace isolation, feature limits, cache headers
│   ├── Models/            # 28 Eloquent models
│   ├── Notifications/     # Invoice & task reminders
│   ├── Policies/          # Authorization (Invoice, Product, Workspace)
│   ├── Scopes/            # WorkspaceScope (multi-tenancy)
│   ├── Services/          # InvoiceCalculation, DocumentNumber, PaymentAllocation, Pdf
│   └── Traits/            # BelongsToWorkspace
├── bootstrap/             # Laravel 11 app bootstrap
├── config/               # All Laravel config files
├── database/
│   ├── migrations/       # 8 migration files (30+ tables)
│   ├── factories/        # Test factories
│   └── seeders/          # Plans + default settings
├── docs/                 # 18 documentation files (see below)
├── public/               # index.php, .htaccess, manifest.json, icons
├── resources/
│   ├── css/              # Tailwind entry
│   ├── js/               # React SPA (pages, components, lib, layouts)
│   └── views/            # Blade (public site, auth, installer, PDF, emails)
├── routes/               # web.php, api.php, admin.php, install.php, console.php
├── scripts/              # build-release.sh (creates deployment ZIP)
└── tests/                # Feature + Unit tests (Pest/PHPUnit)
```

## Documentation

All in `docs/`:

| File | Purpose |
|------|---------|
| requirements.md | Functional & non-functional requirements |
| design.md | Architecture, directory structure, routing |
| database-schema.md | All tables, columns, indexes |
| security-model.md | Auth, tenant isolation, RBAC, encryption |
| invoice-calculation-rules.md | Financial calculation logic |
| invoice-template-guide.md | PDF templates & customization |
| pwa-architecture.md | Manifest, service worker, offline sync |
| ocr-parsing-rules.md | Screenshot parsing rules |
| installation-guide.md | Web installer walkthrough |
| cpanel-deployment.md | Step-by-step cPanel deploy |
| cloudflare-setup.md | Cloudflare config (caching, SSL, WAF) |
| google-oauth-setup.md | Google login setup |
| api-documentation.md | REST API reference |
| testing-plan.md | Test coverage plan |
| user-guide.md | End-user guide |
| admin-guide.md | Super admin guide |
| release-checklist.md | Pre-release verification |
| tasks.md | Implementation task breakdown |

## Local Development

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm run dev        # in one terminal
php artisan serve  # in another
```

## Production Deployment (cPanel, no terminal needed)

1. Run `bash scripts/build-release.sh` on a dev machine (needs Composer + Node)
2. Upload the generated `lifeledger-pro-vX.X.X.zip` to your hosting
3. Extract it, point your domain to the `/public` folder
4. Visit `https://yourdomain.com/install` and complete the wizard
5. Set up the cron job: `* * * * * php /path/to/artisan schedule:run`

See `docs/cpanel-deployment.md` for full details.

## Key Features

- Workspace-based multi-tenancy with role-based access control
- Server-authoritative financial calculations (integer minor units — no float errors)
- Configurable invoice numbering with thread-safe sequence generation
- Quote → Invoice conversion with immutable price snapshots
- Partial/full payment recording with allocation across invoices
- 3 invoice PDF templates (Clean, Modern, Compact)
- Browser-side OCR for payment screenshots (Google Pay, PhonePe, Paytm, etc.)
- PWA with offline drafts and background sync
- Google OAuth + email authentication
- SaaS subscription plans with feature limits
- Web-based installer (no SSH/Composer/npm required on server)
- Cloudflare-compatible with correct cache headers

## Testing

```bash
composer test        # or: ./vendor/bin/pest
```

Test coverage includes: authentication, workspace tenant isolation, and invoice financial calculations.
