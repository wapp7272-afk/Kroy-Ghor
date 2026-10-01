import React from 'react';
import { VaultLogo, VaultLogoProps } from './VaultLogo';

export type BrandLogoProps = VaultLogoProps;

export const BrandLogo: React.FC<BrandLogoProps> = (props) => {
  return <VaultLogo {...props} />;
};

export const Logo = BrandLogo;
export const SiteLogo = BrandLogo;
export const ZeropicBDLogo = BrandLogo;

export default BrandLogo;
