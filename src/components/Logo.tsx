import React from 'react';

export interface LogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'monochrome' | 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  isPulsing?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  showText?: boolean;
  tagline?: string;
  brandName?: string;
  mode?: string;
  showDivider?: boolean;
  alt?: string;
}

/**
 * Official Kroyghor Logo Component
 * Renders the exact final Kroyghor logo image asset (/kroyghor-logo.png)
 * preserving proper sizing, responsiveness, and accessible alt text.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'light',
  className = '',
  isPulsing = false,
  onClick,
  tagline,
  brandName = 'Kroyghor',
  showText = false,
  alt,
}) => {
  const isDark = theme === 'dark' || variant === 'dark';
  const isIcon = variant === 'icon';

  const sizeDimensions = {
    xs: {
      img: 'h-6 w-auto max-h-6',
      iconImg: 'h-6 w-auto max-h-6 max-w-[80px]',
      text: 'text-base',
      tagline: 'text-[8px]',
    },
    sm: {
      img: 'h-8 w-auto max-h-8',
      iconImg: 'h-8 w-auto max-h-8 max-w-[110px]',
      text: 'text-xl',
      tagline: 'text-[9px]',
    },
    md: {
      img: 'h-10 w-auto max-h-10',
      iconImg: 'h-9 sm:h-10 w-auto max-h-10 max-w-[140px]',
      text: 'text-2xl',
      tagline: 'text-[10px]',
    },
    lg: {
      img: 'h-12 w-auto max-h-12',
      iconImg: 'h-11 sm:h-12 w-auto max-h-12 max-w-[160px]',
      text: 'text-3xl',
      tagline: 'text-[11px]',
    },
    xl: {
      img: 'h-16 w-auto max-h-16',
      iconImg: 'h-14 sm:h-16 w-auto max-h-16 max-w-[200px]',
      text: 'text-4xl',
      tagline: 'text-[12px]',
    },
  };

  const numericDimensions = {
    xs: { width: 80, height: 24 },
    sm: { width: 110, height: 32 },
    md: { width: 140, height: 40 },
    lg: { width: 160, height: 48 },
    xl: { width: 200, height: 64 },
  };

  const currentSize = sizeDimensions[size] || sizeDimensions.md;
  const currentNumeric = numericDimensions[size] || numericDimensions.md;
  const imageClasses = isIcon ? currentSize.iconImg : currentSize.img;
  const altText = alt || `${brandName} - আপনার বিশ্বস্ত শপিং পার্টনার`;

  return (
    <div
      onClick={onClick}
      role="img"
      aria-label={altText}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none transition-all group ${
        onClick ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
    >
      {/* Exact Final Kroyghor Logo Image Asset */}
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${
          isPulsing ? 'animate-pulse' : ''
        } ${isDark ? 'bg-white rounded-lg px-2 py-1 shadow-xs' : ''}`}
      >
        <img
          src="/kroyghor-logo.png"
          alt={altText}
          width={currentNumeric.width}
          height={currentNumeric.height}
          className={`${imageClasses} object-contain transition-transform duration-200 group-hover:scale-102`}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Optional Supplementary Text/Tagline if explicitly enabled */}
      {showText && (
        <div className="flex flex-col leading-none text-left">
          <span
            className={`font-black tracking-tight font-['Plus_Jakarta_Sans',sans-serif] ${
              currentSize.text
            } ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
          >
            {brandName}
            <span className="text-blue-600">.</span>
          </span>

          {tagline && (
            <span
              className={`font-bold tracking-widest uppercase mt-1 ${
                currentSize.tagline
              } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const VaultLogo = Logo;
export const BrandLogo = Logo;
export const SiteLogo = Logo;
export const ZeropicBDLogo = Logo;
export const KroyghorLogo = Logo;

export default Logo;
