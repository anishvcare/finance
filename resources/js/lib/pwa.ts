/**
 * PWA utilities for install prompt and detection
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Capture the install prompt event
window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    // Dispatch custom event so React components know install is available
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
});

export function canInstall(): boolean {
    return deferredPrompt !== null;
}

export async function promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;

    return outcome === 'accepted';
}

export function isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true;
}

export function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
}

/**
 * Register service worker update handler
 */
export function onServiceWorkerUpdate(callback: () => void): void {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', callback);
    }
}

/**
 * Skip waiting on new service worker
 */
export async function activateNewServiceWorker(): Promise<void> {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}
