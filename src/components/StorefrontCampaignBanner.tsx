import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Tag, 
  Copy, 
  ArrowRight, 
  X, 
  Check, 
  Flame, 
  Gift 
} from 'lucide-react';
import { CampaignBannerConfig } from '../types';

interface StorefrontCampaignBannerProps {
  bannerConfig?: CampaignBannerConfig;
  onNavigateTarget?: (target: string) => void;
  showToast?: (msg: string) => void;
}

export const StorefrontCampaignBanner: React.FC<StorefrontCampaignBannerProps> = ({
  bannerConfig,
  onNavigateTarget,
  showToast,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('zeropicbd_campaign_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [copied, setCopied] = useState(false);

  // If bannerConfig is disabled or user dismissed it in this session, do not render
  if (!bannerConfig || !bannerConfig.isEnabled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('zeropicbd_campaign_dismissed', 'true');
    } catch (e) {
      console.warn('Unable to write to sessionStorage:', e);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(code);
      setCopied(true);
      if (showToast) {
        showToast(`🎟️ Promo code "${code}" copied to clipboard!`);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleActionClick = () => {
    const target = bannerConfig.linkTarget || '#explore';
    if (onNavigateTarget) {
      onNavigateTarget(target);
    } else {
      if (target.startsWith('#')) {
        const el = document.getElementById(target.substring(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (target === '/checkout') {
        window.history.pushState(null, '', '/checkout');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const bgStyle = bannerConfig.bgImageUrl 
    ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${bannerConfig.bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : bannerConfig.bgColor?.startsWith('linear-gradient') || bannerConfig.bgColor?.startsWith('#') || bannerConfig.bgColor?.startsWith('rgb')
    ? { background: bannerConfig.bgColor }
    : {};

  const fallbackClass = (!bannerConfig.bgImageUrl && !bannerConfig.bgColor)
    ? 'bg-gradient-to-r from-indigo-900 via-indigo-700 to-rose-700'
    : '';

  return (
    <aside 
      id="storefront-campaign-announcement"
      role="banner"
      aria-label={bannerConfig.title}
      style={bgStyle}
      className={`relative z-40 w-full text-white shadow-md border-b border-white/10 ${fallbackClass}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
          
          {/* Main Banner Message & Action Content */}
          <div className="flex-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 min-w-0 pr-6 sm:pr-0">
            
            {/* Seasonal Badge */}
            {bannerConfig.badgeText && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-xs font-black uppercase tracking-wider border border-white/25 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>{bannerConfig.badgeText}</span>
              </span>
            )}

            {/* Campaign Headline */}
            <span className="font-extrabold text-white tracking-tight shrink-0">
              {bannerConfig.title}:
            </span>

            {/* Subtitle / Description */}
            <span className="text-white/90 text-xs sm:text-sm truncate max-w-md lg:max-w-xl">
              {bannerConfig.subtitle}
            </span>

            {/* Promo Code Badge with 1-Click Copy */}
            {bannerConfig.promoCode && (
              <button
                type="button"
                onClick={(e) => handleCopyCode(e, bannerConfig.promoCode!)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 font-mono font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Click to copy promo code"
                aria-label={`Copy promo code ${bannerConfig.promoCode}`}
              >
                <Tag className="w-3 h-3" />
                <span>{bannerConfig.promoCode}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-900 stroke-[3]" />
                ) : (
                  <Copy className="w-2.5 h-2.5 text-slate-800" />
                )}
              </button>
            )}

            {/* Action CTA Button */}
            {bannerConfig.buttonText && (
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 group ml-1"
              >
                <span>{bannerConfig.buttonText}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

          </div>

          {/* Dismiss / Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss campaign announcement banner"
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
            title="Hide for this session"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      </div>
    </aside>
  );
};
