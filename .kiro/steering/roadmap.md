---
inclusion: always
---

# Status and roadmap

## Shipped (merged to `main`, deployed)

- PR #2 Sidebar Business/Personal switcher on every page, combined overview
  (`/app/overview`), transfers between workspaces (`transactions.direction_hint`)
- PR #3 Workspace-scoped validation; fixed registration 500 (missing
  `verification.verify` route); test-suite fixes
- PR #4 Merged the old `deploy`-only bank-branch work into `main`, rebuilt assets
- PR #5 Missing `PUT /api/auth/user`, which had stopped onboarding completing
- PR #6 Admin-issued activation codes, "keep me signed in" now actually sent

Data cleanup already done on the server: Ryan's empty duplicate workspaces
3, 4, 5 soft-deleted. Both users grandfathered with `activated_at`.

## Known gaps, not yet fixed

1. Google OAuth: browser `GET /auth/google/callback` hits `googleCallback`,
   which returns JSON, so users land on a raw JSON page. It also uses
   `->stateless()`.
2. 15 Blade views referenced in `routes/web.php` do not exist (only
   `pages.home`, `auth.login`, `auth.register` do). Includes `/pricing`,
   `pages.invoice-public` and **both password-reset views** — password reset
   cannot be completed in a browser. Most urgent.
3. `AdminDashboardController::plans()` and `healthCheck()` lack
   `isSuperAdmin()`.
4. `feature.limit` (`CheckFeatureLimit`) is attached to zero routes, so plan
   limits are unenforced. No subscription is ever created (table has 0 rows);
   `Workspace::subscription()` only matches `active` though the column
   defaults to `trial`. No billing SDK.
5. No team-invite flow (see `accepted_at` note in `project.md`).
6. Onboarding "Skip for now" loops; `register` has no throttle.

## In progress: Notion sync (agreed with the owner)

Goal: he records things in Notion and sees summaries in the app.

- Direction per record type — one home each:
  expenses/income live in **Notion → app**; tasks and commitments live in
  Notion with status syncing both ways; invoices are owned by the app.
- Invoices via an **"Invoice Requests"** Notion database plus a related
  **"Invoice Items"** database (invoices have many lines). Setting status to
  `Generate` makes the app create a **draft** invoice, computing totals
  itself, then write back invoice number, total, status, a **View** link and
  a **Download** link. Unmatched customer/product is written back as an
  error, never guessed. Draft only was his choice.
- Download link: `/api/...` URLs redirect to login when opened as a top-level
  navigation (see comment in `resources/js/lib/api.ts`), so the PDF link needs
  a session-authenticated web route. Verify before building.
- Mechanism: Notion webhooks (events carry no content; fetch the page after)
  plus a scheduler catch-up poll. Runs fine on cPanel. Current Notion API uses
  `data_source_id` rather than `database_id` for most operations.
- Must have: a Notion-page ↔ record link table (idempotency), loop protection
  for our own write-backs, deletion in Notion flags for review rather than
  deleting, and account balance correction when an amount is edited.
- Build order: 1 expenses/income, 2 tasks + commitments, 3 invoice requests,
  4 optional summary page.
- **Blocked on the owner:** he was unsure where his Notion expenses live and
  whether they are a database or plain text. Proposed schema if he creates
  one: Name (title), Date, Amount (number), Type (Income/Expense),
  Category, Account (Cash/Bank/GPay), Workspace (Business/Personal), Note.
  Then he creates an integration at notion.so/profile/integrations and shares
  the databases with it.

## Planned: WhatsApp AI assistant

Design doc on the open PR #7 branch `docs/whatsapp-ai-agent-design`
(`docs/whatsapp-ai-agent-design.md`). That doc describes a single shared
number for all tenants; **the owner has since chosen a single-user version**
and the doc has not been updated yet:

- two numbers: number 1 linked by QR to the app, number 2 his normal phone;
  only messages from an allowlisted sender are handled
  (`WHATSAPP_ENABLED`, `WHATSAPP_ALLOWED_SENDERS`)
- feature-gated inside the existing SaaS rather than a fork
- Evolution API (Baileys) on his VPS; DeepSeek key entered in the admin panel;
  Malayalam voice notes (Sarvam AI, Google `ml-IN` fallback)
- rules that still apply: every write is previewed and confirmed
  (`YES <token>`), the server computes all money, reply only and never
  message third parties, and bind workspace context explicitly in the worker
- the QR protocol breaches WhatsApp's ToS; risk is low at single-user volume
  but not zero
