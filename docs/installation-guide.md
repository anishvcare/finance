# LifeLedger Pro - Installation Guide

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| PHP | 8.2 | 8.3 |
| MySQL | 5.7 | 8.0 |
| MariaDB | 10.3 | 10.6 |
| Disk Space | 100MB | 500MB+ |
| PHP Memory | 128MB | 256MB |

### Required PHP Extensions
- BCMath, Ctype, cURL, DOM, Fileinfo
- GD (or Imagick), JSON, Mbstring
- OpenSSL, PDO, PDO MySQL
- Tokenizer, XML, Zip

## Installation Methods

### Method 1: Web Installer (Recommended)

1. Upload `lifeledger-pro-release.zip` to your server
2. Extract to your web directory
3. Point your domain to the `/public` folder
4. Navigate to `https://yourdomain.com/install`
5. Follow the wizard steps

### Method 2: Manual Installation (Advanced)

If the web installer cannot write `.env`:

1. Copy `.env.example` to `.env`
2. Edit `.env` with your settings
3. Navigate to `https://yourdomain.com/install`
4. The wizard will detect the existing `.env`
5. Proceed with database setup and admin creation

## Web Installer Steps

### Step 1: Welcome
- Displays application information
- Shows current server environment

### Step 2: Server Requirements
Checks:
- PHP version >= 8.2
- Required extensions installed
- Required functions not disabled
- File upload enabled
- Memory limit adequate

### Step 3: Folder Permissions
Checks write access to:
- `storage/` (and subdirectories)
- `bootstrap/cache/`
- `.env` file location
- `public/build/` (for manifest updates)

### Step 4: Application Configuration
- Application URL (auto-detected)
- Application Name
- Environment (production)
- Debug mode (off for production)
- Timezone
- Default locale

### Step 5: Database Configuration
- Host (default: localhost)
- Port (default: 3306)
- Database name
- Username
- Password
- Connection test button

### Step 6: Email Configuration
- SMTP Host
- SMTP Port
- SMTP Username
- SMTP Password
- Encryption (TLS/SSL)
- From Address
- From Name
- Test email button

### Step 7: Google OAuth (Optional)
- Google Client ID
- Google Client Secret
- Redirect URI (auto-generated)
- Skip option available

### Step 8: PWA Configuration
- Application short name
- Theme color
- Background color

### Step 9: Super Admin Account
- Name
- Email
- Password (min 8 chars)
- Confirm password

### Step 10: Installation
- Generates APP_KEY
- Writes `.env` file
- Runs database migrations
- Runs database seeders
- Creates storage symlink
- Creates admin account
- Locks installer

### Step 11: Complete
- Shows success message
- Links to login page
- Reminds to set up cron job
- Reminds to configure Cloudflare (if applicable)

## .env File Fallback

If the installer cannot write `.env`:
1. Configuration displayed as copyable text
2. User manually creates `.env` via File Manager
3. Installer detects the file on next step
4. Installation continues normally

## Post-Installation

### Required: Set up Cron Job
```
* * * * * /usr/local/bin/php /path/to/artisan schedule:run >> /dev/null 2>&1
```

### Recommended: Verify Email
- Send a test email from admin panel
- Check spam folder if not received

### Recommended: Test PDF
- Create a test invoice
- Download PDF
- Verify formatting

### Recommended: Test Google Login
- Try signing in with Google
- Verify redirect and user creation

## Security Checklist

- [ ] `.env` not accessible via browser
- [ ] `storage/` not browsable
- [ ] Debug mode is OFF
- [ ] SSL/HTTPS active
- [ ] `/install` returns 404 (locked)
- [ ] Strong admin password set
- [ ] Cron job configured
- [ ] File permissions correct
