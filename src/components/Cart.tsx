import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Package,
  Store,
  Truck,
  Gift,
  Check,
  Percent,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { CartItem, UserProfile, Coupon } from '../types';
import { BrandLogo } from './BrandLogo';

export interface CartProps {
  isOpen?: boolean;
  isDrawer?: boolean;
  onClose?: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart?: () => void;
  user: UserProfile;
  couponCode?: string;
  isCouponApplied?: boolean;
  appliedCoupon?: Coupon | null;
  couponDiscount?: number;
  onApplyCoupon: (code: string) => { success: boolean; message: string };
  onRemoveCoupon: () => void;
  applyWalletBonus: boolean;
  onToggleWalletBonus: (apply: boolean) => void;
  onProceedToCheckout: () => void;
  onContinueShopping?: () => void;
  onViewOrders?: () => void;
  onOpenReturnPolicy?: () => void;
}

export const Cart: React.FC<CartProps> = React.memo(({
  isOpen = true,
  isDrawer = true,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user,
  couponCode = '',
  isCouponApplied = false,
  appliedCoupon = null,
  couponDiscount = 0,
  onApplyCoupon,
  onRemoveCoupon,
  applyWalletBonus,
  onToggleWalletBonus,
  onProceedToCheckout,
  onContinueShopping,
  onViewOrders,
  onOpenReturnPolicy,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deliveryArea, setDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');

  // Real-time subtotal computation
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  // Total quantity count
  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  // Delivery charge based on area: ৳60 Inside Dhaka, ৳120 Outside Dhaka
  const deliveryCharge = items.length > 0 ? (deliveryArea === 'Inside Dhaka' ? 60 : 120) : 0;

  // Free shipping threshold (e.g. ৳2,500 for Free Inside Dhaka delivery)
  const freeShippingThreshold = 2500;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Wallet bonus calculation: can deduct up to ৳20 from bill
  const availableBonus = Math.min(user.walletBalance || 0, 20);
  const walletDeduction = applyWalletBonus && subtotal > 0 ? availableBonus : 0;

  // Grand Total calculation
  const grandTotal = Math.max(0, subtotal - couponDiscount - walletDeduction + deliveryCharge);

  // Multi-Vendor grouping: group items by merchant / store name
  const vendorGroups = useMemo(() => {
    const groups: { [store: string]: CartItem[] } = {};
    items.forEach((item) => {
      const storeName = item.storeName || item.product.storeName || item.product.sellerName || (() => {
        const cat = item.product.category || '';
        if (cat.includes('Perfume') || cat === 'Attar Perfumes') return 'PerfumeVault BD';
        if (cat.includes('Gadgets') || cat === 'Glow Lights') return 'Apex Tech BD';
        if (cat.includes('Fashion')) return 'Kroyghor Atelier';
        if (cat.includes('Watches')) return 'Chronos Official';
        if (cat.includes('Beauty')) return 'Glow & Glam BD';
        if (cat.includes('Home')) return 'Nordic Living';
        return 'Kroyghor Official';
      })();

      if (!groups[storeName]) {
        groups[storeName] = [];
      }
      groups[storeName].push({ ...item, storeName });
    });
    return groups;
  }, [items]);

  const vendorCount = Object.keys(vendorGroups).length;

  // Quick preset coupons for effortless application
  const popularCoupons = [
    { code: 'ZERO10', label: '10% OFF Storewide', min: 0 },
    { code: 'VAULT20', label: '৳200 OFF on ৳1,500+', min: 1500 },
    { code: 'EID500', label: '৳500 OFF on ৳3,000+', min: 3000 },
  ];

  const handleApplyCoupon = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const code = (customCode || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ type: 'error', message: 'অনুগ্রহ করে একটি কুপন কোড লিখুন' });
      return;
    }

    const res = onApplyCoupon(code);
    setCouponFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    if (res.success) {
      setCouponInput('');
    }
    setTimeout(() => setCouponFeedback(null), 3500);
  };

  if (!isOpen) return null;

  // Cart Core Content Component (reusable in Drawer and Page modes)
  const cartContent = (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EDE9FE] text-[#5B21B6] border border-purple-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#171717] text-base sm:text-lg flex items-center gap-2">
              <span>Shopping Cart</span>
              {totalItemsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#5B21B6] border border-purple-200">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#525252]">
              {vendorCount > 1 
                ? `Multi-Vendor Checkout (${vendorCount} Verified Stores)` 
                : 'Kroyghor Bangladesh Official'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && onClearCart && (
            <button
              onClick={onClearCart}
              title="Clear all cart items"
              className="text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
            >
              Clear Cart
            </button>
          )}

          {isDrawer && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-[#171717] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Free Shipping Progress Indicator */}
      {items.length > 0 && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-b border-purple-100 text-xs">
          <div className="flex items-center justify-between font-semibold text-[#5B21B6] mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5B21B6]" />
              {remainingForFreeShipping === 0 ? (
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  অভিনন্দন! আপনি ফ্রি ডেলিভারি (ঢাকা) আনলক করেছেন!
                </span>
              ) : (
                <span>
                  আর মাত্র <strong className="font-black">৳{remainingForFreeShipping.toLocaleString()}</strong> শপিং করলেই ফ্রি ঢাকা ডেলিভারি!
                </span>
              )}
            </span>
            <span className="font-mono text-[11px] text-gray-500">
              ৳{subtotal.toLocaleString()} / ৳{freeShippingThreshold.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-purple-200/60 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                remainingForFreeShipping === 0 ? 'bg-emerald-600' : 'bg-[#5B21B6]'
              }`}
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Body / Items List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {items.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center mb-2">
              <BrandLogo size="md" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] text-[#5B21B6] flex items-center justify-center mx-auto border border-purple-200 shadow-xs">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-[#171717] text-base">আপনার শপিং কার্ট খালি আছে</h4>
              <p className="text-xs text-[#525252] max-w-xs mx-auto">
                Kroyghor-এর লাইফস্টাইল, ফ্যাশন এক্সেসরিজ, লাইটিং, জুয়েলারি ও ট্রেন্ডিং কালেকশন ঘুরে দেখুন।
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  if (onClose) onClose();
                  if (onContinueShopping) onContinueShopping();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                শপিং শুরু করুন (Explore Catalog)
              </button>
              {onViewOrders && (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    onViewOrders();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                >
                  পূর্ববর্তী অর্ডার দেখুন
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Multi-Vendor Grouped Product Listing */}
            <div className="space-y-4">
              {Object.entries(vendorGroups).map(([vendorName, vendorItems]) => (
                <div 
                  key={vendorName}
                  className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs"
                >
                  {/* Vendor Store Header */}
                  <div className="px-3.5 py-2.5 bg-[#EDE9FE]/40 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#5B21B6]">
                      <Store className="w-3.5 h-3.5 text-[#5B21B6]" />
                      <span className="truncate max-w-[200px]">{vendorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                        Verified
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-purple-100">
                      {vendorItems.length} {vendorItems.length === 1 ? 'Item' : 'Items'}
                    </span>
                  </div>

                  {/* Store Items List */}
                  <div className="divide-y divide-gray-100 p-2.5 sm:p-3 space-y-2">
                    {vendorItems.map((item) => {
                      const itemTotal = item.product.price * item.quantity;
                      const hasDiscount = item.product.originalPrice && item.product.originalPrice > item.product.price;
                      const itemSavings = hasDiscount ? (item.product.originalPrice! - item.product.price) * item.quantity : 0;

                      return (
                        <div
                          key={item.product.id}
                          className="pt-2 first:pt-0 flex gap-3 items-center justify-between"
                        >
                          {/* Product Image Thumbnail */}
                          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0">
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {item.product.discount && (
                              <span className="absolute top-1 left-1 px-1 py-0.2 bg-rose-600 text-[9px] font-black text-white rounded shadow-xs">
                                {item.product.discount}
                              </span>
                            )}
                          </div>

                          {/* Info & Variants */}
                          <div className="flex-1 min-w-0 pr-2">
                            <h5 className="text-xs font-bold text-[#171717] line-clamp-1 hover:text-[#5B21B6] transition-colors">
                              {item.product.title}
                            </h5>

                            {/* Variant / Size Tag */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {item.selectedSize && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-[#5B21B6]">
                                  {item.selectedSize}
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-[#171717]">
                                ৳{item.product.price.toLocaleString()}
                              </span>
                              {hasDiscount && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  ৳{item.product.originalPrice!.toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Item Subtotal & Savings Badge */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-[#5B21B6]">
                                ৳{itemTotal.toLocaleString()}
                              </span>
                              {itemSavings > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                  Save ৳{itemSavings.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls & One-Tap Removal (Optimized Touch Hitboxes) */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-rose-50 transition-colors cursor-pointer active:scale-95"
                              title="কার্ট থেকে ডিলিট করুন"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex items-center border border-[#E5E7EB] rounded-xl bg-gray-50 p-0.5 shadow-2xs">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="w-7 h-7 min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-white hover:text-[#171717] active:bg-gray-200 transition-colors cursor-pointer"
                                title="Decrease quantity"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-[#171717] font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-7 min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-white hover:text-[#171717] active:bg-gray-200 transition-colors cursor-pointer"
                                title="Increase quantity"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Destination Selector */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#5B21B6]" />
                  <span>ডেলিভারি এলাকা নির্বাচন করুন (Delivery Region)</span>
                </span>
                <span className="text-[#5B21B6] font-extrabold">
                  {deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryArea('Inside Dhaka')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryArea === 'Inside Dhaka'
                      ? 'bg-white border-[#5B21B6] ring-1 ring-[#5B21B6] shadow-2xs'
                      : 'bg-white/70 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-[#171717] flex items-center justify-between">
                    <span>Inside Dhaka</span>
                    {deliveryArea === 'Inside Dhaka' && <Check className="w-3.5 h-3.5 text-[#5B21B6]" />}
                  </div>
                  <div className="text-[10px] text-[#5B21B6] font-semibold mt-0.5">
                    ৳60 (২৪-৪৮ ঘণ্টা এক্সপ্রেস)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryArea('Outside Dhaka')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryArea === 'Outside Dhaka'
                      ? 'bg-white border-[#5B21B6] ring-1 ring-[#5B21B6] shadow-2xs'
                      : 'bg-white/70 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-bold text-[#171717] flex items-center justify-between">
                    <span>Outside Dhaka</span>
                    {deliveryArea === 'Outside Dhaka' && <Check className="w-3.5 h-3.5 text-[#5B21B6]" />}
                  </div>
                  <div className="text-[10px] text-[#5B21B6] font-semibold mt-0.5">
                    ৳120 (২-৪ দিন কুরিয়ার)
                  </div>
                </button>
              </div>
            </div>

            {/* Promo Coupon Section */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#5B21B6]" />
                  <span>Promo Coupon Code</span>
                </span>
                {isCouponApplied && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                )}
              </div>

              {/* Quick Preset Coupon Badges */}
              {!isCouponApplied && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {popularCoupons.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleApplyCoupon(undefined, c.code)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-[11px] font-bold text-[#5B21B6] flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    >
                      <Percent className="w-3 h-3" />
                      <span>{c.code}</span>
                      <span className="text-gray-500 font-normal">({c.label})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Coupon Form or Active Coupon Display */}
              {isCouponApplied && appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                        <span>{appliedCoupon.code}</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded font-bold">Applied</span>
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        ইনস্ট্যান্ট ছাড়: ৳{couponDiscount.toLocaleString()} ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `৳${appliedCoupon.discountValue}`})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="min-h-[40px] px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => handleApplyCoupon(e)} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="কুপন কোড (যেমন: PRIME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full h-11 min-h-[44px] px-3 py-2 rounded-xl border border-gray-300 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!couponInput.trim()}
                    className="h-11 min-h-[44px] px-5 py-2 rounded-xl bg-[#5B21B6] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                  couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {couponFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{couponFeedback.message}</span>
                </p>
              )}
            </div>

            {/* Wallet Bonus Balance Deduction Preview */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              applyWalletBonus && availableBonus > 0
                ? 'bg-purple-50/80 border-purple-300'
                : 'bg-white border-[#E5E7EB]'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B21B6] flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#171717]">Kroyghor Wallet Bonus</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#EDE9FE] text-[#5B21B6]">
                        ব্যালেন্স: ৳{user.walletBalance || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {user.walletBalance > 0 
                        ? `এই অর্ডারে সর্বোচ্চ ৳${availableBonus} ক্যাশ ছাড় প্রযোজ্য` 
                        : 'অ্যাকাউন্টে সাইন ইন করে ৳২০ ওয়েলকাম বোনাস উপভোগ করুন'}
                    </p>
                  </div>
                </div>

                {user.walletBalance > 0 ? (
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={applyWalletBonus}
                      onChange={(e) => onToggleWalletBonus(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5B21B6]"></div>
                  </label>
                ) : (
                  <span className="text-[11px] font-bold text-[#5B21B6]">৳0</span>
                )}
              </div>

              {applyWalletBonus && availableBonus > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[11px] text-[#5B21B6] font-semibold">
                  <span>Deduction applied to cart:</span>
                  <span className="font-bold">-৳{availableBonus}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer & Financial Breakdown */}
      {items.length > 0 && (
        <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-gray-50/80 space-y-3">
          {/* Dynamic Financial Calculation List */}
          <div className="space-y-1.5 text-xs text-[#525252]">
            <div className="flex justify-between">
              <span>Subtotal ({totalItemsCount} items)</span>
              <span className="font-bold text-[#171717]">৳{subtotal.toLocaleString()}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-৳{couponDiscount.toLocaleString()}</span>
              </div>
            )}

            {walletDeduction > 0 && (
              <div className="flex justify-between text-purple-700 font-semibold">
                <span>Applied Wallet Bonus</span>
                <span>-৳{walletDeduction.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Charge ({deliveryArea})</span>
              <span className="font-bold text-[#171717]">
                {deliveryCharge === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  `৳${deliveryCharge.toLocaleString()}`
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-extrabold text-[#171717]">Grand Total</span>
                <span className="block text-[10px] text-gray-500">VAT & Taxes Included</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#5B21B6]">
                  ৳{grandTotal.toLocaleString()}
                </span>
                {(couponDiscount > 0 || walletDeduction > 0) && (
                  <span className="block text-[10px] text-emerald-700 font-bold">
                    You save ৳{(couponDiscount + walletDeduction).toLocaleString()}!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Action Button (Min 48px Hitbox) */}
          <button
            id="cart-drawer-checkout-btn"
            onClick={onProceedToCheckout}
            className="w-full min-h-[48px] py-4 px-4 rounded-xl font-extrabold text-white bg-[#5B21B6] hover:bg-[#4C1D95] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Proceed to Express Checkout (অর্ডার সম্পন্ন করুন)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* 4 Marketplace Trust Badges */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] text-gray-600 border-t border-gray-200">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-gray-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-gray-800 truncate" title="100% Authentic Quality Guarantee">100% Authentic</span>
            </div>

            <button
              type="button"
              onClick={onOpenReturnPolicy}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-gray-200/80 text-left transition-colors ${onOpenReturnPolicy ? 'hover:border-purple-300 hover:text-[#5B21B6] cursor-pointer' : ''}`}
              title="7-Day Hassle-Free Replacement / Return Policy"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold text-gray-800 truncate">7-Day Return</span>
            </button>

            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-gray-200/80">
              <Truck className="w-3.5 h-3.5 text-[#5B21B6] shrink-0" />
              <span className="font-semibold text-gray-800 truncate" title="Express Nationwide Shipping (64 Districts)">64 Districts Fast</span>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white border border-gray-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-gray-800 truncate" title="Secure Payment & Cash on Delivery Assurance">Secure COD & Pay</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If Drawer Mode: Wrap in slide-over overlay
  if (isDrawer) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-1 sm:pl-10">
          <div 
            id="shopping-cart-drawer"
            className="w-full sm:w-[440px] max-w-full bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col animate-slideLeft"
          >
            {cartContent}
          </div>
        </div>
      </div>
    );
  }

  // Standalone Full-Page View Mode
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {cartContent}
      </div>
    </div>
  );
});
