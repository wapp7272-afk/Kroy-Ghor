import React from 'react';
import { Logo, LogoProps } from './Logo';

export type KroyghorLogoProps = LogoProps;

/**
 * Central Reusable Kroyghor Logo Component
 * Provides responsive combination marks (Symbol + Wordmark + Tagline)
 * as well as compact and icon-only variants for mobile & desktop navigation.
 */
export const KroyghorLogo: React.FC<KroyghorLogoProps> = (props) => {
  return <Logo brandName="Kroyghor" {...props} />;
};

export default KroyghorLogo;
