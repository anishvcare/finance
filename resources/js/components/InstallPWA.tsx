import React, { useState, useEffect } from 'react';
import { canInstall, promptInstall, isInstalled, isIOS } from '../lib/pwa';
import { Download, X, Smartphone } from 'lucide-react';

export function InstallPWABanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        if (isInstalled()) return;

        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

        if (isIOS()) {
            setShowIOSGuide(true);
            setShowBanner(true);
            return;
        }

        const check = () => { if (canInstall()) setShowBanner(true); };
        check();
        window.addEventListener('pwa-install-available', check);
        return () => window.removeEventListener('pwa-install-available', check);
    }, []);

    const handleInstall = async () => {
        if (isIOS()) {
            setShowIOSGuide(true);
            return;
        }
        const accepted = await promptInstall();
        if (accepted) setShowBanner(false);
    };

    const dismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
            <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Install App</h3>
                    {showIOSGuide ? (
                        <p className="text-xs text-gray-500 mt-1">
                            Tap <strong>Share</strong> (box with arrow) then <strong>"Add to Home Screen"</strong>
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">Install LifeLedger Pro for quick access and offline support.</p>
                    )}
                    {!showIOSGuide && (
                        <button onClick={handleInstall} className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center space-x-1">
                            <Download className="w-3 h-3" /><span>Install App</span>
                        </button>
                    )}
                </div>
                <button onClick={dismiss} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
        </div>
    );
}
