import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  MapPin, 
  Phone, 
  User, 
  Copy, 
  Truck, 
  AlertCircle, 
  Download, 
  ShoppingBag, 
  Tag, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  FileText, 
  Clock, 
  ArrowRight, 
  Store, 
  DollarSign, 
  Smartphone, 
  ChevronRight, 
  Zap, 
  Bookmark, 
  Gift,
  Printer,
  ExternalLink,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { CartItem, UserProfile, Order, Coupon, Address } from '../types';
import { sendOrderEmail } from '../lib/emailService';
import { InvoiceModal } from './InvoiceModal';
import { BrandLogo } from './BrandLogo';
import { findBestAutoCoupon } from '../utils/smartCouponService';
import { verifyOrderAndPayment } from '../services/paymentVerificationService';
import { saveOrderToFirestore } from '../services/orderFirestoreService';
import { auth } from '../lib/firebaseAuth';

// Bangladesh 64 Districts for quick selection
export const BD_DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Gazipur',
  'Narayanganj',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  'Cox\'s Bazar',
  'Bogura',
  'Jashore',
  'Dinajpur',
  'Tangail',
  'Faridpur',
  'Pabna',
  'Kushtia',
  'Noakhali',
  'Feni',
  'Brahmanbaria',
  'Narsingdi',
  'Munshiganj',
  'Manikganj',
  'Sirajganj',
  'Jamalpur',
  'Sherpur',
  'Netrokona',
  'Kishoreganj',
  'Gopalganj',
  'Madaripur',
  'Shariatpur',
  'Rajbari',
  'Other / অন্যান্য জেলা'
];

export interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  user: UserProfile;
  subtotal: number;
  couponDiscount: number;
  walletDeducted?: number;
  couponCode?: string;
  isCouponApplied?: boolean;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
  onPlaceOrder: (order: Order) => void;
  onClearCart: () => void;
  onViewOrders?: () => void;
  onVerifyPhoneSuccess?: (phone: string) => void;
  onOpenAuth?: () => void;
  onOpenReturnPolicy?: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  isOpen,
  onClose,
  items,
  user,
  subtotal,
  couponDiscount,
  walletDeducted = 0,
  couponCode = '',
  isCouponApplied = false,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  onClearCart,
  onViewOrders,
  onVerifyPhoneSuccess,
  onOpenAuth,
  onOpenReturnPolicy,
}) => {
  // Step 1: Buyer Details & Address
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [selectedSavedIndex, setSelectedSavedIndex] = useState<number>(0);

  const savedAddressesList: Address[] = useMemo(() => {
    const list: Address[] = [];
    if (user.address?.fullName && user.address?.fullAddress) {
      list.push(user.address);
    }
    if (user.savedAddresses && user.savedAddresses.length > 0) {
      user.savedAddresses.forEach((addr) => {
        if (!list.some((a) => a.fullAddress === addr.fullAddress && a.phone === addr.phone)) {
          list.push(addr);
        }
      });
    }
    return list;
  }, [user]);

  const [fullName, setFullName] = useState(user.address?.fullName || user.name || '');
  const [phone, setPhone] = useState(user.address?.phone || user.phone || '');
  const [district, setDistrict] = useState<string>(user.address?.district || 'Dhaka');
  const [cityDivision, setCityDivision] = useState<'Inside Dhaka' | 'Outside Dhaka'>(
    user.address?.cityDivision || 'Inside Dhaka'
  );
  const [fullAddress, setFullAddress] = useState(user.address?.fullAddress || '');
  const [notes, setNotes] = useState(user.address?.notes || '');

  // Step 2: Payment Method: 'cod' | 'bkash' | 'nagad' | 'card'
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'card'>('cod');
  const [paymentSenderPhone, setPaymentSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });

  const [inputCouponCode, setInputCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Phone Verification Engine
  const [isPhoneVerifiedLocally, setIsPhoneVerifiedLocally] = useState<boolean>(user.isPhoneVerified ?? false);
  const [showPhoneVerifyBox, setShowPhoneVerifyBox] = useState(false);
  const [checkoutOtp, setCheckoutOtp] = useState('');
  const [checkoutOtpDigits, setCheckoutOtpDigits] = useState(['', '', '', '']);
  const [checkoutSmsToast, setCheckoutSmsToast] = useState<{ code: string; phone: string } | null>(null);
  const [checkoutVerifySuccess, setCheckoutVerifySuccess] = useState<string | null>(null);

  // Interactive Dynamic Wallet Bonus toggle
  const [useWalletBonus, setUseWalletBonus] = useState(true);

  // Order Placement & Completion State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Synchronize when saved addresses or user changes
  useEffect(() => {
    if (user.isPhoneVerified) {
      setIsPhoneVerifiedLocally(true);
    }
  }, [user.isPhoneVerified]);

  useEffect(() => {
    if (savedAddressesList.length > 0 && addressMode === 'saved') {
      const active = savedAddressesList[selectedSavedIndex] || savedAddressesList[0];
      if (active) {
        setFullName(active.fullName);
        setPhone(active.phone);
        setDistrict(active.district || 'Dhaka');
        setCityDivision(active.cityDivision);
        setFullAddress(active.fullAddress);
        setNotes(active.notes || '');
      }
    }
  }, [addressMode, selectedSavedIndex, savedAddressesList]);

  // Handle District Change & update shipping fee automatically
  const handleDistrictChange = (selectedDist: string) => {
    setDistrict(selectedDist);
    if (selectedDist === 'Dhaka') {
      setCityDivision('Inside Dhaka');
    } else {
      setCityDivision('Outside Dhaka');
    }
  };

  // Handle Direct Shipping Region Change
  const handleShippingChange = (division: 'Inside Dhaka' | 'Outside Dhaka') => {
    setCityDivision(division);
    if (division === 'Inside Dhaka' && district !== 'Dhaka') {
      setDistrict('Dhaka');
    } else if (division === 'Outside Dhaka' && district === 'Dhaka') {
      setDistrict('Chattogram');
    }
  };

  // Dynamic Shipping Fee: ৳60 Inside Dhaka, ৳120 Outside Dhaka
  const deliveryFee = cityDivision === 'Inside Dhaka' ? 60 : 120;

  // Dynamic Wallet Bonus Calculation
  const activeUserBalance = (user.walletBalance || 0) + (isPhoneVerifiedLocally && !user.hasReceivedBonus ? 20 : 0);
  const maxWalletBonusDeductible = Math.min(activeUserBalance, 20);
  const effectiveWalletDeduction = useWalletBonus && subtotal > 0 ? maxWalletBonusDeductible : 0;
  
  // Dynamic Grand Total Breakdown
  const grandTotal = Math.max(0, subtotal - couponDiscount - effectiveWalletDeduction + deliveryFee);

  // Multi-Vendor grouping: group checkout items by merchant / store name
  const vendorGroups = useMemo(() => {
    const groups: { [store: string]: CartItem[] } = {};
    items.forEach((item) => {
      const storeName = item.storeName || item.product.storeName || item.product.sellerName || (() => {
        const cat = item.product.category || '';
        if (cat.includes('Perfume') || cat === 'Attar Perfumes') return 'PerfumeVault BD';
        if (cat.includes('Gadgets') || cat === 'Glow Lights') return 'Apex Tech BD';
        if (cat.includes('Fashion')) return 'Kroy Ghor Atelier';
        if (cat.includes('Watches')) return 'Chronos Official';
        if (cat.includes('Beauty')) return 'Glow & Glam BD';
        if (cat.includes('Home')) return 'Nordic Living';
        return 'Kroy Ghor Official';
      })();

      if (!groups[storeName]) {
        groups[storeName] = [];
      }
      groups[storeName].push({ ...item, storeName });
    });
    return groups;
  }, [items]);

  // Official Merchant Numbers
  const bkashNumber = '01883418309';
  const nagadNumber = '01883418309';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  // In-checkout Phone Verification
  const handleTriggerCheckoutOtp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setFormError('⚠️ অনুগ্রহ করে সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 018XXXXXXXX)।');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCheckoutOtp(code);
    setCheckoutOtpDigits(['', '', '', '']);
    setCheckoutSmsToast({ code, phone: cleanPhone });
    setShowPhoneVerifyBox(true);
    setFormError(null);
  };

  const handleVerifyCheckoutOtp = () => {
    setFormError(null);
    const entered = checkoutOtpDigits.join('');
    if (entered.length !== 4) {
      setFormError('⚠️ অনুগ্রহ করে ৪-সংখ্যার সম্পূর্ণ ভেরিফিকেশন কোড লিখুন।');
      return;
    }
    if (entered !== checkoutOtp) {
      setFormError('❌ ভুল OTP কোড! অনুগ্রহ করে আবার চেষ্টা করুন।');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    setIsPhoneVerifiedLocally(true);
    setShowPhoneVerifyBox(false);
    setCheckoutSmsToast(null);
    setUseWalletBonus(true);
    setCheckoutVerifySuccess('🎉 মোবাইল নম্বর সফলভাবে ভেরিফাইড! ৳২০ ওয়েলকাম বোনাস সক্রিয় হয়েছে।');
    if (onVerifyPhoneSuccess) {
      onVerifyPhoneSuccess(cleanPhone);
    }
    setTimeout(() => setCheckoutVerifySuccess(null), 4000);
  };

  // Coupon Application
  const handleApplyCouponCode = (codeToApply?: string) => {
    const code = (codeToApply || inputCouponCode).trim().toUpperCase();
    if (!code) {
      setCouponFeedback({ type: 'error', message: 'অনুগ্রহ করে কুপন কোড লিখুন' });
      return;
    }
    if (!onApplyCoupon) return;

    const res = onApplyCoupon(code);
    setCouponFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    if (res.success) {
      setInputCouponCode('');
    }
    setTimeout(() => setCouponFeedback(null), 3500);
  };

  // Automated Smart Promo Coupon Evaluation
  const autoCouponDeal = useMemo(() => {
    if (isCouponApplied) return null;
    return findBestAutoCoupon(items, subtotal, deliveryFee, [], user);
  }, [items, subtotal, deliveryFee, isCouponApplied, user]);

  // Format Date & Time for Invoice & Tracking
  const generateOrderTimestamp = (): string => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  };

  // Order Submission Trigger
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('⚠️ অনুগ্রহ করে আপনার পূর্ণ নাম প্রদান করুন।');
      return;
    }

    const cleanPhone = phone.trim().replace(/[-+\s]/g, '');
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setFormError('⚠️ অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।');
      return;
    }

    if (!fullAddress.trim() || fullAddress.trim().length < 6) {
      setFormError('⚠️ অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন (বাড়ি নং, রোড নং, এলাকা / থানা)।');
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !trxId.trim()) {
      setFormError(`⚠️ অনুগ্রহ করে আপনার ${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Transaction ID (TrxID) ইনপুট দিন।`);
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardInfo.cardNumber.trim() || cardInfo.cardNumber.replace(/\s/g, '').length < 16) {
        setFormError('⚠️ অনুগ্রহ করে আপনার ১৬ ডিজিটের কার্ড নম্বর দিন।');
        return;
      }
      if (!cardInfo.expiry.trim() || !cardInfo.cvv.trim()) {
        setFormError('⚠️ অনুগ্রহ করে কার্ডের মেয়াদ (MM/YY) এবং CVV প্রদান করুন।');
        return;
      }
    }

    setIsSubmitting(true);

    // Generate unique Kroyghor-formatted Order ID: #KG-XXXX
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#KG-${randomDigits}`;
    const orderTimestamp = generateOrderTimestamp();

    const draftOrder: Order = {
      id: orderId,
      date: orderTimestamp,
      items: [...items],
      subtotal,
      discount: couponDiscount,
      walletDeducted: effectiveWalletDeduction,
      deliveryFee,
      total: grandTotal,
      paymentMethod,
      trxId: trxId.trim() || undefined,
      paymentStatus: (paymentMethod === 'bkash' || paymentMethod === 'nagad') 
        ? 'Verified' 
        : paymentMethod === 'card' 
          ? 'Verified' 
          : 'Paid (COD on Delivery)',
      address: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        district,
        cityDivision,
        fullAddress: fullAddress.trim(),
        notes: notes.trim() || undefined,
      },
      status: 'Confirmed',
    };

    // Perform Server-Side Payment & Total Anti-Tamper Verification
    verifyOrderAndPayment(draftOrder, user)
      .then((verification) => {
        if (!verification.isValid) {
          setIsSubmitting(false);
          setFormError(`❌ ${verification.error || 'Payment verification failed. Please try again.'}`);
          return;
        }

        const secureOrder = verification.verifiedOrder;

        // Send order confirmation email via EmailJS (if configured)
        sendOrderEmail(secureOrder, user.email || undefined);

        (async () => {
          try {
            // Dual Write: Atomically write to root collection /orders/{orderId} & customer subcollection
            await saveOrderToFirestore(secureOrder, (user as any).uid || auth?.currentUser?.uid || user.email);
          } catch (e) {
            console.warn('[Checkout] Direct Firestore save warning:', e);
          }

          try {
            await Promise.resolve(onPlaceOrder(secureOrder));
          } catch (e) {
            console.warn('[Checkout] Order placement warning:', e);
          }

          setCompletedOrder(secureOrder);
          onClearCart();
          setIsSubmitting(false);
        })();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setFormError(`❌ Verification error: ${err.message || 'Server check failed'}`);
      });
  };

  const handleModalClose = () => {
    if (completedOrder) {
      setCompletedOrder(null);
    }
    onClose();
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4 md:p-6 animate-fadeIn">
        <div 
          id="checkout-modal-container"
          className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
        >
          {/* Top Bar Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <BrandLogo size="sm" />
              <div className="hidden sm:block h-6 w-px bg-slate-200" />
              <div>
                <h3 className="font-extrabold text-[#171717] text-base sm:text-lg flex items-center gap-2">
                  <span>Express Checkout</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Bangladesh Fast Track
                  </span>
                </h3>
                <p className="text-xs text-[#525252]">
                  {completedOrder ? 'Order Confirmation & Receipt' : 'Complete your order with Cash on Delivery or Mobile Payment'}
                </p>
              </div>
            </div>

            <button
              onClick={handleModalClose}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-gray-400 hover:text-[#171717] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Simulated SMS OTP Toast */}
          {checkoutSmsToast && (
            <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 animate-bounce shrink-0" />
                <span className="break-all sm:break-normal">
                  [DEMO SMS to {checkoutSmsToast.phone}]: Your Kroy Ghor Verification OTP is <strong>{checkoutSmsToast.code}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutOtpDigits(checkoutSmsToast.code.split(''));
                }}
                className="bg-white text-amber-900 px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-black hover:bg-amber-50 cursor-pointer shadow-xs shrink-0 active:scale-95"
              >
                Auto Fill OTP
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
            {completedOrder ? (
              /* ================= 3. Order Confirmation Screen & Invoice Summary ================= */
              <div className="space-y-6 max-w-2xl mx-auto py-4">
                {/* Success Banner */}
                <div className="text-center space-y-3">
                  <div className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-md animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
                      🎉 অর্ডার সফলভাবে সম্পন্ন হয়েছে!
                    </h2>
                    <p className="text-xs sm:text-sm text-[#525252] mt-1">
                      ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত করা হয়েছে এবং ডেলিভারি প্রসেসিং শুরু হয়েছে।
                    </p>
                  </div>
                </div>

                {/* Order ID & Delivery Timeline Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#EDE9FE]/50 border border-purple-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 pb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Order Reference ID
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-black text-[#5B21B6] font-mono">
                          {completedOrder.id}
                        </span>
                        <button
                          onClick={() => copyOrderId(completedOrder.id)}
                          className="px-2 py-1 rounded-md bg-white border border-purple-200 text-[11px] font-bold text-[#5B21B6] hover:bg-purple-50 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedOrderId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedOrderId ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Order Placed At
                      </span>
                      <p className="text-xs font-bold text-[#171717] font-mono mt-0.5">
                        {completedOrder.date}
                      </p>
                    </div>
                  </div>

                  {/* Estimated Delivery Timeline */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-purple-100 text-[#5B21B6] shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#171717]">
                        সম্ভাব্য ডেলিভারি সময় (Estimated Delivery):
                      </p>
                      <p className="text-[#5B21B6] font-semibold mt-0.5">
                        {completedOrder.address.cityDivision === 'Inside Dhaka' 
                          ? '২৪ থেকে ৪৮ ঘণ্টার মধ্যে (Next Day Express Inside Dhaka)' 
                          : '২ থেকে ৪ কর্মদিবসের মধ্যে (2-4 Days Standard Courier Delivery)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Server-Side Anti-Tamper & Payment Verification Stamp */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 block">Server-Side Payment & Total Verified</span>
                      <span className="text-[10px] text-emerald-700">Authoritative subtotal, promo coupon & gateway ledger double-checked</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    ENFORCED ✓
                  </span>
                </div>

                {/* Direct Live Parcel Tracking Link Card */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Direct Live Parcel Tracking Link</span>
                    <span className="font-mono text-xs font-bold text-blue-700 break-all">
                      https://zeropicbd.com/track/{completedOrder.id.replace('#', '')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`https://zeropicbd.com/track/${completedOrder.id.replace('#', '')}`)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNumber ? 'Copied!' : 'Copy Tracking Link'}</span>
                  </button>
                </div>

                {/* Recipient & Payment Breakdown Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <div className="font-bold text-[#171717] flex items-center gap-1.5 text-sm">
                      <MapPin className="w-4 h-4 text-[#5B21B6]" />
                      <span>ডেলিভারি ঠিকানা (Shipping Address)</span>
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-900">{completedOrder.address.fullName}</p>
                      <p className="font-mono">{completedOrder.address.phone}</p>
                      <p>{completedOrder.address.fullAddress}</p>
                      <p className="font-semibold text-[#5B21B6]">{completedOrder.address.cityDivision} ({completedOrder.address.district || 'Dhaka'})</p>
                      {completedOrder.address.notes && (
                        <p className="text-[11px] text-gray-500 italic mt-1">Note: "{completedOrder.address.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 space-y-2">
                    <div className="font-bold text-[#171717] flex items-center gap-1.5 text-sm">
                      <CreditCard className="w-4 h-4 text-[#5B21B6]" />
                      <span>পেমেন্ট তথ্য (Payment Details)</span>
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <p className="font-bold text-gray-900 uppercase">
                        {completedOrder.paymentMethod === 'cod' && 'Cash on Delivery (ক্যাশ অন ডেলিভারি)'}
                        {completedOrder.paymentMethod === 'bkash' && 'bKash Online Payment'}
                        {completedOrder.paymentMethod === 'nagad' && 'Nagad Online Payment'}
                        {completedOrder.paymentMethod === 'card' && 'Credit / Debit Card'}
                      </p>
                      {completedOrder.trxId && (
                        <p className="text-xs font-mono font-bold text-[#5B21B6]">
                          TrxID: {completedOrder.trxId}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500">
                        Status: <span className="font-bold text-emerald-600">Confirmed & Logged</span>
                      </p>
                      <div className="pt-1.5 border-t border-gray-200 text-xs flex justify-between font-bold text-[#171717]">
                        <span>Grand Total Payable:</span>
                        <span className="text-base text-[#5B21B6]">৳{completedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Preview */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 font-bold text-xs text-gray-700 border-b border-gray-200 flex justify-between">
                    <span>Ordered Items ({completedOrder.items.length})</span>
                    <span>Total Amount</span>
                  </div>
                  <div className="divide-y divide-gray-100 p-3">
                    {completedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                          />
                          <div>
                            <p className="font-bold text-[#171717] line-clamp-1">{item.product.title}</p>
                            <p className="text-[11px] text-gray-500">
                              Qty: {item.quantity} {item.selectedSize ? `• ${item.selectedSize}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-[#171717] font-mono">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions: Download Invoice, Track Order, Continue Shopping */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-[#171717] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#5B21B6]" />
                    <span>Download Invoice (চালান ডাউনলোড)</span>
                  </button>

                  {onViewOrders && (
                    <button
                      onClick={() => {
                        handleModalClose();
                        onViewOrders();
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>লাইভ অর্ডার ট্র্যাক করুন (Track Order)</span>
                    </button>
                  )}

                  <button
                    onClick={handleModalClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl text-gray-600 hover:text-[#171717] font-bold text-xs text-center transition-colors cursor-pointer"
                  >
                    আরও কেনাকাটা করুন (Continue Shopping)
                  </button>
                </div>
              </div>
            ) : (
              /* ================= 1 & 2. Bangladesh-Optimized Single-Page Checkout Form ================= */
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {checkoutVerifySuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{checkoutVerifySuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Essential Buyer Info & Delivery Region & Payment */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Section 1: Customer Details */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2 font-extrabold text-[#171717] text-sm">
                          <User className="w-4 h-4 text-[#5B21B6]" />
                          <span>১. কাস্টমার ও ডেলিভারি তথ্য (Buyer Details)</span>
                        </div>
                        {user.isLoggedIn ? (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {user.name}
                          </span>
                        ) : onOpenAuth ? (
                          <button
                            type="button"
                            onClick={onOpenAuth}
                            className="text-[11px] font-bold text-[#5B21B6] hover:underline cursor-pointer"
                          >
                            লগইন করুন (Login)
                          </button>
                        ) : null}
                      </div>

                      {/* Saved Address Book quick selector if user has saved addresses */}
                      {savedAddressesList.length > 1 && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-600">Saved Delivery Addresses</label>
                          <div className="grid grid-cols-2 gap-2">
                            {savedAddressesList.map((addr, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setAddressMode('saved');
                                  setSelectedSavedIndex(idx);
                                }}
                                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                  selectedSavedIndex === idx && addressMode === 'saved'
                                    ? 'bg-purple-50 border-[#5B21B6] text-[#5B21B6]'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <p className="font-bold truncate">{addr.fullName}</p>
                                <p className="text-[10px] text-gray-500 truncate">{addr.fullAddress}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Full Name */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            আপনার পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="যেমন: তানভীর আহমেদ"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full h-11 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#171717] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                          />
                        </div>

                        {/* Phone Number with BD Validation & Instant OTP Verification Trigger */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-700">
                              মোবাইল নম্বর (01XXXXXXXXX) <span className="text-rose-500">*</span>
                            </label>
                            {isPhoneVerifiedLocally ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Verified & ৳20 Bonus Claimed
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleTriggerCheckoutOtp}
                                className="min-h-[36px] text-[10px] font-bold text-[#5B21B6] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3" />
                                ৳২০ বোনাস পেতে ভেরিফাই করুন
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                              +88
                            </div>
                            <input
                              type="tel"
                              required
                              maxLength={11}
                              placeholder="01XXXXXXXXX (11 digits)"
                              value={phone}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPhone(val);
                                if (val !== user.phone) {
                                  setIsPhoneVerifiedLocally(false);
                                }
                              }}
                              className="w-full h-11 min-h-[44px] pl-11 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold text-[#171717] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                            />
                          </div>

                          {/* In-Checkout Phone OTP Verification Box */}
                          {showPhoneVerifyBox && !isPhoneVerifiedLocally && (
                            <div className="mt-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#5B21B6]">৪-সংখ্যার ভেরিফিকেশন কোড লিখুন</span>
                                <span className="text-[10px] text-gray-500 font-mono">Sent to {phone}</span>
                              </div>
                              <div className="flex gap-2 items-center">
                                {[0, 1, 2, 3].map((idx) => (
                                  <input
                                    key={idx}
                                    type="text"
                                    maxLength={1}
                                    value={checkoutOtpDigits[idx]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const copy = [...checkoutOtpDigits];
                                      copy[idx] = val;
                                      setCheckoutOtpDigits(copy);
                                      if (val && idx < 3) {
                                        const nextInput = document.getElementById(`checkout-otp-${idx + 1}`);
                                        if (nextInput) nextInput.focus();
                                      }
                                    }}
                                    id={`checkout-otp-${idx}`}
                                    className="w-11 h-11 min-h-[44px] min-w-[40px] text-center text-sm font-black font-mono rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-[#5B21B6] bg-white"
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={handleVerifyCheckoutOtp}
                                  className="flex-1 h-11 min-h-[44px] px-3 py-2 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  ভেরিফাই
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delivery Region Selection (Inside Dhaka ৳60 vs Outside Dhaka ৳120) */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            ডেলিভারি রিজিয়ন নির্বাচন করুন (Delivery Area) <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleShippingChange('Inside Dhaka')}
                              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer min-h-[52px] ${
                                cityDivision === 'Inside Dhaka'
                                  ? 'bg-purple-50/80 border-[#5B21B6] ring-2 ring-[#5B21B6]/30 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-xs text-[#171717]">
                                <span className="truncate">Inside Dhaka</span>
                                {cityDivision === 'Inside Dhaka' && <CheckCircle2 className="w-4 h-4 text-[#5B21B6] shrink-0" />}
                              </div>
                              <div className="text-[11px] font-black text-[#5B21B6] mt-1">
                                ৳60 চার্জ
                              </div>
                              <div className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">
                                ২৪-৪৮ ঘণ্টা এক্সপ্রেস
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShippingChange('Outside Dhaka')}
                              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer min-h-[52px] ${
                                cityDivision === 'Outside Dhaka'
                                  ? 'bg-purple-50/80 border-[#5B21B6] ring-2 ring-[#5B21B6]/30 shadow-xs'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold text-xs text-[#171717]">
                                <span className="truncate">Outside Dhaka</span>
                                {cityDivision === 'Outside Dhaka' && <CheckCircle2 className="w-4 h-4 text-[#5B21B6] shrink-0" />}
                              </div>
                              <div className="text-[11px] font-black text-[#5B21B6] mt-1">
                                ৳120 চার্জ
                              </div>
                              <div className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">
                                ২-৪ দিন সারা বাংলাদেশ
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* District Selection */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            জেলা (District) <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={district}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="w-full h-11 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#171717] bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                          >
                            {BD_DISTRICTS.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist} {dist === 'Dhaka' ? '(Inside Dhaka - ৳60)' : '(Outside Dhaka - ৳120)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Full Delivery Address */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            পূর্ণ ডেলিভারি ঠিকানা (Detailed Address) <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            placeholder="বাড়ি নং, রোড নং, এলাকা/থানা (যেমন: বাসা # ১২, রোড # ৩, সেক্টর # ৭, উত্তরা, ঢাকা)"
                            value={fullAddress}
                            onChange={(e) => setFullAddress(e.target.value)}
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#171717] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                          />
                        </div>

                        {/* Special Delivery Instructions */}
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            বিশেষ ডেলিভারি নির্দেশনা (Delivery Instructions - Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="যেমন: কল দিয়ে আসবেন, গেটের দারোয়ানকে দিবেন, বিকাল ৪টার পর ডেলিভারি..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-11 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-[#171717] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Integrated Payment Options */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-4">
                      <div className="flex items-center gap-2 font-extrabold text-[#171717] text-sm border-b border-gray-100 pb-2.5">
                        <CreditCard className="w-4 h-4 text-[#5B21B6]" />
                        <span>২. পেমেন্ট পদ্ধতি নির্বাচন করুন (Payment Options)</span>
                      </div>

                      {/* Payment Option Tabs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Cash on Delivery */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'cod'
                              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1.5">
                            <Truck className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-xs text-[#171717]">ক্যাশ অন ডেলিভারি</p>
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">COD (পণ্য পেয়ে টাকা)</p>
                        </button>

                        {/* bKash */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bkash')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'bkash'
                              ? 'bg-pink-50 border-pink-500 ring-2 ring-pink-500/20 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center mx-auto mb-1.5 font-bold text-xs">
                            bKash
                          </div>
                          <p className="font-bold text-xs text-[#171717]">বিকাশ</p>
                          <p className="text-[10px] text-pink-700 font-semibold mt-0.5">Send Money / TrxID</p>
                        </button>

                        {/* Nagad */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('nagad')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'nagad'
                              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-1.5 font-bold text-xs">
                            নগদ
                          </div>
                          <p className="font-bold text-xs text-[#171717]">নগদ</p>
                          <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Send Money / TrxID</p>
                        </button>

                        {/* Card */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            paymentMethod === 'card'
                              ? 'bg-purple-50 border-[#5B21B6] ring-2 ring-[#5B21B6]/20 shadow-xs'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5B21B6] flex items-center justify-center mx-auto mb-1.5">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-xs text-[#171717]">কার্ড / SSL</p>
                          <p className="text-[10px] text-purple-700 font-semibold mt-0.5">Debit/Credit Card</p>
                        </button>
                      </div>

                      {/* Payment Method Details Box */}
                      {paymentMethod === 'cod' && (
                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                          <div className="flex items-center gap-2 font-bold text-emerald-900">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>ক্যাশ অন ডেলিভারি (Cash on Delivery) নির্দেশনা</span>
                          </div>
                          <p className="text-emerald-800 leading-relaxed text-[11px]">
                            • পার্সেলটি আপনার ঠিকানায় পৌঁছানোর পর ডেলিভারিম্যানকে পণ্য দেখে নগদ মূল্য <strong>৳{grandTotal.toLocaleString()}</strong> পরিশোধ করুন।
                          </p>
                          <p className="text-emerald-800 leading-relaxed text-[11px]">
                            • কোনো ধরনের অগ্রিম পেমেন্টের প্রয়োজন নেই। ১০০% সুরক্ষিত শপিং গ্যারান্টি।
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'bkash' && (
                        <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-pink-900">
                              <Smartphone className="w-4 h-4 text-pink-600" />
                              <span>bKash Send Money পেমেন্ট নির্দেশিকা</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded text-pink-700 border border-pink-200">
                              Amount: ৳{grandTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Account Copy Card */}
                          <div className="p-3 bg-white rounded-xl border border-pink-200 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-500 font-semibold uppercase">
                                Official bKash Number (Personal/Send Money)
                              </p>
                              <p className="text-sm font-mono font-black text-pink-600 tracking-wider">
                                {bkashNumber}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(bkashNumber)}
                              className="px-3 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedNumber === bkashNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedNumber === bkashNumber ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* Step-by-Step Instructions */}
                          <div className="text-[11px] text-gray-700 space-y-1 bg-white/60 p-2.5 rounded-xl">
                            <p>১. আপনার বিকাশ অ্যাপ ওপেন করুন অথবা *247# ডায়াল করুন।</p>
                            <p>২. <strong>Send Money</strong> অপশন নির্বাচন করে <strong>{bkashNumber}</strong> নম্বরে পাঠান।</p>
                            <p>৩. টাকার পরিমাণ <strong>৳{grandTotal.toLocaleString()}</strong> এবং রেফারেন্সে <strong>PVZ</strong> লিখুন।</p>
                            <p>৪. ট্রানজেকশন সম্পন্ন হলে প্রাপ্ত <strong>TrxID</strong> নিচে প্রবেশ করান।</p>
                          </div>

                          {/* Inputs: Sender Phone & TrxID */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                বিকাশ প্রেরকের নম্বর (Sender Phone)
                              </label>
                              <input
                                type="tel"
                                placeholder="01XXXXXXXXX"
                                value={paymentSenderPhone}
                                onChange={(e) => setPaymentSenderPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs font-mono font-bold focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                বিকাশ Transaction ID (TrxID) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="যেমন: BKS9823192"
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 rounded-xl border border-pink-300 text-xs font-mono font-black uppercase text-pink-700 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'nagad' && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-amber-900">
                              <Smartphone className="w-4 h-4 text-amber-600" />
                              <span>Nagad Send Money পেমেন্ট নির্দেশিকা</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded text-amber-800 border border-amber-200">
                              Amount: ৳{grandTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Account Copy Card */}
                          <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-500 font-semibold uppercase">
                                Official Nagad Number (Send Money)
                              </p>
                              <p className="text-sm font-mono font-black text-amber-700 tracking-wider">
                                {nagadNumber}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(nagadNumber)}
                              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {copiedNumber === nagadNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedNumber === nagadNumber ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* Steps */}
                          <div className="text-[11px] text-gray-700 space-y-1 bg-white/60 p-2.5 rounded-xl">
                            <p>১. আপনার নগদ অ্যাপ ওপেন করুন অথবা *167# ডায়াল করুন।</p>
                            <p>২. <strong>Send Money</strong> অপশন নির্বাচন করে <strong>{nagadNumber}</strong> নম্বরে পাঠান।</p>
                            <p>৩. টাকার পরিমাণ <strong>৳{grandTotal.toLocaleString()}</strong> দিন।</p>
                            <p>৪. ট্রানজেকশন সফল হলে প্রাপ্ত <strong>TrxID</strong> নিচে প্রবেশ করান।</p>
                          </div>

                          {/* Inputs: Sender Phone & TrxID */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                নগদ প্রেরকের নম্বর (Sender Phone)
                              </label>
                              <input
                                type="tel"
                                placeholder="01XXXXXXXXX"
                                value={paymentSenderPhone}
                                onChange={(e) => setPaymentSenderPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                নগদ Transaction ID (TrxID) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="যেমন: NGD9182319"
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-black uppercase text-amber-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 text-xs">
                          <div className="flex items-center justify-between font-bold text-[#5B21B6]">
                            <span>VISA / MasterCard / SSLCommerz Secure Gateway</span>
                            <span className="text-[10px] text-gray-500">256-bit SSL</span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              maxLength={19}
                              placeholder="কার্ড নম্বর (Card Number - 16 digits)"
                              value={cardInfo.cardNumber}
                              onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-mono focus:outline-none bg-white"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                maxLength={5}
                                placeholder="MM/YY"
                                value={cardInfo.expiry}
                                onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-mono focus:outline-none bg-white"
                              />
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="CVV"
                                value={cardInfo.cvv}
                                onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-mono focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Order Summary, Wallet Deduction & Coupon Breakdown */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Cart Items Review Preview */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-[#E5E7EB] space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="font-extrabold text-xs text-[#171717] flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-[#5B21B6]" />
                          <span>অর্ডারের পণ্যসমূহ ({items.length} Products • {Object.keys(vendorGroups).length} Stores)</span>
                        </span>
                        <span className="text-xs font-bold text-[#5B21B6]">
                          ৳{subtotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Multi-Vendor Grouped Checkout Items */}
                      <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                        {Object.entries(vendorGroups).map(([vendorName, vendorItems]) => (
                          <div key={vendorName} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                            <div className="px-3 py-1.5 bg-purple-50/70 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B21B6]">
                                <Store className="w-3.5 h-3.5 text-[#5B21B6]" />
                                <span className="truncate max-w-[170px]">{vendorName}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  Verified
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium">
                                {vendorItems.length} {vendorItems.length === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <div className="divide-y divide-gray-100 p-2 space-y-1.5">
                              {vendorItems.map((item) => (
                                <div key={item.product.id} className="flex items-center justify-between text-xs py-1">
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <img
                                      src={item.product.image}
                                      alt={item.product.title}
                                      width={36}
                                      height={36}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-[#171717] line-clamp-1">{item.product.title}</p>
                                      <p className="text-[10px] text-gray-500">
                                        Qty: {item.quantity} {item.selectedSize ? `• ${item.selectedSize}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-[#171717] font-mono shrink-0">
                                    ৳{(item.product.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Promo Coupon Application */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#171717]">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#5B21B6]" />
                          <span>Promo Coupon Code</span>
                        </span>
                        {isCouponApplied && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            Applied
                          </span>
                        )}
                      </div>

                      {isCouponApplied && appliedCoupon ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                          <div>
                            <span className="font-black text-emerald-800 uppercase font-mono">{appliedCoupon.code}</span>
                            <span className="text-[11px] text-emerald-700 ml-1.5 font-bold">
                              (-৳{couponDiscount.toLocaleString()})
                            </span>
                          </div>
                          {onRemoveCoupon && (
                            <button
                              type="button"
                              onClick={onRemoveCoupon}
                              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="কুপন কোড (যেমন: ZERO10)"
                            value={inputCouponCode}
                            onChange={(e) => setInputCouponCode(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#5B21B6]"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCouponCode()}
                            className="px-3.5 py-2 rounded-xl bg-[#5B21B6] text-white font-bold text-xs hover:bg-[#4C1D95] transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      {/* Smart Auto-Apply Deal Suggestion Banner */}
                      {autoCouponDeal && autoCouponDeal.coupon && !isCouponApplied && (
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 flex items-center justify-between gap-2 animate-pulse">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 truncate">
                                {autoCouponDeal.reason}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Apply code <strong className="font-mono text-[#5B21B6]">{autoCouponDeal.coupon.code}</strong> to save ৳{autoCouponDeal.discountAmount}!
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCouponCode(autoCouponDeal.coupon?.code)}
                            className="px-2.5 py-1 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[10px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
                          >
                            Auto-Apply
                          </button>
                        </div>
                      )}

                      {couponFeedback && (
                        <p className={`text-[11px] font-semibold ${couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {couponFeedback.message}
                        </p>
                      )}
                    </div>

                    {/* Interactive Wallet Bonus Deduction Box */}
                    {activeUserBalance > 0 && (
                      <div className={`p-4 rounded-2xl border transition-all ${
                        useWalletBonus
                          ? 'bg-purple-50/80 border-purple-300'
                          : 'bg-white border-[#E5E7EB]'
                      }`}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-[#5B21B6]" />
                            <div>
                              <span className="font-bold text-[#171717]">Wallet Bonus: ৳{activeUserBalance}</span>
                              <p className="text-[10px] text-gray-500">Apply ৳{maxWalletBonusDeductible} cash deduction</p>
                            </div>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useWalletBonus}
                              onChange={(e) => setUseWalletBonus(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5B21B6]"></div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Order Financial Breakdown Summary */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5 text-xs text-[#525252]">
                      <div className="font-extrabold text-[#171717] text-sm border-b border-gray-100 pb-2">
                        ৩. পেমেন্ট সামারি (Financial Breakdown)
                      </div>

                      <div className="flex justify-between">
                        <span>পণ্য সাবটোটাল (Subtotal)</span>
                        <span className="font-bold text-[#171717]">৳{subtotal.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>ডেলিভারি চার্জ ({cityDivision})</span>
                        <span className="font-bold text-[#171717]">৳{deliveryFee.toLocaleString()}</span>
                      </div>

                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>কুপন ছাড় (Coupon Discount)</span>
                          <span>-৳{couponDiscount.toLocaleString()}</span>
                        </div>
                      )}

                      {effectiveWalletDeduction > 0 && (
                        <div className="flex justify-between text-purple-700 font-semibold">
                          <span>ওয়ালেট বোনাস ছাড় (Wallet Bonus)</span>
                          <span>-৳{effectiveWalletDeduction.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-gray-200 flex justify-between items-baseline">
                        <div>
                          <span className="text-sm font-black text-[#171717]">মোট প্রদেয় (Grand Total)</span>
                          <span className="block text-[10px] text-gray-500">VAT & Taxes Included</span>
                        </div>
                        <span className="text-2xl font-black text-[#5B21B6] font-mono">
                          ৳{grandTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Primary Order Placement Submit CTA */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[52px] mt-3 py-3.5 px-4 rounded-xl font-black text-white bg-[#5B21B6] hover:bg-[#4C1D95] shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:bg-gray-300"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>অর্ডার প্রসেসিং হচ্ছে...</span>
                          </div>
                        ) : (
                          <>
                            <span>অর্ডার নিশ্চিত করুন (Confirm Order ৳{grandTotal.toLocaleString()})</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* 4 Marketplace Trust Badges */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200/80">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-[10px] leading-tight">
                            <span className="font-bold text-gray-900 block">100% Authentic</span>
                            <span className="text-gray-500 text-[9px]">Verified Quality</span>
                          </div>
                        </div>

                        <div 
                          onClick={onOpenReturnPolicy}
                          className={`flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200/80 transition-colors ${onOpenReturnPolicy ? 'cursor-pointer hover:border-purple-300' : ''}`}
                          title="7-Day Hassle-Free Replacement / Return Policy"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="text-[10px] leading-tight">
                            <span className="font-bold text-gray-900 block">7-Day Return</span>
                            <span className="text-gray-500 text-[9px]">Hassle-Free Policy</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200/80">
                          <Truck className="w-4 h-4 text-[#5B21B6] shrink-0" />
                          <div className="text-[10px] leading-tight">
                            <span className="font-bold text-gray-900 block">64 Districts</span>
                            <span className="text-gray-500 text-[9px]">Nationwide Express</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200/80">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="text-[10px] leading-tight">
                            <span className="font-bold text-gray-900 block">COD & Pay</span>
                            <span className="text-gray-500 text-[9px]">Check Before Pay</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-1 text-[10px] text-gray-500 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>১০০% নিরাপদ ও সুরক্ষিত ভেরিফাইড লেনদেন নিশ্চয়তা</span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Modal for Printable / Downloadable Invoice */}
      {completedOrder && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={completedOrder}
        />
      )}
    </>
  );
};
