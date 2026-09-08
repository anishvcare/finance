# LifeLedger Pro - Cloudflare Setup Guide

## 1. DNS Configuration

1. Add your domain to Cloudflare
2. Update nameservers at your registrar to Cloudflare's
3. Add DNS records:
   - `A` record: `yourdomain.com` → server IP (proxied, orange cloud)
   - `A` record: `www` → server IP (proxied)
   - Or `CNAME` if using a subdomain

## 2. SSL/TLS Configuration

### SSL Mode: Full (Strict)
- Go to SSL/TLS → Overview
- Set encryption mode to **Full (Strict)**
- This requires a valid SSL on the origin server

### Origin Certificate (Recommended)
1. Go to SSL/TLS → Origin Server
2. Create an Origin Certificate
3. Install it on cPanel (SSL/TLS → Install)
4. Set 15-year validity

### Edge Certificates
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"
- Set "Minimum TLS Version" to 1.2

## 3. Caching Rules

### Page Rules (or Cache Rules in new interface)

#### Rule 1: Cache Static Assets (long-term)
- URL pattern: `yourdomain.com/build/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
- Also apply to: `/icons/*`, `/fonts/*`, `/images/public/*`

#### Rule 2: Bypass Cache for API
- URL pattern: `yourdomain.com/api/*`
- Settings:
  - Cache Level: Bypass
  - Disable Performance features

#### Rule 3: Bypass Cache for App
- URL pattern: `yourdomain.com/app/*`
- Settings:
  - Cache Level: Bypass

#### Rule 4: Bypass Cache for Admin
- URL pattern: `yourdomain.com/admin/*`
- Settings:
  - Cache Level: Bypass

#### Rule 5: Bypass Cache for Auth
- URL pattern: `yourdomain.com/login`
- Settings:
  - Cache Level: Bypass
- Also: `/logout`, `/register`, `/install/*`

### Transform Rules (Response Headers)
Add response header for cached assets:
```
If URI path starts with "/build/"
  Set header: Cache-Control = "public, max-age=31536000, immutable"
```

## 4. Performance Settings

### Speed → Optimization
- Auto Minify: Enable (JS, CSS, HTML) — though Vite handles this
- Brotli: Enable
- Early Hints: Enable
- HTTP/2: Enabled by default
- HTTP/3: Enable

### Speed → Polish (Pro plan)
- Lossless image optimization
- WebP conversion

## 5. Security Settings

### WAF (Web Application Firewall)
- Enable Cloudflare managed rules
- Enable OWASP Core Rule Set
- Custom rules if needed:
  - Block requests to `.env` file
  - Block requests to `storage/` directory
  - Rate limit `/api/auth/*` endpoints

### Bot Protection
- Enable Bot Fight Mode
- Configure "Under Attack" mode threshold

### DDoS Protection
- Enabled by default
- Adjust sensitivity if false positives occur

## 6. Laravel Configuration for Cloudflare

### Trusted Proxies (app/Http/Middleware/TrustProxies.php)
```php
class TrustProxies extends Middleware
{
    // Trust all Cloudflare IPs
    protected $proxies = '*';

    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO;
}
```

### Force HTTPS in production (.env)
```
APP_URL=https://yourdomain.com
FORCE_HTTPS=true
```

### AppServiceProvider
```php
if (config('app.force_https') || $this->app->environment('production')) {
    URL::forceScheme('https');
}
```

## 7. Cache Purging

### When to Purge:
- After deploying new version (purge /build/* assets)
- After changing PWA manifest
- After updating public page content

### How to Purge:
- Cloudflare Dashboard → Caching → Purge Cache
- Purge specific URLs or purge everything
- API: `POST https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache`

## 8. Firewall Rules for LifeLedger Pro

### Block sensitive paths:
```
(http.request.uri.path contains "/.env") or
(http.request.uri.path contains "/storage/") or
(http.request.uri.path contains "/.git") or
(http.request.uri.path contains "/vendor/") or
(http.request.uri.path contains "/node_modules/")
→ Action: Block
```

### Rate limit authentication:
```
(http.request.uri.path matches "^/api/auth/")
→ Rate limit: 10 requests per minute per IP
→ Action: Challenge after limit
```

## 9. Workers (Optional Advanced)

For advanced setups, Cloudflare Workers can:
- Add security headers
- Redirect www to non-www
- A/B testing for landing page
- Geographic customization

## 10. Monitoring

- Enable Cloudflare Analytics
- Monitor for:
  - Cache hit ratio (should be high for assets)
  - Error rates (5xx from origin)
  - Blocked threats
  - SSL certificate expiry

## Important Notes

- NEVER enable "Cache Everything" as a global rule
- NEVER cache pages with Set-Cookie headers
- Always test after configuration changes
- Keep origin server SSL valid (avoid "Full" without "Strict")
- Cloudflare free plan is sufficient for most LifeLedger Pro deployments
