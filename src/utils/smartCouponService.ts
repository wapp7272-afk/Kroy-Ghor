import { CartItem, Coupon, UserProfile } from '../types';

export const SYSTEM_SMART_COUPONS: Coupon[] = [
  {
    id: 'c-welcome10',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 1000,
    isActive: true,
    description: '10% Welcome Discount on orders ৳1,000+',
    isAutoApply: true,
    autoApplyRule: 'first_order',
    autoApplyLabel: '🎉 10% Welcome Discount Auto-Applied',
  },
  {
    id: 'c-freeship',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 130, // Covers maximum delivery fee across Bangladesh
    minOrderAmount: 3000,
    isActive: true,
    description: 'Free Nationwide Delivery on orders over ৳3,000',
    isAutoApply: true,
    autoApplyRule: 'free_shipping',
    autoApplyLabel: '🚚 Free Express Delivery (৳3,000+ Threshold)',
  },
  {
    id: 'c-combo500',
    code: 'VAULT500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 5000,
    isActive: true,
    description: 'Flat ৳500 OFF on orders over ৳5,000',
    isAutoApply: true,
    autoApplyRule: 'cart_threshold',
    autoApplyLabel: '💎 ৳500 Elite Shopper Bonus',
  },
  {
    id: 'c-multi5',
    code: 'COMBO5',
    discountType: 'percentage',
    discountValue: 5,
    minOrderAmount: 1500,
    isActive: true,
    description: '5% Extra Multi-Item Bundle Savings',
    isAutoApply: true,
    autoApplyRule: 'multi_item',
    autoApplyLabel: '✨ 5% Multi-Product Bundle Discount',
  },
];

export interface AutoCouponEvaluation {
  coupon: Coupon | null;
  discountAmount: number;
  isAutoApplied: boolean;
  reason: string;
  isFreeDelivery: boolean;
}

/**
 * Calculates the exact Taka savings for a given coupon and subtotal
 */
export const calculateCouponDiscount = (
  coupon: Coupon,
  subtotal: number,
  deliveryFee = 70
): number => {
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return 0;
  }

  if (coupon.autoApplyRule === 'free_shipping') {
    return Math.min(deliveryFee, coupon.discountValue);
  }

  if (coupon.discountType === 'percentage') {
    return Math.round((subtotal * coupon.discountValue) / 100);
  }

  return Math.min(subtotal, coupon.discountValue);
};

/**
 * Automatically evaluates all available coupons and returns the optimal deal that maximizes user savings
 */
export const findBestAutoCoupon = (
  cart: CartItem[],
  subtotal: number,
  deliveryFee: number,
  customCoupons: Coupon[] = [],
  user?: UserProfile
): AutoCouponEvaluation => {
  if (cart.length === 0 || subtotal <= 0) {
    return {
      coupon: null,
      discountAmount: 0,
      isAutoApplied: false,
      reason: '',
      isFreeDelivery: false,
    };
  }

  // Combine custom coupons and system smart coupons (unique by code)
  const combinedMap = new Map<string, Coupon>();
  [...SYSTEM_SMART_COUPONS, ...customCoupons].forEach((c) => {
    if (c.isActive) {
      combinedMap.set(c.code.toUpperCase(), c);
    }
  });

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  let bestCoupon: Coupon | null = null;
  let maxSavings = 0;
  let evaluationReason = '';
  let freeDelivery = false;

  for (const coupon of combinedMap.values()) {
    // Check minimum threshold
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      continue;
    }

    // Check multi-item rule
    if (coupon.autoApplyRule === 'multi_item' && totalItemsCount < 2) {
      continue;
    }

    const savings = calculateCouponDiscount(coupon, subtotal, deliveryFee);
    if (savings > maxSavings) {
      maxSavings = savings;
      bestCoupon = coupon;
      freeDelivery = coupon.autoApplyRule === 'free_shipping';
      evaluationReason = coupon.autoApplyLabel || `Auto-applied "${coupon.code}" for ৳${savings} savings!`;
    }
  }

  return {
    coupon: bestCoupon,
    discountAmount: maxSavings,
    isAutoApplied: Boolean(bestCoupon),
    reason: evaluationReason,
    isFreeDelivery: freeDelivery,
  };
};
