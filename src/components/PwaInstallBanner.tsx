import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export interface PwaInstallBannerProps {
  showToast?: (message: string) => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ showToast }) => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

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

  // If online, render nothing (no intrusive modals or floating banners)
  if (!isOffline) {
    return null;
  }

  return (
    <div 
      className="sticky top-0 z-50 bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-pulse"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4" />
      <span>Offline Mode Active • You are viewing cached products</span>
    </div>
  );
};

