---
inclusion: always
---

# LifeLedger Pro — project context

Multi-tenant SaaS for personal finance plus business billing (invoices, quotes,
bills, payments), tasks and commitments. Live at https://finance.nokkoo.in.
Pre-launch: two real users (id 1 `anishvcare@gmail.com`, super admin; id 2
`ryanvcare@gmail.com`). Owner: Anish, working from Kerala, prices in INR.

## Stack

- Laravel 11, PHP 8.2+ (server CLI is 8.3), MySQL, Sanctum **stateful SPA**
  auth (session cookies, not tokens)
- React 18 + TypeScript + Vite + Tailwind + TanStack Query, served under
  `/app` (`BrowserRouter basename="/app"`), PWA with a service worker
- Blade only for public pages and auth pages (`resources/views/auth/*`)

## Tenancy model — read before touching data access

- A user belongs to workspaces via `workspace_members`. Each workspace has
  `type` `business` or `personal`. The sidebar switcher
  (`resources/js/lib/useWorkspaceSwitch.ts`) switches or creates them.
- 16 models use `App\Traits\BelongsToWorkspace`, which adds
  `App\Scopes\WorkspaceScope`.
- **`WorkspaceScope` only applies when `auth()->check()` is true.** In queue
  jobs, console commands and webhooks there is no authenticated user, so
  `Invoice::all()` returns every tenant's invoices. Any non-HTTP code must set
  context explicitly (`Auth::setUser(...)`) and also filter by `workspace_id`
  directly.
- **Never use plain `exists:<table>,id` for a workspace-owned table.** The
  validator's raw query ignores global scopes, which was a cross-tenant hole
  across 57 rules. Use `$this->existsInWorkspace('customers')` or
  `$this->existsAsWorkspaceMember()` from
  `App\Traits\ValidatesWorkspaceOwnership` (on the base `Controller`).
- Cross-workspace features (`OverviewController`,
  `WorkspaceTransferController`) use `withoutGlobalScopes()` and must always
  constrain to `$request->user()->workspaces()` ids.
- `workspace_members.accepted_at` is currently ignored everywhere. Any
  future team-invite feature must filter on it, or invitees get access before
  accepting.

## Money

- Amounts are integer minor units (paise). Frontend converts with
  `Math.round(x * 100)` and displays with `formatMoney()`.
- Totals, tax and rounding come from `InvoiceCalculationService`. Nothing
  else — especially not an LLM — computes money.
- Invoice numbers come from `DocumentNumberService`. Invoices are created as
  `DRAFT-xxxx` and get a real `INC-YYYY-NNNNN` number only on finalise.

## Access control

- New accounts must redeem an admin-issued activation code
  (`ActivationCode`, `POST /api/auth/activate`). The `activated` middleware
  gates the workspace-scoped API group; `/auth/user`, `/auth/activate` and
  `/auth/logout` stay reachable. Redeeming also provisions a business
  workspace and sets `onboarding_completed`.
- Admin endpoints live in `routes/admin.php` (prefix `api/admin`) and each
  method re-checks `isSuperAdmin()`. `AdminDashboardController::plans()` and
  `healthCheck()` are still missing that guard.
- Admin UI: `resources/js/pages/Admin/ActivationCodes.tsx`, sidebar "Admin"
  section shown only to super admins.
