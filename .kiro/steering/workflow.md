---
inclusion: always
---

# Workflow, testing and deployment

## Branches and PRs

- `main` is the source of truth. **`deploy` is what the server tracks** and
  must be kept identical to `main`.
- Work on a branch, open a PR into `main` with `gh api` (not `gh pr`).
- After a PR is merged, fast-forward `deploy`:
  `git push origin <main-sha>:refs/heads/deploy` — confirm it prints
  `old..new`, never force.
- The owner often cannot find GitHub's merge button (it is at the bottom of
  the Conversation tab). He has asked for PRs to be merged for him; confirm
  first if the change is risky.

## Tracked build artifacts

- `vendor/` (production deps only) and `public/build/` are committed so the
  server needs no Composer or npm.
- **Never run `composer install` in the repo** — it pulls dev dependencies
  into tracked `vendor/`. Check `git status --short vendor | wc -l` is `0`
  before committing.
- Any frontend change needs `npm run build` and the rebuilt `public/build`
  committed, or it never reaches users. Grep the compiled assets for a new
  string to prove it landed.
- Node via `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22`.

## Tests

- Run PHP tests in an isolated copy with dev deps, e.g. copy the repo
  (excluding `vendor`, `node_modules`, `.git`) to `/projects/fintest`,
  `composer install` there, then `./vendor/bin/phpunit`. `/tmp` is wiped
  between shell calls; `/projects` persists.
- Baseline on `main`: **81 tests, 287 assertions, 0 failures.** Keep it green.
- `tests/TestCase.php` sends an `Origin` header; Sanctum only starts a session
  for requests whose Origin matches `sanctum.stateful`.
- `UserFactory` produces an activated account; use `->unactivated()` for a
  fresh signup, `->superAdmin()` for an admin.
- Switching `actingAs()` users within one test needs `$this->flushSession()`.
- Only Customer, Invoice, Product, User and Workspace factories exist. Create
  Account/Category/Transaction with `Model::withoutGlobalScopes()->create()`;
  transactions require `account_id`.
- `frontend`: `npx tsc --noEmit` must be clean.

## Deploying to the server (cPanel, terminal access)

Project root `/home/uddjzwrz/finance.nokkoo.in`, document root `public/`,
branch `deploy`. Give the owner exact copy-paste blocks:

```bash
cd /home/uddjzwrz/finance.nokkoo.in
git pull origin deploy
php artisan migrate --force
php artisan config:clear && php artisan route:clear && php artisan view:clear
```

- Back up the DB before migrations. Read credentials from `.env` with
  `sed -n 's/^DB_DATABASE=//p' .env | tail -1 | tr -d '"\r'` (same for
  `DB_USERNAME`, `DB_PASSWORD`) and run SQL through a
  `mysql ... <<'SQL' ... SQL` heredoc — pasting raw SQL into bash fails.
- `.env` is not in git. Settings changes there are manual; live value
  `SESSION_LIFETIME=43200`.
- After a frontend deploy the owner must hard-refresh (`Ctrl+Shift+R`)
  because of the service worker.
- shared hosting: no long-running processes, a one-minute scheduler cron
  only. Anything needing a persistent worker (the WhatsApp agent) goes on the
  owner's VPS.

## Working with the owner

- Not a developer. Explain plainly, avoid jargon, and give runnable commands
  rather than instructions to edit code.
- Often writes in Malayalam or Manglish; reply in Malayalam when he does.
- Verify claims against the code or server output before stating them, and
  say plainly when something is risky (e.g. WhatsApp ban risk).
