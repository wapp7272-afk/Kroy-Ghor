import React from 'react';
import { Cart, CartProps } from './Cart';

export interface CartDrawerProps extends CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = React.memo((props) => {
  return <Cart {...props} isDrawer={true} />;
});
