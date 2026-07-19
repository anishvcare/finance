# LifeLedger Pro - PWA Architecture

## 1. Overview

The PWA implementation provides:
- Installable app experience on mobile and desktop
- Offline access to app shell and cached data
- Background sync for offline-created records
- Push notifications for reminders
- Automatic update detection

## 2. Technology Stack

- **Vite PWA Plugin** (vite-plugin-pwa) for manifest and SW generation
- **Workbox** for service worker strategies
- **Dexie.js** for IndexedDB operations
- **Web Push API** for notifications

## 3. Web App Manifest

```json
{
  "name": "LifeLedger Pro",
  "short_name": "LifeLedger",
  "description": "Personal Finance & Business Management",
  "start_url": "/app/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 4. Service Worker Strategy

### Caching Strategies:
```
App Shell (HTML, JS, CSS)     → CacheFirst (with network update)
API Responses                 → NetworkFirst (with cache fallback)
Static Assets (images, fonts) → CacheFirst (immutable, versioned)
PDF Downloads                 → NetworkOnly
Authentication endpoints      → NetworkOnly
```

### Precache:
- Main app shell HTML
- All JS/CSS bundles
- Critical icons and images
- Offline fallback page

### Runtime Cache:
- API GET responses (with TTL)
- Dashboard summary data
- Product/service/customer lists (stale-while-revalidate)

## 5. Offline Data Architecture (Dexie.js)

### IndexedDB Schema:
```typescript
const db = new Dexie('LifeLedgerPro');

db.version(1).stores({
  // Sync queue for offline mutations
  syncQueue: '++id, type, entity, status, createdAt',

  // Cached entities for offline access
  products: 'id, workspaceId, name, *tags',
  services: 'id, workspaceId, name',
  customers: 'id, workspaceId, name',
  suppliers: 'id, workspaceId, name',
  transactions: 'id, uuid, workspaceId, date',
  tasks: 'id, workspaceId, status, dueDate',
  commitments: 'id, workspaceId, status, dueDate',

  // Draft documents (created offline)
  draftInvoices: '++localId, uuid, workspaceId, status',
  draftQuotes: '++localId, uuid, workspaceId, status',
  draftTransactions: '++localId, uuid, workspaceId, status',

  // Settings cache
  settings: 'key',
  workspace: 'id',
});
```

## 6. Offline Capability

### What works offline:
- View cached dashboard data
- Browse cached products, services, customers
- Create draft transactions
- Create draft invoices (no final number assigned)
- Create draft quotes
- Create/update tasks
- View cached reports
- OCR screenshot scanning (Tesseract.js is client-side)

### What requires network:
- Finalising invoices (needs server number)
- Sending emails
- PDF generation
- Payment recording (server-authoritative)
- Authentication
- Real-time data refresh

## 7. Sync Queue

### Offline Record Lifecycle:
```
1. User creates record offline → UUID generated client-side
2. Record saved to IndexedDB with status 'pending_sync'
3. UI shows "Draft (offline)" badge
4. When online: Background Sync triggered
5. Records sent to server one by one
6. Server validates, assigns official numbers
7. Client updates local record with server response
8. Status changes to 'synced'
```

### Conflict Resolution:
- Client-generated UUIDs prevent duplicates
- Server rejects duplicate UUIDs gracefully
- Last-write-wins for non-financial data
- Financial records require manual resolution if conflict detected
- Invoice numbers assigned server-side only (never offline)

## 8. Install App Experience

### Desktop (Chrome/Edge):
- `beforeinstallprompt` event captured
- Custom "Install App" button in header/sidebar
- Installation criteria: HTTPS + manifest + service worker

### Android (Chrome):
- Same beforeinstallprompt flow
- Native add-to-homescreen banner (if criteria met)
- Custom install UI with app preview

### iOS (Safari):
- No beforeinstallprompt event available
- Show manual instructions: "Tap Share → Add to Home Screen"
- Detect iOS via user agent, show iOS-specific guidance
- Display instruction modal on first visit

### Detection:
```typescript
// Check if already installed
const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;

// Detect platform for instructions
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);
```

## 9. Update Flow

1. New service worker detected
2. New SW waits in 'waiting' state
3. User shown "Update Available" toast
4. User clicks "Update Now"
5. `skipWaiting()` called on new SW
6. Page reloads with new version

## 10. Push Notifications

### Setup:
- VAPID keys generated during installation
- User subscribes from notification settings
- Subscription stored server-side per user

### Delivery:
- Server sends push via Web Push protocol
- Service worker receives push event
- Notification displayed even when app closed
- Click handler opens relevant app page

### Use Cases:
- Invoice due tomorrow
- Invoice overdue
- Payment received
- Task due today
- Commitment deadline approaching
- Quote expiring soon

## 11. Security Considerations

### On Logout:
- Clear all IndexedDB tables (Dexie.js bulk delete)
- Unregister service worker push subscription
- Clear service worker cache (specific user data caches)
- Keep app shell cache (non-sensitive)
- Clear localStorage/sessionStorage

### Data Sensitivity:
- Never cache financial details in SW cache (use IndexedDB with encryption consideration)
- Don't cache other users' data
- Offline drafts are device-local only
- Sync queue entries contain minimum data needed

## 12. Build Configuration

```typescript
// vite.config.ts (relevant PWA section)
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'fonts/*.woff2'],
      manifest: { /* as defined above */ },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100, maxAgeSeconds: 300 } }
          }
        ],
        navigateFallback: '/app/dashboard',
        navigateFallbackAllowlist: [/^\/app/],
      }
    })
  ]
});
```
