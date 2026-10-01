import React from 'react';

export interface VaultLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  tagline?: string;
  isPulsing?: boolean;
  variant?: 'light' | 'dark';
  showDivider?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

/**
 * Official ZeropicBD Brand Logo Component using zeropicbd_logo_exact.png directly.
 * Strict adherence to official brand asset rules:
 * - Direct usage of uploaded PNG asset /zeropicbd_logo_exact.png
 * - Maintains exact proportions with object-fit: contain and width: auto
 * - Transparent PNG background preserved
 * - Fully responsive across mobile & desktop displays
 */
export const VaultLogo: React.FC<VaultLogoProps> = ({
  className = '',
  size = 'md',
  isPulsing = false,
  onClick,
}) => {
  // Height sizing classes for exact responsive presentation without distortion or cropping
  const sizeClasses = {
    sm: 'h-8 sm:h-9 max-h-9',
    md: 'h-10 sm:h-12 max-h-12',
    lg: 'h-12 sm:h-16 max-h-16',
    xl: 'h-16 sm:h-20 md:h-24 max-h-24',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center shrink-0 select-none group ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <img
        src="/zeropicbd_logo_exact.png"
        alt="ZeropicBD - Shop Smart • Live Better"
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
