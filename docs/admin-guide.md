# LifeLedger Pro - Admin Guide

## Super Admin Access

The Super Admin account is created during installation. Super Admins can:
- Manage all users
- Manage all workspaces (without seeing private financial data)
- Configure application settings
- Manage subscription plans
- Monitor system health
- View audit logs

## Admin Panel

Access at: `/admin/dashboard`

## User Management

### View Users
- List all registered users
- Filter by status (active, suspended)
- Search by name or email
- View registration date and last login

### User Actions
- Suspend user (blocks login)
- Reactivate user
- Reset password (sends reset email)
- View user's workspaces (metadata only)
- Delete user (with data handling options)

### Privacy Rules
- Admin cannot view user's invoices, financial data, or notes
- Admin can see usage statistics (counts, not content)
- Support access requires explicit user permission + audit log

## Workspace Management

### View Workspaces
- List all workspaces
- Filter by type (personal/business)
- View member count and owner
- View plan and usage metrics

### Workspace Actions
- Suspend workspace (blocks all access)
- Reactivate workspace
- Adjust plan/limits
- View storage usage

## Subscription Plans

### Plan Configuration
Each plan defines limits for:
- Number of workspaces
- Members per workspace
- Products and services
- Monthly invoices
- Monthly bills
- Monthly transactions
- Monthly OCR scans
- Storage (MB)
- Available features (JSON flags)

### Managing Plans
1. Navigate to Admin → Plans
2. Create or edit plans
3. Set limits and pricing
4. Activate/deactivate plans
5. Assign default plan for new registrations

### Feature Flags
```json
{
  "invoicing": true,
  "quotes": true,
  "bills": true,
  "reports_advanced": false,
  "custom_templates": false,
  "team_roles": false,
  "email_reminders": true,
  "push_notifications": false,
  "csv_export": true,
  "api_access": false
}
```

## Application Settings

### General
- Application name
- Short name (PWA)
- Application URL
- Support email
- Default currency
- Default timezone
- Registration enabled/disabled
- Email verification required

### Branding
- Logo (used on public pages)
- Favicon
- PWA icons
- Theme colors
- Landing page text
- Footer text

### Email
- SMTP configuration
- From address and name
- Test email functionality
- Email queue status

### Google OAuth
- Client ID status (configured/not configured)
- Redirect URI display
- Enable/disable Google login

### PWA
- Short name
- Theme color
- Background color
- Icon status

## System Health

### Health Checks
- Database connection
- Storage write access
- Cache status
- Queue status (jobs pending/failed)
- Cron job status (last run time)
- PHP version and extensions
- Disk space usage
- Email deliverability

### Failed Jobs
- View failed job list
- Retry failed jobs
- Clear old failed jobs

### Audit Logs
- View all system activity
- Filter by user, action, date
- Track admin actions
- Security-relevant events highlighted

## Maintenance Mode

### Enable Maintenance
1. Go to Admin → System
2. Click "Enable Maintenance Mode"
3. Application shows maintenance page to users
4. Admin can still access (via secret URL or IP whitelist)

### Disable Maintenance
1. Go to Admin → System
2. Click "Disable Maintenance Mode"
3. Application returns to normal

## Cron Job Monitoring

### Expected Schedule Tasks:
- `queue:work` - Every minute (process queued jobs)
- `schedule:run` - Every minute (run scheduled tasks)
- Check overdue invoices - Daily
- Check overdue bills - Daily
- Send reminders - As scheduled
- Clean expired share links - Weekly
- Clean old activity logs - Monthly

### Verification:
- Admin dashboard shows "Last cron run" timestamp
- Warning if cron hasn't run in > 5 minutes
- Failed job count displayed

## Security Monitoring

### What to Watch:
- Failed login attempts (rate limiting active)
- Cross-workspace access attempts (should be 0)
- File access violations
- Unusual API usage patterns

### Regular Security Tasks:
- Review audit logs weekly
- Check failed jobs for patterns
- Verify SSL certificate validity
- Update application when patches available
- Review user access periodically
