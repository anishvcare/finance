# Deploy Branch — Ready to Upload to cPanel

This `deploy` branch is a **build-included snapshot**. Unlike the source branches,
it already contains:

- `vendor/` — all PHP dependencies (Composer already run)
- `public/build/` — compiled React + CSS assets and the PWA service worker
- `composer.lock` and `package-lock.json` — pinned dependency versions

**You do NOT need Composer, Node.js, or npm on your server.**

---

## Upload to cPanel (step by step)

### 1. Download this branch as a ZIP
On GitHub: switch to the `deploy` branch → green **Code** button → **Download ZIP**.

### 2. Create a database (cPanel → MySQL Databases)
- Create a database, e.g. `youruser_finance`
- Create a DB user + strong password
- Add the user to the database with **ALL PRIVILEGES**
- Note the database name, username, password, host (usually `localhost`)

### 3. Upload & extract (cPanel → File Manager)
- Upload the ZIP into your target folder (e.g. `/home/youruser/finance`)
- Extract it

### 4. Point your domain to the `public/` folder
- cPanel → **Domains** → set the domain's Document Root to `.../finance/public`
- (If you can't change the doc root, use the `.htaccess` redirect described in
  `docs/cpanel-deployment.md`.)

### 5. Set folder permissions to 775
- `storage/` and all subfolders
- `bootstrap/cache/`

### 6. Run the web installer
- Visit `https://yourdomain.com/install`
- Enter the database details, app name/URL, and create your admin account
- The installer writes `.env`, runs migrations, seeds data, then locks itself

### 7. Add the cron job (cPanel → Cron Jobs)
Run every minute (adjust the PHP path + project path for your account):
```
* * * * * /usr/local/bin/php /home/youruser/finance/artisan schedule:run >> /dev/null 2>&1
```

### 8. Log in
Go to `https://yourdomain.com/login`.

---

## Notes

- If PHP is not 8.2+, set it in cPanel → **Select PHP Version** and enable the
  extensions listed in `docs/installation-guide.md`.
- For Cloudflare, follow `docs/cloudflare-setup.md` (do NOT enable a global
  "Cache Everything" rule).
- Full deployment reference: `docs/cpanel-deployment.md`.
- To re-run the frontend/PHP build yourself later, use `scripts/build-release.sh`
  on a machine with Composer + Node.
