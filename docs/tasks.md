# LifeLedger Pro - Implementation Tasks

## Phase 2: Laravel Foundation

- [x] Create Laravel project structure
- [ ] Configure composer.json with all dependencies
- [ ] Set up .env.example with all required variables
- [ ] Create database migrations (all tables)
- [ ] Create Eloquent models with relationships
- [ ] Create BelongsToWorkspace trait with global scope
- [ ] Create WorkspaceScope class
- [ ] Implement authentication (register, login, logout)
- [ ] Configure Laravel Sanctum (SPA mode)
- [ ] Implement Google OAuth with Socialite
- [ ] Create workspace creation and management
- [ ] Create workspace membership and roles
- [ ] Create role-based middleware
- [ ] Create workspace isolation middleware
- [ ] Create feature limit middleware
- [ ] Create Laravel policies for all models
- [ ] Create form request validation classes
- [ ] Create public Blade layout and pages
- [ ] Configure trusted proxies for Cloudflare
- [ ] Set up cache headers middleware
- [ ] Create app shell Blade view for React SPA
- [ ] Configure routes (web, api, admin, install)

## Phase 3: React Foundation

- [ ] Set up Vite with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up React Router with lazy loading
- [ ] Create API client (axios with CSRF)
- [ ] Set up TanStack Query provider
- [ ] Create authentication context/store
- [ ] Create workspace context
- [ ] Build AppLayout (sidebar, header, mobile nav)
- [ ] Build AuthLayout
- [ ] Create base UI components (Button, Input, Select, Modal, Table)
- [ ] Create form components with React Hook Form + Zod
- [ ] Set up Dexie.js database schema
- [ ] Create sync queue utility
- [ ] Build login page
- [ ] Build register page
- [ ] Build onboarding flow

## Phase 4: Organisation Profile

- [ ] Workspace settings API endpoints
- [ ] Workspace branding API endpoints
- [ ] Logo upload endpoint
- [ ] Signature/stamp upload endpoints
- [ ] Settings React page (form with all fields)
- [ ] Branding React page
- [ ] Invoice configuration page
- [ ] Document sequence management

## Phase 5: Customers & Suppliers

- [ ] Customer CRUD API
- [ ] Supplier CRUD API
- [ ] Contact CRUD API
- [ ] Customer list page with search/filter
- [ ] Customer detail page
- [ ] Customer create/edit form
- [ ] Supplier list page
- [ ] Supplier detail page
- [ ] Supplier create/edit form
- [ ] CSV import/export endpoints
- [ ] Contact management UI

## Phase 6: Products & Services

- [ ] Product CRUD API
- [ ] Service CRUD API
- [ ] Category management API
- [ ] Price history tracking
- [ ] Product list page with search/filter
- [ ] Product create/edit form
- [ ] Service list page
- [ ] Service create/edit form
- [ ] Category management UI
- [ ] CSV import/export
- [ ] Product image upload

## Phase 7: Quotes

- [ ] Quote CRUD API
- [ ] Quote calculation service
- [ ] Quote number generation
- [ ] Quote PDF generation (Blade template)
- [ ] Quote email delivery
- [ ] Quote → Invoice conversion action
- [ ] Quote list page
- [ ] Quote create/edit page (line item editor)
- [ ] Quote preview page
- [ ] Quote status management
- [ ] Quote reminder scheduling

## Phase 8: Invoices

- [ ] Invoice CRUD API
- [ ] Invoice calculation service (server-authoritative)
- [ ] Invoice number generation (thread-safe)
- [ ] Invoice finalisation action
- [ ] Invoice PDF generation (3 templates)
- [ ] Invoice email delivery
- [ ] Secure share link generation
- [ ] Invoice list page with filters
- [ ] Invoice create/edit page (line item editor)
- [ ] Invoice preview page
- [ ] Invoice PDF download
- [ ] Invoice email sending UI
- [ ] Payment recording from invoice view
- [ ] Overdue status auto-detection (scheduler)
- [ ] Invoice reminder scheduling

## Phase 9: Bills

