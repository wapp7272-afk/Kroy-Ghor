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
export const Logo: React.FC<LogoProps> = React.memo(({
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
      img: 'h-9 w-auto max-h-9',
      iconImg: 'h-9 w-auto max-h-9 max-w-[130px]',
      text: 'text-xl',
      tagline: 'text-[9px]',
    },
    md: {
      img: 'h-11 sm:h-12 w-auto max-h-12',
      iconImg: 'h-11 sm:h-12 w-auto max-h-12 max-w-[170px]',
      text: 'text-2xl',
      tagline: 'text-[10px]',
    },
    lg: {
      img: 'h-11 sm:h-13 w-auto max-h-13',
      iconImg: 'h-11 sm:h-13 w-auto max-h-13 max-w-[190px]',
      text: 'text-3xl',
      tagline: 'text-[11px]',
    },
    xl: {
      img: 'h-13 sm:h-14 md:h-15 w-auto max-h-16',
      iconImg: 'h-13 sm:h-14 md:h-15 w-auto max-h-16 max-w-[220px]',
      text: 'text-4xl',
      tagline: 'text-[12px]',
    },
  };

  const numericDimensions = {
    xs: { width: 80, height: 24 },
    sm: { width: 130, height: 36 },
    md: { width: 170, height: 48 },
    lg: { width: 210, height: 60 },
    xl: { width: 250, height: 72 },
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
        className={`relative inline-flex items-center justify-center shrink-0 bg-transparent ${
          isPulsing ? 'animate-pulse' : ''
        }`}
      >
        <img
          src="/kroyghor-logo.png"
          alt={altText}
          width={currentNumeric.width}
          height={currentNumeric.height}
          className={`${imageClasses} object-contain transition-transform duration-200 group-hover:scale-102 mix-blend-multiply dark:mix-blend-normal bg-transparent`}
          loading="eager"
          // @ts-ignore
          fetchPriority="high"
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
});

export const VaultLogo = Logo;
export const BrandLogo = Logo;
export const SiteLogo = Logo;
export const ZeropicBDLogo = Logo;
export const KroyghorLogo = Logo;

export default Logo;
