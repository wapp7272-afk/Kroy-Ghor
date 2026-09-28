import React from 'react';
import { SellerStorefront, SellerStorefrontProps } from './SellerStorefront';

export interface PublicSellerStoreViewProps extends SellerStorefrontProps {}

export const PublicSellerStoreView: React.FC<PublicSellerStoreViewProps> = (props) => {
  return <SellerStorefront {...props} />;
};
