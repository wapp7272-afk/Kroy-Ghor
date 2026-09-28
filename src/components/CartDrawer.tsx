import React from 'react';
import { Cart, CartProps } from './Cart';

export interface CartDrawerProps extends CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = (props) => {
  return <Cart {...props} isDrawer={true} />;
};
