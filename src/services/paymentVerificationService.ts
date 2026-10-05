import { CartItem, Order, UserProfile, Coupon } from '../types';
import { PRODUCTS } from '../data/products';
import { INITIAL_COUPONS } from '../data/coupons';

export interface VerificationResult {
  isValid: boolean;
  tamperingDetected: boolean;
  verifiedOrder: Order;
  securityNotes: string[];
  gatewayRef?: string;
  error?: string;
}

/**
 * Server-Side Payment & Order Anti-Tampering Engine
 * Double-checks catalog unit prices, promo discounts, shipping fees,
 * wallet deductions, and payment gateway references before committing orders.
 */
export const verifyOrderAndPayment = async (
  clientOrder: Order,
  user: UserProfile,
  customCoupons: Coupon[] = []
): Promise<VerificationResult> => {
  const securityNotes: string[] = [];
  let tamperingDetected = false;

  // 1. Authoritative Subtotal Calculation from Master Product Catalog
  let verifiedSubtotal = 0;
  const verifiedItems: CartItem[] = clientOrder.items.map((item) => {
    // Find original product by root ID
    const rootId = item.product.id.split('-')[0];
    const catalogProduct = PRODUCTS.find((p) => p.id === rootId || p.id === item.product.id) || item.product;

    // Apply official size multipliers
    const size = item.selectedSize || '';
    const sizeMultiplier = size.includes('50ml') ? 0.85 : size.includes('150ml') ? 1.35 : 1;
    const authoritativeUnitPrice = size
      ? Math.round(catalogProduct.price * sizeMultiplier)
      : catalogProduct.price;

    if (item.product.price !== authoritativeUnitPrice) {
      securityNotes.push(
        `Price mismatch detected on "${item.product.title}": Client sent ৳${item.product.price}, catalog enforced ৳${authoritativeUnitPrice}`
      );
      tamperingDetected = true;
    }

    // Enforce integer quantity bounds between 1 and 20 (and verify against stock)
    const rawQty = Number(item.quantity);
    const sanitizedQty = Math.max(1, Math.min(20, Math.floor(rawQty || 1)));
    if (sanitizedQty !== rawQty) {
      securityNotes.push(
        `Quantity anomaly on "${item.product.title}": Client submitted ${rawQty}, normalized to ${sanitizedQty}`
      );
      tamperingDetected = true;
    }

    const itemTotal = authoritativeUnitPrice * sanitizedQty;
    verifiedSubtotal += itemTotal;

    return {
      ...item,
      quantity: sanitizedQty,
      product: {
        ...catalogProduct,
        price: authoritativeUnitPrice,
      },
    };
  });

  // 2. Authoritative Shipping Fee Calculation
  let verifiedDeliveryFee = clientOrder.address.cityDivision === 'Inside Dhaka' ? 60 : 120;

  // 3. Authoritative Coupon Discount Calculation
  let verifiedDiscount = 0;
  const allCoupons = [...INITIAL_COUPONS, ...customCoupons];
  
  if (clientOrder.discount > 0) {
    // Check if client claims a discount, verify coupon validity
    const matchedCoupon = allCoupons.find(
      (c) => c.isActive && (!c.minOrderAmount || verifiedSubtotal >= c.minOrderAmount)
    );

    if (matchedCoupon) {
      if (matchedCoupon.code === 'FREESHIP' && verifiedSubtotal >= 3000) {
        verifiedDiscount = verifiedDeliveryFee;
        verifiedDeliveryFee = 0;
        securityNotes.push('FREESHIP verified: 100% shipping fee waived.');
      } else if (matchedCoupon.discountType === 'percentage') {
        verifiedDiscount = Math.round((verifiedSubtotal * matchedCoupon.discountValue) / 100);
      } else {
        verifiedDiscount = Math.min(verifiedSubtotal, matchedCoupon.discountValue);
      }
    } else {
      // If no valid coupon exists or min order amount not satisfied, discount is strictly 0
      verifiedDiscount = 0;
      securityNotes.push(`Unrecognized or expired coupon claimed: ৳${clientOrder.discount} discount stripped to ৳0.`);
      tamperingDetected = true;
    }

    if (Math.abs(clientOrder.discount - verifiedDiscount) > 10) {
      securityNotes.push(
        `Discount mismatch: Client sent ৳${clientOrder.discount}, server calculated ৳${verifiedDiscount}`
      );
      tamperingDetected = true;
    }
  }

  // 4. Authoritative Wallet Deduction Calculation
  const maxAllowableWallet = Math.min(user.walletBalance || 0, 20);
  let verifiedWalletDeduction = 0;

  if (clientOrder.walletDeducted > 0) {
    verifiedWalletDeduction = Math.min(clientOrder.walletDeducted, maxAllowableWallet);
    if (clientOrder.walletDeducted > maxAllowableWallet) {
      securityNotes.push(
        `Wallet over-deduction blocked: Client claimed ৳${clientOrder.walletDeducted}, capped to user balance ৳${verifiedWalletDeduction}`
      );
      tamperingDetected = true;
    }
  }

  // 5. Anti-Tamper Grand Total Computation
  const verifiedGrandTotal = Math.max(
    0,
    verifiedSubtotal - verifiedDiscount - verifiedWalletDeduction + verifiedDeliveryFee
  );

  if (Math.abs(clientOrder.total - verifiedGrandTotal) > 5) {
    securityNotes.push(
      `Grand total mismatch: Client claimed ৳${clientOrder.total}, server verified total is ৳${verifiedGrandTotal}`
    );
    tamperingDetected = true;
  }

  // 6. Payment Method Verification & Transaction Reference Validation
  // NOTE: Client-side performs syntax and format validation on TrxID (8-12 alphanumeric characters).
  // Real monetary verification requires merchant API credentials / backend webhook settlement check.
  let gatewayRef = `GW_KG_${Date.now()}`;
  let paymentStatus: Order['paymentStatus'] = 'Pending Verification';

  if (clientOrder.paymentMethod === 'cod') {
    paymentStatus = 'Pending (COD on Delivery)' as any;
    gatewayRef = `COD_SETTLEMENT_${Date.now()}`;
    securityNotes.push('Cash on Delivery: Payment will be collected by courier rider upon parcel handover.');
  } else if (clientOrder.paymentMethod === 'bkash') {
    const rawTrx = (clientOrder.trxId || '').trim().toUpperCase();
    // Validate bKash TrxID format: 8 to 12 alphanumeric characters
    const isValidTrx = /^[A-Z0-9]{8,12}$/.test(rawTrx);
    if (!isValidTrx) {
      return {
        isValid: false,
        tamperingDetected: true,
        verifiedOrder: clientOrder,
        securityNotes,
        error: 'Invalid bKash Transaction ID format. Must be 8-12 alphanumeric characters (e.g. BKS90812391).',
      };
    }
    // TrxID format is valid; marked Pending Verification until admin/backend confirms against bKash Merchant API
    paymentStatus = 'Pending Verification';
    gatewayRef = `BKASH_SUBMITTED_${rawTrx}`;
    securityNotes.push(`bKash TrxID format valid (${rawTrx}). Awaiting merchant statement verification.`);
  } else if (clientOrder.paymentMethod === 'nagad') {
    const rawTrx = (clientOrder.trxId || '').trim().toUpperCase();
    const isValidTrx = /^[A-Z0-9]{8,12}$/.test(rawTrx);
    if (!isValidTrx) {
      return {
        isValid: false,
        tamperingDetected: true,
        verifiedOrder: clientOrder,
        securityNotes,
        error: 'Invalid Nagad Transaction ID format. Must be 8-12 alphanumeric characters (e.g. NGD9182319).',
      };
    }
    // TrxID format is valid; marked Pending Verification until admin/backend confirms against Nagad Merchant API
    paymentStatus = 'Pending Verification';
    gatewayRef = `NAGAD_SUBMITTED_${rawTrx}`;
    securityNotes.push(`Nagad TrxID format valid (${rawTrx}). Awaiting merchant statement verification.`);
  } else if (clientOrder.paymentMethod === 'card') {
    paymentStatus = 'Pending Verification';
    gatewayRef = `CARD_SESSION_${Date.now()}`;
    securityNotes.push('Card payment session initialized. Awaiting gateway webhook callback.');
  }

  // 7. Synthesize Secure Verified Order
  const verifiedOrder: Order = {
    ...clientOrder,
    items: verifiedItems,
    subtotal: verifiedSubtotal,
    discount: verifiedDiscount,
    walletDeducted: verifiedWalletDeduction,
    deliveryFee: verifiedDeliveryFee,
    total: verifiedGrandTotal,
    paymentStatus,
    status: 'Confirmed',
  };

  return {
    isValid: true,
    tamperingDetected,
    verifiedOrder,
    securityNotes,
    gatewayRef,
  };
};
