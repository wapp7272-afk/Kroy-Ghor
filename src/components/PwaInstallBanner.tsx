import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Sparkles, 
  WifiOff, 
  CheckCircle2, 
  Smartphone,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { VaultLogo } from './VaultLogo';

export interface PwaInstallBannerProps {
  showToast?: (message: string) => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ showToast }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('primevault_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('primevault_notifications') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (showToast) showToast('✓ Network restored! Online connection active.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      if (showToast) showToast('⚠️ You are offline. Browsing cached catalog.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const handleInstallClick = () => {
    setIsInstalled(true);
    setIsDismissed(true);
    try {
      localStorage.setItem('primevault_pwa_dismissed', 'true');
    } catch {}
    if (showToast) {
      showToast('🎉 ZeropicBD installed to home screen!');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('zeropicbd_pwa_dismissed', 'true');
      localStorage.setItem('primevault_pwa_dismissed', 'true');
    } catch {}
  };

  const handleToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      localStorage.setItem('zeropicbd_notifications', next ? 'true' : 'false');
      localStorage.setItem('primevault_notifications', next ? 'true' : 'false');
    } catch {}
    if (showToast) {
      showToast(next ? '🔔 Push notifications enabled for order dispatch!' : 'Notifications muted.');
    }
  };

  return (
    <>
      {/* Offline Status Sticky Ribbon */}
      {isOffline && (
        <div 
          className="sticky top-0 z-50 bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-pulse"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active • You are viewing cached products and offline wallet data</span>
        </div>
      )}

      {/* Floating PWA Install & Push Notification Banner */}
      {!isDismissed && !isInstalled && (
        <aside 
          aria-label="Install ZeropicBD Mobile App"
          className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-slate-950/95 text-white backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00C6FF] to-[#007BFF] flex items-center justify-center shadow-md shrink-0 border border-white/20 p-1">
                <VaultLogo size="sm" variant="dark" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white">
                    ZeropicBD App
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Faster
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  Install for 1-tap checkout & live GPS tracking.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Dismiss app install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                notificationsEnabled
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Toggle Live Delivery Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{notificationsEnabled ? 'Alerts ON' : 'Live Alerts'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-1.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Home Screen</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
