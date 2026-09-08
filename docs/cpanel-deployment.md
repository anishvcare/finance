# LifeLedger Pro - cPanel Deployment Guide

## Prerequisites

- cPanel shared hosting account
- PHP 8.2 or higher
- MySQL 5.7+ or MariaDB 10.3+
- SSL certificate (free Let's Encrypt via cPanel or Cloudflare)
- FTP/File Manager access
- Cron job access

## Step 1: Prepare Domain

1. Log into cPanel
2. Go to **Domains** or **Addon Domains**
3. Create or select the domain (e.g., `app.yourdomain.com`)
4. Note the **Document Root** path (e.g., `/home/username/public_html/app`)

## Step 2: Create Database

1. Go to **MySQL Databases** in cPanel
2. Create a new database (e.g., `username_lifeledger`)
3. Create a new database user with a strong password
4. Add the user to the database with **ALL PRIVILEGES**
5. Note down:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost`)

## Step 3: Upload Application

### Option A: File Manager
1. Go to **File Manager** in cPanel
2. Navigate to the domain's document root parent
3. Upload `lifeledger-pro-release.zip`
4. Extract the ZIP file
5. Ensure the `public/` folder contents are at the document root level

### Option B: FTP
1. Connect via FTP client (FileZilla, etc.)
2. Upload extracted files to the server
3. Ensure correct directory structure

## Step 4: Configure Document Root

The domain must point to the `/public` directory.

### Option 1: cPanel Domain Settings
- Set document root to `/home/username/lifeledger-pro/public`

### Option 2: .htaccess Redirect (if can't change doc root)
Create `.htaccess` in the domain root:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

## Step 5: Set File Permissions

Via File Manager or Terminal (if available):
```
storage/         → 775
storage/app/     → 775
storage/logs/    → 775
storage/framework/ → 775
bootstrap/cache/ → 775
.env             → 644
```

## Step 6: Run Installation Wizard

1. Navigate to `https://yourdomain.com/install`
2. The wizard will check server requirements
3. Enter database credentials
4. Enter application details
5. Configure email (SMTP settings)
6. Configure Google OAuth (Client ID + Secret)
7. Create Super Admin account
8. Wizard runs migrations and seeds
9. Installation completes and locks

## Step 7: Configure Cron Job

1. Go to **Cron Jobs** in cPanel
2. Add a new cron job:
   - Schedule: `* * * * *` (every minute)
   - Command: `php /home/username/lifeledger-pro/artisan schedule:run >> /dev/null 2>&1`

This handles:
- Overdue invoice status updates
- Reminder delivery
- Queue processing (via schedule)
- Subscription checks


## Step 8: Configure Queue Processing

Since Supervisor is unavailable on shared hosting, use database queue with cron:

The Laravel scheduler already processes queued jobs. The `schedule:run` cron handles:
```php
// In app/Console/Kernel.php
$schedule->command('queue:work --stop-when-empty --max-time=55')
    ->everyMinute()
    ->withoutOverlapping();
```

## Step 9: Configure SSL

### Option A: cPanel SSL
1. Go to **SSL/TLS** in cPanel
2. Use **AutoSSL** or install Let's Encrypt
3. Ensure HTTPS redirect is active

### Option B: Cloudflare SSL (Recommended)
- See `cloudflare-setup.md` for full configuration
- Use "Full (Strict)" SSL mode
- Origin certificate from Cloudflare dashboard

## Step 10: Test the Installation

1. Visit `https://yourdomain.com` - Public website loads
2. Register a new account
3. Try Google Login
4. Create a workspace
5. Create a product and customer
6. Create and download an invoice PDF
7. Check email delivery (send test invoice)
8. Install PWA on mobile device
9. Verify cron is running (check admin health)

## Step 11: Post-Installation Security

1. Verify `/install` returns 404 or redirect (locked)
2. Ensure `.env` is not publicly accessible
3. Check `storage/` is not browsable
4. Verify `debug` mode is OFF in production
5. Test that HTTPS redirect works

## Troubleshooting

### Common Issues:

**500 Internal Server Error:**
- Check `storage/logs/laravel.log`
- Verify file permissions on storage/
- Ensure PHP version is 8.2+
- Check .env file exists and is readable

**Database Connection Error:**
- Verify credentials in .env
- Check database host (usually `localhost` on cPanel)
- Ensure user has privileges on the database

**Blank Page:**
- PHP version mismatch
- Missing PHP extensions (check install wizard requirements)
- .htaccess not processing (mod_rewrite disabled)

**Email Not Sending:**
- Verify SMTP settings in admin panel
- Some hosts block port 587/465; try port 25
- Check if hosting requires specific SMTP (e.g., their own relay)

**PDF Not Generating:**
- Ensure GD or Imagick extension is installed
- Check storage/app/private is writable
- Verify mbstring and dom extensions present

**Cron Not Running:**
- Verify full PHP path in cron command
- Check PHP CLI version matches web version
- Add full paths: `/usr/local/bin/php /home/user/app/artisan schedule:run`

## Required PHP Extensions

- BCMath
- Ctype
- cURL
- DOM
- Fileinfo
- GD or Imagick
- JSON
- Mbstring
- OpenSSL
- PDO
- PDO MySQL
- Tokenizer
- XML
- Zip

## Backup Strategy

1. **Database:** Use cPanel's backup wizard or mysqldump via cron
2. **Files:** Backup `storage/app` (attachments, logos, PDFs)
3. **Configuration:** Keep `.env` backed up securely
4. Schedule weekly full backup via cPanel

## Updating the Application

1. Put in maintenance mode: visit `/admin/maintenance` (if terminal unavailable)
2. Upload new release ZIP
3. Extract and overwrite files (except .env and storage/app)
4. Navigate to `/admin/update` to run new migrations
5. Clear caches via admin panel
6. Disable maintenance mode
