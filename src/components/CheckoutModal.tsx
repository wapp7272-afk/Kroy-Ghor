import React from 'react';
import { Checkout, CheckoutProps } from './Checkout';

export interface CheckoutModalProps extends CheckoutProps {}

export const CheckoutModal: React.FC<CheckoutModalProps> = (props) => {
  return <Checkout {...props} />;
};
