# LifeLedger Pro - Requirements Document

## 1. Product Overview

LifeLedger Pro is a hybrid personal and small-business management SaaS Progressive Web Application that combines personal finance management, business billing, invoicing, task management, and commitment tracking into a single platform.

## 2. Target Users

- Freelancers managing personal and business finances
- Small business owners
- Sole traders
- Micro-businesses (1-10 employees)
- Individuals tracking personal finance
- Service providers needing invoicing
- Product sellers needing inventory + invoicing

## 3. Functional Requirements

### 3.1 Authentication & User Management
- FR-001: Email registration with verification
- FR-002: Email/password login
- FR-003: Google OAuth login (first-time registration + returning login)
- FR-004: Password reset via email
- FR-005: Session management and revocation
- FR-006: Account deletion with data export
- FR-007: Multi-workspace support per user

### 3.2 Workspace Management
- FR-010: Personal workspace creation
- FR-011: Business workspace creation
- FR-012: Workspace member invitations
- FR-013: Role-based access (Owner, Administrator, Accountant, Manager, Staff, Viewer)
- FR-014: Workspace settings and branding
- FR-015: Workspace switching

### 3.3 Products Management
- FR-020: CRUD products with full field set
- FR-021: Product categories
- FR-022: Multiple price levels (sales, cost, wholesale, promotional)
- FR-023: Price history tracking
- FR-024: Tax configuration per product
- FR-025: Stock tracking (optional)
- FR-026: CSV import/export
- FR-027: Product archiving and restoration

### 3.4 Services Management
- FR-030: CRUD services with full field set
- FR-031: Service categories
- FR-032: Hourly/fixed/minimum pricing
- FR-033: Tax configuration per service
- FR-034: Service archiving and restoration
- FR-035: CSV import/export

### 3.5 Customer Management
- FR-040: CRUD customers (Individual, Business, Organisation)
- FR-041: Customer contacts
- FR-042: Billing and shipping addresses
- FR-043: Payment terms and credit limits
- FR-044: Customer statements
- FR-045: Outstanding balance tracking
- FR-046: CSV import/export

### 3.6 Supplier Management
- FR-050: CRUD suppliers
- FR-051: Supplier contacts
- FR-052: Bank details storage
- FR-053: Supplier statements
- FR-054: Outstanding balance tracking

### 3.7 Quotations
- FR-060: Create quotes with products, services, custom items
- FR-061: Quote status workflow (Draft → Sent → Viewed → Accepted/Rejected/Expired)
- FR-062: Quote PDF generation
- FR-063: Quote email delivery
- FR-064: Convert quote to invoice (preserving snapshot data)
- FR-065: Quote reminders
- FR-066: Quote duplication

### 3.8 Invoices
- FR-070: Create invoices with products, services, custom items
- FR-071: Configurable invoice numbering (prefix, sequence, year)
- FR-072: Invoice status workflow (Draft → Finalised → Sent → Paid/Overdue/Void)
- FR-073: Invoice PDF generation with branding
- FR-074: Invoice email delivery
- FR-075: Partial and full payment recording
- FR-076: Secure customer-view share links
- FR-077: Invoice reminders
- FR-078: Multiple invoice templates (Clean Professional, Modern, Compact)
- FR-079: Historical price preservation (no recalculation from current prices)

### 3.9 Bills
- FR-080: Create bills from suppliers
- FR-081: Bill payment recording (partial and full)
- FR-082: Bill attachment (supplier invoice image/PDF)
- FR-083: Bill status workflow
- FR-084: Expense transaction linking

### 3.10 Payments
- FR-090: Record incoming payments (against invoices)
- FR-091: Record outgoing payments (against bills)
- FR-092: Partial payment support
- FR-093: Multi-invoice payment allocation
- FR-094: Payment receipt generation
- FR-095: Refund recording
- FR-096: Overpayment handling

### 3.11 Personal Finance
- FR-100: Multiple accounts (bank, cash, credit card, wallet)
- FR-101: Income and expense transactions
- FR-102: Transfer between accounts
- FR-103: Category-based tracking
- FR-104: Budget management
- FR-105: Recurring transactions
- FR-106: OCR screenshot import

### 3.12 Tasks & Commitments
- FR-110: Task CRUD with subtasks
- FR-111: Recurring tasks
- FR-112: Commitment tracking with milestones
- FR-113: Deadline and reminder management
- FR-114: Calendar view
- FR-115: Link tasks/commitments to invoices, bills, customers, suppliers

### 3.13 OCR
- FR-120: Browser-side OCR using Tesseract.js
- FR-121: Payment screenshot parsing (Google Pay, PhonePe, Paytm, BHIM, generic)
- FR-122: Field extraction (amount, date, merchant, reference)
- FR-123: Review screen before saving
- FR-124: Duplicate detection
- FR-125: Link to invoice/bill/customer/supplier

### 3.14 Notifications & Reminders
- FR-130: In-app notifications
- FR-131: Email notifications
- FR-132: Browser push notifications
- FR-133: Invoice due/overdue reminders
- FR-134: Bill due/overdue reminders
- FR-135: Task due reminders
- FR-136: Commitment deadline reminders

### 3.15 Reports
- FR-140: Sales reports (by date, customer, product, service)
- FR-141: Purchase reports (by supplier, category)
- FR-142: Invoice ageing report
- FR-143: Bill ageing report
- FR-144: Cash flow report
- FR-145: Profitability reports
- FR-146: Personal finance reports (income vs expense, budget vs actual)
- FR-147: Productivity reports (tasks, commitments)
- FR-148: CSV/PDF export

### 3.16 PWA
- FR-150: Web manifest with icons
- FR-151: Service worker with offline support
- FR-152: Install App prompting
- FR-153: Offline draft creation
- FR-154: Background sync
- FR-155: App shell caching
- FR-156: Update notifications

### 3.17 Admin Panel
- FR-160: User management
- FR-161: Workspace management
- FR-162: Subscription plan management
- FR-163: Application settings (name, branding, defaults)
- FR-164: System health monitoring
- FR-165: Audit logs

### 3.18 Installation
- FR-170: Web-based installer at /install
- FR-171: Server requirement checks
- FR-172: Database configuration and migration
- FR-173: Admin account creation
- FR-174: .env generation (with manual fallback)
- FR-175: Installation lock after completion

## 4. Non-Functional Requirements

### 4.1 Performance
- NFR-001: Page load under 3 seconds on 3G
- NFR-002: API responses under 500ms for standard queries
- NFR-003: PDF generation under 5 seconds
- NFR-004: Lazy-loaded routes and heavy libraries

### 4.2 Security
- NFR-010: Workspace tenant isolation
- NFR-011: CSRF/XSS/SQL injection protection
- NFR-012: Secure session management (HTTP-only cookies)
- NFR-013: Rate limiting on auth endpoints
- NFR-014: File upload validation
- NFR-015: Signed share links with expiry

### 4.3 Reliability
- NFR-020: Database transactions for financial operations
- NFR-021: Server-side authoritative calculations
- NFR-022: Immutable financial snapshots
- NFR-023: Audit trail for sensitive operations

### 4.4 Compatibility
- NFR-030: PHP 8.2+ on cPanel shared hosting
- NFR-031: MySQL 5.7+ / MariaDB 10.3+
- NFR-032: No Node.js/Redis/Docker/Supervisor required in production
- NFR-033: Cloudflare compatible
- NFR-034: Mobile and desktop responsive

### 4.5 Scalability
- NFR-040: Support 1000+ users per instance
- NFR-041: Efficient pagination and indexing
- NFR-042: Feature-limit middleware for plan enforcement
