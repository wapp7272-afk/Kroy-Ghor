import React from 'react';
import Logo, { LogoProps } from './Logo';

export interface SiteLogoProps {
  variant?: 'full' | 'icon' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  className?: string;
  isPulsing?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

export const SiteLogo: React.FC<SiteLogoProps> = (props) => {
  return <Logo {...props} />;
};

export type { LogoProps };
export default SiteLogo;
