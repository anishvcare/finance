# LifeLedger Pro - Security Model

## 1. Authentication Security

### Session Management
- Laravel Sanctum session-based authentication (SPA mode)
- HTTP-only, Secure, SameSite=Lax cookies
- CSRF protection via XSRF-TOKEN cookie
- Session regeneration on login and logout
- Configurable session lifetime (default: 120 minutes)
- Session revocation capability

### Password Security
- bcrypt hashing (cost factor 12)
- Minimum 8 characters, mixed requirements
- Rate limiting: 5 attempts per minute per IP
- Lockout after 5 consecutive failures (5-minute cooldown)

### Google OAuth
- State parameter validation (CSRF for OAuth)
- Nonce verification
- Secure token exchange (server-side only)
- No OAuth tokens stored in browser
- Account linking rules: email match required


## 2. Workspace Isolation (Tenant Security)

### Data Isolation Strategy
- Every query automatically scoped via `WorkspaceScope` trait
- Middleware validates workspace membership on every API request
- Policy checks on every model action
- workspace_id never trusted from client input for ownership
- Cross-workspace access attempts logged and blocked

### Implementation Pattern
```php
// Model Trait
trait BelongsToWorkspace {
    protected static function bootBelongsToWorkspace() {
        static::addGlobalScope(new WorkspaceScope());
        static::creating(function ($model) {
            $model->workspace_id = auth()->user()->current_workspace_id;
        });
    }
}

// Middleware
class EnsureWorkspaceMember {
    public function handle($request, Closure $next) {
        $workspaceId = $request->user()->current_workspace_id;
        if (!$request->user()->belongsToWorkspace($workspaceId)) {
            abort(403, 'Not a member of this workspace');
        }
        return $next($request);
    }
}
```

### Isolation Test Coverage
- Direct URL manipulation with other workspace IDs
- API parameter injection with foreign workspace_id
- PDF download attempts for other workspace invoices
- Share link enumeration attempts
- Report generation for other workspaces

## 3. Authorization (RBAC)

### Role Permissions Matrix

| Action | Owner | Admin | Accountant | Manager | Staff | Viewer |
|--------|-------|-------|------------|---------|-------|--------|
| Manage workspace settings | Y | Y | N | N | N | N |
| Invite members | Y | Y | N | Y | N | N |
| Remove members | Y | Y | N | N | N | N |
| View financial data | Y | Y | Y | Y | Y | Y |
| Create invoices | Y | Y | Y | Y | Y | N |
| Finalise invoices | Y | Y | Y | N | N | N |
| Void invoices | Y | Y | N | N | N | N |
| Record payments | Y | Y | Y | Y | N | N |
| View reports | Y | Y | Y | Y | N | N |
| Manage products | Y | Y | N | Y | Y | N |
| Delete data | Y | Y | N | N | N | N |
| View bank details | Y | Y | Y | N | N | N |
| Export data | Y | Y | Y | N | N | N |

### Policy Implementation
- Laravel Gate and Policy classes for each model
- Middleware-based role checks for route groups
- Blade and React conditional rendering based on permissions
- API returns 403 with generic message (no information leakage)

## 4. Input Security

### Request Validation
- Laravel Form Requests for all API endpoints
- Zod validation on React frontend (preview only)
- Server-side authoritative validation always
- Type-safe input processing

### XSS Prevention
- Blade: `{{ }}` auto-escaping (never `{!! !!}` for user content)
- React: automatic JSX escaping
- Content-Security-Policy headers
- DOMPurify for any HTML rendering

### SQL Injection Prevention
- Eloquent ORM parameterized queries
- No raw queries with user input
- Strict type casting for IDs

### Mass Assignment Protection
- `$fillable` or `$guarded` on all models
- Never `Model::create($request->all())`
- Explicit field mapping in form requests

## 5. File Security

### Upload Validation
- Whitelist allowed MIME types
- Maximum file size enforcement (logo: 2MB, attachments: 10MB)
- Image dimension validation
- Filename sanitization
- Store in private disk (not publicly accessible)
- Serve via authenticated controller routes

### Storage Access
- Invoice PDFs: private storage, served via signed URL
- Logo images: public storage (workspace-specific path)
- Attachments: private, require authentication + workspace membership
- OCR images: not stored by default; stored privately if user opts in

## 6. Financial Security

### Immutability Rules
- Finalised invoice totals cannot be silently changed
- Payment history cannot be erased
- Line-item snapshots preserved at time of creation
- Activity log records all financial changes
- Database transactions for all financial operations

### Calculation Security
- Server recalculates all totals (never trust frontend)
- Integer arithmetic for monetary values (avoid floating point)
- Atomic sequence generation for document numbers
- Database locks during number generation

## 7. Infrastructure Security

### Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Cloudflare Integration
- Trusted proxy detection (Cloudflare IP ranges)
- Real IP extraction from CF-Connecting-IP header
- HTTPS detection behind Cloudflare proxy

### Rate Limiting
- Authentication endpoints: 5/minute
- API endpoints: 60/minute per user
- Password reset: 3/hour
- Email sending: 10/minute per workspace
- OCR processing: 20/hour per user

## 8. Sensitive Data Handling

### Encryption at Rest
- Bank account numbers: encrypted (application-level)
- OAuth secrets: encrypted in settings
- SMTP passwords: encrypted in settings

### Logging Restrictions
Never log:
- Passwords (plain or hashed)
- Full bank account numbers
- OAuth tokens/secrets
- Session cookies
- CSRF tokens
- Invoice internal notes
- Customer financial details
- OCR extracted text (may contain bank info)

### Data Export & Deletion
- Users can export all their data (GDPR-style)
- Account deletion cascades workspace removal (if sole owner)
- Soft deletes for financial records (audit compliance)
- Hard delete only for non-financial personal data

## 9. Installation Security

### Installer Protection
- /install routes blocked after successful installation
- Installation lock file prevents re-execution
- Admin password never displayed after creation
- Database credentials validated but not logged
- .env file permissions checked (0644 recommended)

## 10. Invoice Share Link Security

- 64-character cryptographically random tokens
- Configurable expiry (default: 30 days)
- Revocable at any time
- Read-only access (no editing)
- Internal notes never shown
- No workspace context exposed
- Rate limited to prevent enumeration