- [ ] Bill CRUD API
- [ ] Bill calculation service
- [ ] Bill number generation
- [ ] Bill payment recording
- [ ] Bill → expense transaction linking
- [ ] Bill attachment upload
- [ ] Bill list page
- [ ] Bill create/edit page
- [ ] Bill payment UI
- [ ] Overdue detection

## Phase 10: Payments

- [ ] Payment CRUD API
- [ ] Payment allocation service
- [ ] Multi-invoice allocation
- [ ] Payment receipt generation
- [ ] Refund recording
- [ ] Overpayment handling
- [ ] Payment list page
- [ ] Payment recording form
- [ ] Payment allocation UI
- [ ] Payment receipt download

## Phase 11: Personal Finance

- [ ] Account CRUD API
- [ ] Transaction CRUD API
- [ ] Transfer between accounts
- [ ] Category management
- [ ] Budget CRUD API
- [ ] Recurring transaction scheduling
- [ ] Account list page
- [ ] Transaction list with filters
- [ ] Transaction create/edit form
- [ ] OCR import UI (Tesseract.js integration)
- [ ] Budget tracking page

## Phase 12: Tasks & Commitments

- [ ] Task CRUD API
- [ ] Subtask management
- [ ] Recurring task scheduling
- [ ] Commitment CRUD API
- [ ] Milestone management
- [ ] Task list page
- [ ] Task detail page
- [ ] Commitment list page
- [ ] Commitment detail page
- [ ] Calendar view
- [ ] Timeline view

## Phase 13: Notifications

- [ ] Notification model and database
- [ ] In-app notification system
- [ ] Email notification templates
- [ ] Push notification (VAPID setup)
- [ ] Reminder scheduler (cron-based)
- [ ] Invoice due/overdue reminders
- [ ] Bill due/overdue reminders
- [ ] Task/commitment reminders
- [ ] Notification preferences UI
- [ ] Notification center UI

## Phase 14: PWA & Offline

- [ ] Configure Vite PWA plugin
- [ ] Generate web manifest
- [ ] Create service worker configuration
- [ ] Implement offline fallback page
- [ ] Configure caching strategies
- [ ] Implement Install App UI
- [ ] iOS installation instructions
- [ ] Offline draft creation (transactions, invoices)
- [ ] Sync queue implementation
- [ ] Background sync handler
- [ ] Update notification UI
- [ ] Logout cleanup (IndexedDB clear)

## Phase 15: Reports

- [ ] Report generation service
- [ ] Sales reports API
- [ ] Purchase reports API
- [ ] Invoice ageing API
- [ ] Bill ageing API
- [ ] Cash flow API
- [ ] Profitability API
- [ ] Personal finance reports API
- [ ] Task/commitment reports API
- [ ] Report pages with filters
- [ ] Chart components (Recharts)
- [ ] CSV export
- [ ] PDF export

## Phase 16: Admin & SaaS

- [ ] Admin middleware and layout
- [ ] User management API
- [ ] Workspace management API
- [ ] Plan CRUD API
- [ ] Usage tracking service
- [ ] Feature limit enforcement
- [ ] System health checks
- [ ] Audit log viewer
- [ ] Admin dashboard page
- [ ] User management page
- [ ] Plan management page
- [ ] Settings management page
- [ ] Health check page

## Phase 17: Installer

- [ ] Install routes and controller
- [ ] Requirement checker service
- [ ] Permission checker service
- [ ] .env writer service (with fallback)
- [ ] Database migration runner
- [ ] Seeder runner
- [ ] Admin creator
- [ ] Installation lock mechanism
- [ ] Installer Blade views (step-by-step)
- [ ] Post-install redirect

## Phase 18: Testing & Release

- [ ] Unit tests for calculation services
- [ ] Feature tests for all API endpoints
- [ ] Tenant isolation tests
- [ ] Authentication tests
- [ ] Installer tests
- [ ] Security tests
- [ ] Build production assets
- [ ] Create release ZIP package
- [ ] Final documentation review
- [ ] Deployment test on clean environment
