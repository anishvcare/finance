# LifeLedger Pro - Architecture & Design Document

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                                    │
│  DNS + SSL + CDN + WAF + DDoS Protection + Brotli + HTTP/3          │
└─────────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                    CPANEL SHARED HOSTING                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   Apache / LiteSpeed                            │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────────┐  │  │
│  │  │  PUBLIC WEBSITE  │    │       LARAVEL APPLICATION        │  │  │
│  │  │  (Blade + TW)   │    │  ┌────────────┐ ┌────────────┐  │  │  │
│  │  │  - Home          │    │  │  REST API  │ │ React SPA  │  │  │  │
│  │  │  - Features      │    │  │  /api/*    │ │ /app/*     │  │  │  │
│  │  │  - Pricing       │    │  │  Sanctum   │ │ Vite Built │  │  │  │
│  │  │  - Login         │    │  │  JSON      │ │ TypeScript │  │  │  │
│  │  │  - Register      │    │  └────────────┘ └────────────┘  │  │  │
│  │  └─────────────────┘    └──────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  MySQL/MariaDB  │  │  File Storage │  │  Cron (Scheduler)  │     │
│  └─────────────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Directory Structure

```
lifeledger-pro/
├── app/
│   ├── Actions/                  # Single-purpose action classes
│   │   ├── Invoice/
│   │   ├── Quote/
│   │   ├── Payment/
│   │   └── ...
│   ├── Enums/                    # PHP 8.1 enums
│   │   ├── InvoiceStatus.php
│   │   ├── QuoteStatus.php
│   │   ├── BillStatus.php
│   │   ├── PaymentMethod.php
│   │   ├── WorkspaceRole.php
│   │   └── ...
│   ├── Events/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/              # REST API controllers
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── WorkspaceController.php
│   │   │   │   ├── ProductController.php
│   │   │   │   ├── ServiceController.php
│   │   │   │   ├── CustomerController.php
│   │   │   │   ├── SupplierController.php
│   │   │   │   ├── QuoteController.php
│   │   │   │   ├── InvoiceController.php
│   │   │   │   ├── BillController.php
│   │   │   │   ├── PaymentController.php
│   │   │   │   ├── TransactionController.php
│   │   │   │   ├── TaskController.php
│   │   │   │   ├── CommitmentController.php
│   │   │   │   ├── ContactController.php
│   │   │   │   ├── ReportController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   └── SettingsController.php
│   │   │   ├── Web/              # Blade page controllers
│   │   │   │   ├── HomeController.php
│   │   │   │   ├── PageController.php
│   │   │   │   └── AppController.php
│   │   │   ├── Admin/            # Admin panel controllers
│   │   │   │   ├── AdminDashboardController.php
│   │   │   │   ├── UserManagementController.php
│   │   │   │   ├── PlanController.php
│   │   │   │   └── SystemController.php
│   │   │   └── Install/          # Installation wizard
│   │   │       └── InstallController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureWorkspaceMember.php
│   │   │   ├── CheckWorkspaceRole.php
│   │   │   ├── CheckFeatureLimit.php
│   │   │   ├── EnsureInstalled.php
│   │   │   ├── BlockInstaller.php
│   │   │   ├── TrustCloudflareProxies.php
│   │   │   └── SetCacheHeaders.php
│   │   ├── Requests/             # Form request validation
│   │   └── Resources/            # API resources
│   ├── Jobs/
│   ├── Listeners/
│   ├── Mail/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Workspace.php
│   │   ├── WorkspaceMember.php
│   │   ├── Account.php
│   │   ├── Category.php
│   │   ├── Transaction.php
│   │   ├── Product.php
│   │   ├── ProductPrice.php
│   │   ├── Service.php
│   │   ├── Customer.php
│   │   ├── Supplier.php
│   │   ├── Contact.php
│   │   ├── Quote.php
│   │   ├── QuoteItem.php
│   │   ├── Invoice.php
│   │   ├── InvoiceItem.php
│   │   ├── Bill.php
│   │   ├── BillItem.php
│   │   ├── Payment.php
│   │   ├── PaymentAllocation.php
│   │   ├── Tax.php
│   │   ├── Task.php
│   │   ├── Commitment.php
│   │   ├── Reminder.php
│   │   ├── ActivityLog.php
│   │   ├── DocumentSequence.php
│   │   ├── Plan.php
│   │   ├── Subscription.php
│   │   └── ...
│   ├── Notifications/
│   ├── Observers/
│   ├── Policies/
│   │   ├── WorkspacePolicy.php
│   │   ├── ProductPolicy.php
│   │   ├── InvoicePolicy.php
│   │   └── ...
│   ├── Providers/
│   ├── Services/                 # Business logic services
│   │   ├── InvoiceCalculationService.php
│   │   ├── TaxCalculationService.php
│   │   ├── PaymentAllocationService.php
│   │   ├── DocumentNumberService.php
│   │   ├── PdfGenerationService.php
│   │   ├── WorkspaceService.php
│   │   └── ...
│   └── Traits/
│       ├── BelongsToWorkspace.php
│       ├── HasActivityLog.php
│       └── ...
├── config/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── public/
│   ├── index.php
│   ├── .htaccess
│   ├── build/                    # Vite compiled assets
│   ├── icons/                    # PWA icons
│   ├── images/
│   ├── fonts/
│   ├── manifest.json
│   └── sw.js
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── js/                       # React application source
│   │   ├── app.tsx               # Entry point
│   │   ├── components/           # Shared UI components
│   │   │   ├── ui/               # Base UI (Button, Input, Modal, etc.)
│   │   │   ├── layout/           # Layout components
│   │   │   ├── forms/            # Form components
│   │   │   └── data/             # Data display (tables, cards)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # Page layouts
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── lib/                  # Libraries and utilities
│   │   │   ├── api.ts            # Axios/fetch API client
│   │   │   ├── auth.ts           # Auth state management
│   │   │   ├── db.ts             # Dexie.js IndexedDB
│   │   │   ├── ocr.ts            # Tesseract.js wrapper
│   │   │   └── pwa.ts            # PWA utilities
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard/
│   │   │   ├── Products/
│   │   │   ├── Services/
│   │   │   ├── Customers/
│   │   │   ├── Suppliers/
│   │   │   ├── Quotes/
│   │   │   ├── Invoices/
│   │   │   ├── Bills/
│   │   │   ├── Payments/
│   │   │   ├── Transactions/
│   │   │   ├── Tasks/
│   │   │   ├── Commitments/
│   │   │   ├── Reports/
│   │   │   ├── Settings/
│   │   │   └── Admin/
│   │   ├── services/             # API service functions
│   │   ├── stores/               # State management
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   └── views/                    # Blade templates
│       ├── layouts/
│       │   ├── public.blade.php
│       │   └── app-shell.blade.php
│       ├── pages/                # Public website pages
│       │   ├── home.blade.php
│       │   ├── features.blade.php
│       │   ├── pricing.blade.php
│       │   ├── privacy.blade.php
│       │   ├── terms.blade.php
│       │   └── contact.blade.php
│       ├── auth/
│       ├── install/
│       ├── emails/
│       ├── pdf/
│       │   ├── invoice-clean.blade.php
│       │   ├── invoice-modern.blade.php
│       │   ├── invoice-compact.blade.php
│       │   ├── quote.blade.php
│       │   ├── receipt.blade.php
│       │   └── statement.blade.php
│       └── components/
├── routes/
│   ├── web.php                   # Public + app shell routes
│   ├── api.php                   # REST API routes
│   ├── admin.php                 # Admin routes
│   └── install.php               # Installer routes
├── storage/
├── tests/
│   ├── Feature/
│   └── Unit/
├── docs/                         # Documentation
├── .env.example
├── composer.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── phpunit.xml
```

## 3. Routing Strategy

### 3.1 Public Website (Laravel Blade, Server-Rendered)
```
GET /                     → Home page
GET /features             → Features page
GET /features/finance     → Finance management
GET /features/invoicing   → Invoicing features
GET /features/products    → Product & service management
GET /features/tasks       → Task & commitment tracking
GET /how-it-works         → How it works
GET /pricing              → Pricing plans
GET /install-app          → PWA installation guide
GET /faq                  → FAQ
GET /privacy              → Privacy policy
GET /terms                → Terms and conditions
GET /contact              → Contact page
GET /login                → Login page
GET /register             → Registration page
GET /password/reset       → Password reset
GET /auth/google          → Google OAuth redirect
GET /auth/google/callback → Google OAuth callback
```

### 3.2 React SPA (Authenticated, mounted at /app)
```
GET /app/*                → React SPA shell (single Blade view)

React Router handles:
/app/dashboard
/app/onboarding
/app/transactions
/app/accounts
/app/products
/app/products/:id
/app/services
/app/services/:id
/app/customers
/app/customers/:id
/app/suppliers
/app/suppliers/:id
/app/quotes
/app/quotes/create
/app/quotes/:id
/app/invoices
/app/invoices/create
/app/invoices/:id
/app/bills
/app/bills/create
/app/bills/:id
/app/payments
/app/tasks
/app/tasks/:id
/app/commitments
/app/commitments/:id
/app/contacts
/app/calendar
/app/reports
/app/reports/:type
/app/settings
/app/settings/workspace
/app/settings/branding
/app/settings/invoicing
/app/settings/notifications
/app/settings/team
```

### 3.3 REST API
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/user
POST   /api/auth/google

GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/{workspace}
PUT    /api/workspaces/{workspace}
POST   /api/workspaces/{workspace}/switch

# Resource routes for all entities
# All scoped to current workspace via middleware
GET|POST        /api/products
GET|PUT|DELETE  /api/products/{product}
GET|POST        /api/services
GET|POST        /api/customers
GET|POST        /api/suppliers
GET|POST        /api/quotes
POST            /api/quotes/{quote}/convert
GET|POST        /api/invoices
POST            /api/invoices/{invoice}/finalise
POST            /api/invoices/{invoice}/send
GET|POST        /api/bills
GET|POST        /api/payments
POST            /api/payments/{payment}/allocate
GET|POST        /api/transactions
GET|POST        /api/tasks
GET|POST        /api/commitments
GET|POST        /api/contacts
GET             /api/reports/{type}
GET             /api/dashboard
GET|PUT         /api/settings
POST            /api/ocr/process
GET             /api/notifications
```

### 3.4 Admin Routes
```
GET    /admin/dashboard
GET    /admin/users
GET    /admin/workspaces
GET    /admin/plans
GET    /admin/settings
GET    /admin/health
GET    /admin/audit-logs
```

### 3.5 Installer Routes
```
GET    /install
POST   /install/check-requirements
POST   /install/check-permissions
POST   /install/configure-app
POST   /install/configure-database
POST   /install/test-database
POST   /install/configure-email
POST   /install/configure-oauth
POST   /install/create-admin
POST   /install/run-migration
POST   /install/run-seeder
POST   /install/finalize
```

## 4. Multi-Tenancy Model

### Workspace-Based Logical Multi-Tenancy

```
User (1) ──── has many ────► WorkspaceMember (N)
                                    │
                                    ▼
                              Workspace (N)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Products        Customers        Invoices
              Services        Suppliers        Bills
              Quotes          Contacts         Payments
              Transactions    Tasks            Commitments
```

- Every data model includes `workspace_id`
- Global scope `WorkspaceScope` automatically filters queries
- Middleware validates workspace membership on every request
- Policy checks prevent cross-workspace access
- workspace_id is NEVER trusted from browser input for ownership

### Role Hierarchy
```
Owner > Administrator > Accountant > Manager > Staff > Viewer
```

## 5. Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Browser  │────►│ Login/Google │────►│   Sanctum    │
│  (React)  │◄────│   OAuth      │◄────│  Session     │
└──────────┘     └──────────────┘     └──────────────┘
     │                                        │
     │  HTTP-only session cookie              │
     │  CSRF token via XSRF-TOKEN cookie      │
     ▼                                        ▼
┌──────────┐                           ┌──────────────┐
│  API Req  │──── Cookie + CSRF ───────►│  Validated   │
└──────────┘                           └──────────────┘
```

- No tokens in localStorage
- Session-based authentication via Sanctum
- CSRF protection on all state-changing requests
- Session regeneration on login/logout

## 6. Financial Calculation Architecture

### Server-Side Authoritative
- Frontend calculates for preview only
- Backend recalculates and validates all totals before saving
- Uses integer minor units (cents) internally for precision
- Configurable rounding rules per workspace

### Invoice Line Calculation
```
line_amount = quantity × unit_price
line_discount = line_amount × (discount_rate / 100) OR fixed discount
line_after_discount = line_amount - line_discount
line_tax = line_after_discount × (tax_rate / 100) [if exclusive]
line_total = line_after_discount + line_tax

subtotal = SUM(line_totals)
additional_discount = applied to subtotal
shipping = flat amount
additional_charges = flat amount
round_off = configurable rounding
total = subtotal - additional_discount + shipping + additional_charges + round_off
balance_due = total - amount_paid
```

## 7. PDF Generation Strategy

- Library: **DomPDF** (pure PHP, no external dependencies)
- Works on cPanel without Node.js, Chrome, or wkhtmltopdf
- Blade templates for PDF views
- Supports images, tables, page breaks, Unicode
- Three templates: Clean Professional, Modern, Compact
- Generated on-demand, cached in storage
- Private storage (not publicly accessible)
- Served via signed temporary URLs

## 8. PWA Architecture

- Vite PWA Plugin generates manifest and service worker
- Workbox strategies for caching
- App shell cached for offline access
- IndexedDB (via Dexie.js) for offline data
- Background sync for pending operations
- Client-generated UUIDs for offline records
- Sync queue with conflict resolution

## 9. OCR Strategy

- Tesseract.js loaded as lazy Web Worker
- Image preprocessing via Canvas API
- Parser adapters for different payment apps
- Regex-based field extraction
- Confidence scoring
- Review screen before any data persistence
- No server upload unless user explicitly saves attachment

## 10. Deployment Architecture

### Production Package
```
release.zip
├── All PHP files (compiled vendor included)
├── Compiled React assets (public/build/)
├── PWA files (manifest, sw.js, icons)
├── .env.example
├── .htaccess (configured for Laravel)
├── Installation wizard
└── Documentation
```

### cPanel Installation Flow
1. Upload ZIP to server
2. Extract to domain document root (or subdirectory)
3. Point domain to /public folder
4. Navigate to https://domain.com/install
5. Complete web-based wizard
6. Application ready

No terminal, no composer, no npm required on server.
