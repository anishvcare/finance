# LifeLedger Pro - Google OAuth Setup Guide

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "LifeLedger Pro" (or your app name)
4. Click "Create"

## 2. Configure OAuth Consent Screen

1. Navigate to APIs & Services → OAuth consent screen
2. Select **External** user type
3. Fill in:
   - App name: Your application name
   - User support email: your-email@domain.com
   - App logo: (optional)
   - App domain: https://yourdomain.com
   - Authorized domains: yourdomain.com
   - Developer contact: your-email@domain.com
4. Scopes: Add `email`, `profile`, `openid`
5. Test users: Add your email for testing
6. Save

## 3. Create OAuth Credentials

1. Navigate to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: **Web application**
4. Name: "LifeLedger Pro Web Client"
5. Authorized JavaScript origins:
   - `https://yourdomain.com`
   - `http://localhost:8000` (for development)
6. Authorized redirect URIs:
   - `https://yourdomain.com/auth/google/callback`
   - `http://localhost:8000/auth/google/callback` (for development)
7. Click "Create"
8. Note the **Client ID** and **Client Secret**

## 4. Configure in LifeLedger Pro

### During Installation:
Enter the Client ID and Client Secret in the installation wizard.

### Manual Configuration (.env):
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

## 5. How It Works in the Application

### Login Flow:
1. User clicks "Sign in with Google"
2. Redirected to Google's consent page
3. User grants permission
4. Google redirects back with authorization code
5. Server exchanges code for access token
6. Server fetches user profile (name, email, avatar)
7. If email exists: log in existing user
8. If email doesn't exist: create new account

### Security Measures:
- State parameter prevents CSRF attacks
- Token exchange happens server-side only
- Access tokens are not stored long-term
- Only email, name, and avatar are retrieved
- No Google Drive or other sensitive scopes

## 6. Publishing the App

For production (more than 100 users):
1. Go to OAuth consent screen
2. Click "Publish App"
3. May require Google verification if using sensitive scopes
4. Basic scopes (email, profile) usually don't require verification
5. Submit for review if prompted

## 7. Troubleshooting

**"redirect_uri_mismatch" error:**
- Ensure redirect URI exactly matches (including trailing slash)
- Check HTTP vs HTTPS
- Verify the domain in authorized origins

**"access_denied" error:**
- App may not be published yet
- User may not be in test users list
- Check consent screen configuration

**"invalid_client" error:**
- Client ID or Secret is incorrect
- Credentials may have been deleted/regenerated

**Avatar not loading:**
- Google may return `null` avatar for some accounts
- Application handles this gracefully with default avatar

## 8. Development vs Production

### Development:
- Use `http://localhost:8000` origins
- App can stay in "Testing" mode
- Only test users can authenticate

### Production:
- Use only HTTPS origins
- Publish the app
- Remove localhost origins
- Ensure redirect URI uses production domain
