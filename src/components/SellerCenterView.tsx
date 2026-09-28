import React from 'react';
import { SellerDashboard, SellerDashboardProps } from './SellerDashboard';

export interface SellerCenterViewProps extends SellerDashboardProps {}

export const SellerCenterView: React.FC<SellerCenterViewProps> = (props) => {
  return <SellerDashboard {...props} />;
};
