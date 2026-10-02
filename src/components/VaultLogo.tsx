import React from 'react';

export interface VaultLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPulsing?: boolean;
  variant?: 'light' | 'dark';
  onClick?: (e?: React.MouseEvent) => void;
  showDivider?: boolean;
  showText?: boolean;
  tagline?: string;
  mode?: string;
}

/**
 * Official ZeropicBD Brand Logo Component
 * Uses the exact uploaded image asset (/logo.png) directly without any pseudo SVG or code-based drawings.
 */
export const VaultLogo: React.FC<VaultLogoProps> = ({
  className = '',
  size = 'md',
  isPulsing = false,
  variant = 'light',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-8 sm:h-9 max-h-9',
    md: 'h-10 sm:h-12 max-h-12',
    lg: 'h-12 sm:h-16 max-h-16',
    xl: 'h-16 sm:h-20 max-h-20',
  }[size] || 'h-10 w-auto';

  const logoImg = (
    <img
      src="/logo.png"
      alt="ZeropicBD"
      className={`w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] shrink-0 ${sizeClasses} ${
        isPulsing ? 'animate-pulse' : ''
      }`}
      style={{
        objectFit: 'contain',
        width: 'auto',
        maxWidth: '100%',
      }}
      loading="eager"
    />
  );

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center shrink-0 select-none group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {variant === 'dark' ? (
        <div className="bg-white/95 hover:bg-white rounded-2xl px-3 py-1.5 shadow-sm inline-flex items-center transition-all">
          {logoImg}
        </div>
      ) : (
        logoImg
      )}
    </div>
  );
};

export const BrandLogo = VaultLogo;
export const Logo = VaultLogo;
export const SiteLogo = VaultLogo;
export const ZeropicBDLogo = VaultLogo;
export const ZeropicLogo = VaultLogo;
export const PrimeVaultLogo = VaultLogo;
export const ZestFlickLogo = VaultLogo;
