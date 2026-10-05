import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Wallet,
  Tag,
  CreditCard,
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Gift,
  Lock,
  Package,
  RotateCcw
} from 'lucide-react';
import { CartItem, UserProfile, Order, Coupon, Address } from '../types';
import { BD_DISTRICTS } from './Checkout';
import { BrandLogo } from './BrandLogo';
import { InvoiceModal } from './InvoiceModal';
import {
  saveOrderToFirestore,
  deductUserWalletInFirestore,
  getFirestoreUserWalletBalance,
  broadcastNewOrder
} from '../services/orderFirestoreService';
import { db } from '../lib/firebaseAuth';
import { doc, onSnapshot } from 'firebase/firestore';

export interface CheckoutPageProps {
  items: CartItem[];
  user: UserProfile;
  subtotal: number;
  couponDiscount: number;
  couponCode?: string;
  isCouponApplied?: boolean;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (code: string) => { success: boolean; message: string };
  onRemoveCoupon?: () => void;
  onPlaceOrder: (order: Order) => void;
  onClearCart: () => void;
  onGoHome: () => void;
  onViewOrders?: () => void;
  onTrackOrder?: (orderId: string) => void;
  onOpenAuth?: () => void;
  onOpenReturnPolicy?: () => void;
  showToast?: (msg: string) => void;
  onUpdateUserWallet?: (newBalance: number) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  user,
  subtotal,
  couponDiscount,
  couponCode = '',
  isCouponApplied = false,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  onPlaceOrder,
  onClearCart,
  onGoHome,
  onViewOrders,
  onTrackOrder,
  onOpenAuth,
  onOpenReturnPolicy,
  showToast = () => {},
  onUpdateUserWallet,
}) => {
  // Live user wallet balance fetched from Firestore (users/{uid})
  const [firestoreWalletBalance, setFirestoreWalletBalance] = useState<number>(user.walletBalance || 0);

  useEffect(() => {
    setFirestoreWalletBalance(user.walletBalance || 0);

    const targetUid = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : (user.phone || 'user');
    if (db && user.isLoggedIn && targetUid) {
      try {
        const userRef = doc(db, 'users', targetUid);
        const unsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data?.walletBalance === 'number') {
              setFirestoreWalletBalance(data.walletBalance);
            }
          }
        });
        return () => unsub();
      } catch (e) {
        console.warn('Error subscribing to user wallet in checkout:', e);
      }
    }
  }, [user.isLoggedIn, user.email, user.phone, user.walletBalance]);

  // Saved addresses from user profile
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

  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved');
  const [selectedSavedIndex, setSelectedSavedIndex] = useState<number>(0);

  // Address Form States
  const [fullName, setFullName] = useState(user.address?.fullName || user.name || '');
  const [phone, setPhone] = useState(user.address?.phone || user.phone || '');
  const [district, setDistrict] = useState<string>(user.address?.district || 'Dhaka');
  const [cityDivision, setCityDivision] = useState<'Inside Dhaka' | 'Outside Dhaka'>(
    user.address?.cityDivision || 'Inside Dhaka'
  );
  const [fullAddress, setFullAddress] = useState(user.address?.fullAddress || '');
  const [notes, setNotes] = useState(user.address?.notes || '');

  // Payment Method: 'cod' | 'bkash' | 'nagad'
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Wallet Discount Toggle
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(true);

  // Coupon Input
  const [inputCouponCode, setInputCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Submission & Success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Synchronize with saved addresses
  useEffect(() => {
    if (savedAddressesList.length > 0 && addressMode === 'saved') {
      const active = savedAddressesList[selectedSavedIndex] || savedAddressesList[0];
      if (active) {
        setFullName(active.fullName || user.name || '');
        setPhone(active.phone || user.phone || '');
        setDistrict(active.district || 'Dhaka');
        setCityDivision(active.cityDivision || 'Inside Dhaka');
        setFullAddress(active.fullAddress || '');
        setNotes(active.notes || '');
      }
    }
  }, [addressMode, selectedSavedIndex, savedAddressesList, user.name, user.phone]);

  // Delivery fee: ৳80 Inside Dhaka, ৳150 Outside Dhaka
  const deliveryFee = cityDivision === 'Inside Dhaka' ? 80 : 150;

  // Handle District changes
  const handleDistrictChange = (selectedDist: string) => {
    setDistrict(selectedDist);
    if (selectedDist === 'Dhaka') {
      setCityDivision('Inside Dhaka');
    } else {
      setCityDivision('Outside Dhaka');
    }
  };

  // Handle Division selector
  const handleDivisionChange = (division: 'Inside Dhaka' | 'Outside Dhaka') => {
    setCityDivision(division);
    if (division === 'Inside Dhaka' && district !== 'Dhaka') {
      setDistrict('Dhaka');
    } else if (division === 'Outside Dhaka' && district === 'Dhaka') {
      setDistrict('Chattogram');
    }
  };

  // Calculate wallet discount
  const availableWallet = Math.max(0, firestoreWalletBalance);
  const grossBeforeWallet = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const walletDiscount = useWalletBalance && availableWallet > 0
    ? Math.min(availableWallet, grossBeforeWallet)
    : 0;

  // Final Total
  const grandTotal = Math.max(0, grossBeforeWallet - walletDiscount);

  // Merchant numbers for bKash & Nagad
  const merchantPhone = '01883418309';

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    showToast(`✓ Copied ${num} to clipboard`);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Apply Coupon Code
  const handleApplyCouponCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCouponCode.trim()) return;
    if (onApplyCoupon) {
      const res = onApplyCoupon(inputCouponCode.trim());
      if (res.success) {
        setCouponFeedback({ type: 'success', message: res.message });
        setInputCouponCode('');
      } else {
        setCouponFeedback({ type: 'error', message: res.message });
      }
    }
  };

  // Fast Sub-Second Non-Blocking Order Submission Handler
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Immediate Synchronous Input Validations
    if (!fullName.trim()) {
      setFormError('⚠️ অনুগ্রহ করে আপনার পূর্ণ নাম প্রদান করুন (Full Name is required).');
      return;
    }

    const cleanPhone = phone.trim().replace(/[-+\s]/g, '');
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setFormError('⚠️ অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX).');
      return;
    }

    if (!fullAddress.trim() || fullAddress.trim().length < 6) {
      setFormError('⚠️ অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন (বাড়ি নং, রোড নং, এলাকা / থানা).');
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !trxId.trim()) {
      setFormError(
        `⚠️ অনুগ্রহ করে আপনার ${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Transaction ID (TrxID) ইনপুট দিন।`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate Pristine Order ID: #KG-XXXX
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const orderId = `#KG-${randomDigits}`;

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
      const orderTimestamp = `${formattedDate}, ${formattedTime}`;

      const targetUid = user.isLoggedIn
        ? (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : (user.phone || 'user'))
        : 'guest';

      const newOrder: Order = {
        id: orderId,
        userId: targetUid,
        customerName: fullName.trim(),
        customerEmail: user.email || '',
        customerPhone: cleanPhone,
        date: orderTimestamp,
        items: [...items],
        subtotal,
        discount: couponDiscount,
        walletDeducted: walletDiscount,
        deliveryFee,
        total: grandTotal,
        paymentMethod,
        trxId: trxId.trim() || undefined,
        paymentStatus:
          paymentMethod === 'cod'
            ? 'Paid (COD on Delivery)'
            : trxId.trim()
            ? 'Pending Verification'
            : 'Unpaid',
        address: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          district,
          cityDivision,
          fullAddress: fullAddress.trim(),
          notes: notes.trim() || undefined,
        },
        status: 'Pending',
      };

      // 2. Instant Multi-Channel Real-time Broadcast (< 10ms sync to Admin & Tabs)
      broadcastNewOrder(newOrder);

      // 3. Optimistic Fast State Reset (< 200ms)
      onClearCart();
      onPlaceOrder(newOrder);

      if (walletDiscount > 0 && targetUid && targetUid !== 'guest') {
        const remaining = Math.max(0, firestoreWalletBalance - walletDiscount);
        setFirestoreWalletBalance(remaining);
        if (onUpdateUserWallet) {
          onUpdateUserWallet(remaining);
        }
      }

      setCompletedOrder(newOrder);
      setIsSubmitting(false);
      showToast(`🎉 Order Placed Successfully! Order ID: ${orderId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 4. Asynchronous Non-Blocking Background Workers (Firestore persistence & wallet audit)
      (async () => {
        try {
          await saveOrderToFirestore(newOrder, targetUid);
          if (walletDiscount > 0 && targetUid && targetUid !== 'guest') {
            await deductUserWalletInFirestore(
              targetUid,
              walletDiscount,
              orderId,
              user.email
            );
          }
        } catch (bgError) {
          console.warn('[Checkout Background Sync] Background order persistence warning:', bgError);
        }
      })();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setFormError(`❌ Order placement failed: ${err.message || 'Please try again'}`);
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW A: ORDER CONFIRMATION / INVOICE SUCCESS VIEW
  // =========================================================================
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Success Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-2">
                ✓ Order Confirmed (অর্ডার নিশ্চিত হয়েছে)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A1B3D]">
                ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                আপনার অর্ডার আইডি <span className="font-mono font-black text-[#007BFF]">{completedOrder.id}</span>। আমাদের ডেলিভারি টিম দ্রুত আপনার পণ্য প্রস্তুত করছে।
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onViewOrders && (
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="px-5 py-2.5 rounded-xl bg-[#007BFF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Package className="w-4 h-4" />
                  <span>আমার অর্ডার হিস্ট্রি দেখুন (My Profile & Orders)</span>
                </button>
              )}

              {onTrackOrder && (
                <button
                  type="button"
                  onClick={() => onTrackOrder(completedOrder.id)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Truck className="w-4 h-4" />
                  <span>লাইভ পার্সেল ট্র্যাক করুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>অফিশিয়াল ইনভয়েস প্রিন্ট / ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={onGoHome}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>আরও কেনাকাটা করুন</span>
              </button>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivery Address Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <MapPin className="w-4 h-4 text-[#007BFF]" />
                <span>ডেলিভারি ঠিকানা</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-[#0A1B3D] text-sm">{completedOrder.address.fullName}</p>
                <p className="text-slate-600 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{completedOrder.address.phone}</span>
                </p>
                <p className="text-slate-600 leading-relaxed pt-1">
                  {completedOrder.address.fullAddress}, {completedOrder.address.district} ({completedOrder.address.cityDivision})
                </p>
                {completedOrder.address.notes && (
                  <p className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-500 italic mt-2 border border-slate-100">
                    নোট: {completedOrder.address.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <CreditCard className="w-4 h-4 text-[#007BFF]" />
                <span>পেমেন্ট তথ্য</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">পেমেন্ট মেথড:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {completedOrder.paymentMethod === 'cod'
                      ? 'Cash on Delivery (ক্যাশ অন ডেলিভারি)'
                      : completedOrder.paymentMethod === 'bkash'
                      ? 'bKash Digital Payment'
                      : 'Nagad Digital Payment'}
                  </span>
                </div>

                {completedOrder.trxId && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">TrxID:</span>
                    <span className="font-mono font-bold text-[#007BFF]">{completedOrder.trxId}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">পেমেন্ট স্ট্যাটাস:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {completedOrder.paymentStatus || 'Pending'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 font-bold text-sm">
                  <span className="text-slate-700">পরিশোধযোগ্য মোট:</span>
                  <span className="font-mono text-[#007BFF]">৳{completedOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Time & Courier Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <Truck className="w-4 h-4 text-[#007BFF]" />
                <span>ডেলিভারি আপডেট</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {completedOrder.address.cityDivision === 'Inside Dhaka'
                      ? 'ঢাকার ভিতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি'
                      : 'ঢাকার বাইরে ৩ থেকে ৫ কার্যদিবসের মধ্যে ডেলিভারি'}
                  </span>
                </p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="font-bold text-[#0A1B3D]">রাইডার ডেলিভারি সিকিউরিটি</p>
                  <p className="text-[11px] text-slate-500">
                    পার্সেল রিসিভ করার সময় চেক করে নিন। কোনো সহায়তার জন্য কল করুন 01883-418309।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Items Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-[#0A1B3D] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#007BFF]" />
              <span>অর্ডারের পণ্যসমূহ ({completedOrder.items.length})</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {completedOrder.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0A1B3D] line-clamp-1">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        পরিমাণ: <span className="font-bold text-slate-700">{item.quantity}</span>
                        {item.selectedSize && ` • সাইজ: ${item.selectedSize}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-mono font-black text-[#0A1B3D]">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-200 max-w-xs ml-auto space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>সাবটোটাল:</span>
                <span className="font-mono font-bold text-slate-800">৳{completedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold text-slate-800">৳{completedOrder.deliveryFee.toLocaleString()}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>কুপন ছাড়:</span>
                  <span className="font-mono">-৳{completedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              {completedOrder.walletDeducted > 0 && (
                <div className="flex justify-between text-indigo-600 font-bold">
                  <span>ওয়ালেট ব্যালেন্স ছাড়:</span>
                  <span className="font-mono">-৳{completedOrder.walletDeducted.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#0A1B3D] pt-2 border-t border-slate-200">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="font-mono text-[#007BFF]">৳{completedOrder.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Modal */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={completedOrder}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW B: EMPTY CART REDIRECT
  // =========================================================================
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-[#0A1B3D]">আপনার কার্ট বর্তমানে খালি</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              চেকআউট সম্পন্ন করার জন্য অনুগ্রহ করে আপনার কার্টে পছন্দের পণ্য যুক্ত করুন।
            </p>
          </div>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full py-3 px-6 rounded-xl bg-[#007BFF] hover:bg-blue-600 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>শপিং শুরু করুন (Return to Shop)</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW C: DEDICATED FULL-PAGE CHECKOUT FORM (DESKTOP SIDE-BY-SIDE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-1.5 text-slate-500 hover:text-[#007BFF] font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>কেনাকাটায় ফিরে যান (Back to Shop)</span>
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[#007BFF] font-bold">কার্ট</span>
            <span>/</span>
            <span className="font-extrabold text-[#0A1B3D]">নিরাপদ চেকআউট (Secure Checkout)</span>
          </div>
        </div>

        {/* Form Validation Error Banner */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Main 2-Column Side-by-Side Layout */}
        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================================================================= */}
          {/* LEFT COLUMN: CUSTOMER DETAILS, WALLET APPLIER & PAYMENT */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* STEP 1: SHIPPING & CUSTOMER ADDRESS FORM */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007BFF] font-black text-xs flex items-center justify-center border border-blue-100">
                    ১
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0A1B3D]">
                      ডেলিভারি ও কাস্টমার ঠিকানা
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      সঠিক নাম ও ফোন নম্বর দিন যাতে কুরিয়ার রাইডার সহজেই যোগাযোগ করতে পারে
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>নিরাপদ ডেলিভারি</span>
                </div>
              </div>

              {/* Saved Addresses Selector (If available) */}
              {savedAddressesList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>সংরক্ষিত ঠিকানা নির্বাচন করুন:</span>
                    <button
                      type="button"
                      onClick={() => setAddressMode(addressMode === 'saved' ? 'new' : 'saved')}
                      className="text-[#007BFF] hover:underline cursor-pointer"
                    >
                      {addressMode === 'saved' ? '+ নতুন ঠিকানা লিখুন' : 'সংরক্ষিত ঠিকানা ব্যবহার করুন'}
                    </button>
                  </div>

                  {addressMode === 'saved' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {savedAddressesList.map((addr, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedSavedIndex(idx)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            selectedSavedIndex === idx
                              ? 'border-[#007BFF] bg-blue-50/50 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span>{addr.fullName}</span>
                            {selectedSavedIndex === idx && (
                              <CheckCircle2 className="w-4 h-4 text-[#007BFF]" />
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] line-clamp-1">{addr.phone}</p>
                          <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">{addr.fullAddress}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    আপনার পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোঃ সাকিব চৌধুরী"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    সচল মোবাইল নম্বর (11-Digit Mobile Phone) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#007BFF] bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* City/Division Selector & Dynamic Delivery Fee */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  ডেলিভারি অঞ্চল নির্বাচন করুন (Delivery Region & Fee) <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDivisionChange('Inside Dhaka')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      cityDivision === 'Inside Dhaka'
                        ? 'border-[#007BFF] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-xs text-[#0A1B3D]">ঢাকার ভিতরে (Inside Dhaka)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">হোম ডেলিভারি ২৪-৪৮ ঘণ্টায়</p>
                    </div>
                    <span className="font-mono font-black text-sm text-[#007BFF]">৳80</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDivisionChange('Outside Dhaka')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      cityDivision === 'Outside Dhaka'
                        ? 'border-[#007BFF] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-xs text-[#0A1B3D]">ঢাকার বাইরে (Outside Dhaka)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">সমগ্র বাংলাদেশে হোম ডেলিভারি</p>
                    </div>
                    <span className="font-mono font-black text-sm text-[#007BFF]">৳150</span>
                  </button>
                </div>
              </div>

              {/* District Dropdown Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  জেলা নির্বাচন করুন (District / City)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50/50 appearance-none"
                  >
                    {BD_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  পূর্ণ ডেলিভারি ঠিকানা (House, Road, Area, Thana) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    required
                    rows={2}
                    placeholder="যেমন: বাড়ি # ১২, রোড # ৪, ব্লক # বি, মিরপুর-১০, ঢাকা"
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Delivery Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ডেলিভারি নোট বা বিশেষ নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ডেলিভারির পূর্বে ফোন করবেন / সিকিউরিটি গার্ডের কাছে রাখবেন"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50/50"
                />
              </div>
            </div>

            {/* STEP 2: WALLET BALANCE APPLIER & DISCOUNT LOGIC */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                    ২
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0A1B3D]">
                      ডিজিটাল ওয়ালেট ব্যালেন্স
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      আপনার অ্যাকাউন্টে থাকা ওয়ালেট বোনাস ও রিওয়ার্ড সরাসরি ব্যবহার করুন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>উপলব্ধ: ৳{availableWallet.toLocaleString()}</span>
                </div>
              </div>

              {availableWallet > 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="use-wallet-toggle"
                      checked={useWalletBalance}
                      onChange={(e) => setUseWalletBalance(e.target.checked)}
                      className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-indigo-300 cursor-pointer"
                    />
                    <label htmlFor="use-wallet-toggle" className="cursor-pointer">
                      <p className="text-xs font-black text-indigo-950">
                        Use Wallet Balance (Available: ৳{availableWallet.toLocaleString()})
                      </p>
                      <p className="text-[11px] text-indigo-700">
                        {useWalletBalance
                          ? `✓ এই অর্ডারে ৳${walletDiscount} তাৎক্ষণিক ছাড় কার্যকর হয়েছে`
                          : 'চেকআউটে ওয়ালেট ব্যালেন্স ছাড় কার্যকর করতে টিক দিন'}
                      </p>
                    </label>
                  </div>

                  {useWalletBalance && (
                    <span className="font-mono font-black text-sm text-indigo-700 bg-white px-3 py-1 rounded-xl border border-indigo-200 shrink-0">
                      -৳{walletDiscount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>আপনার বর্তমান ওয়ালেট ব্যালেন্স ৳০। YouTube বোনাস ক্লেইম করে ৳২০ পান।</span>
                  </div>
                  {onOpenAuth && !user.isLoggedIn && (
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="text-[#007BFF] font-bold hover:underline shrink-0"
                    >
                      লগইন করুন
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STEP 3: PAYMENT METHODS */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center border border-emerald-100">
                    ৩
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0A1B3D]">
                      পেমেন্ট মেথড নির্বাচন করুন
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      ক্যাশ অন ডেলিভারি অথবা বিকাশ ও নগদে ডিজিটাল পেমেন্ট
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Option Cards */}
              <div className="space-y-3">
                {/* 1. Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-emerald-600">
                        {paymentMethod === 'cod' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs sm:text-sm">
                          Cash on Delivery (ক্যাশ অন ডেলিভারি)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          পণ্য হাতে পেয়ে রাইডারের কাছে নগদ টাকায় মূল্য পরিশোধ করুন
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      জনপ্রিয় ও নিরাপদ
                    </span>
                  </div>
                </div>

                {/* 2. bKash */}
                <div
                  onClick={() => setPaymentMethod('bkash')}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    paymentMethod === 'bkash'
                      ? 'border-[#E2136E] bg-pink-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#E2136E]">
                        {paymentMethod === 'bkash' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                          <span>bKash (বিকাশ ডিজিটাল পেমেন্ট)</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-pink-100 text-[#E2136E]">
                            Send Money
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          বিকাশ অ্যাপ বা *247# দিয়ে সেন্ড মানি করুন
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* bKash Instructions & TrxID Input */}
                  {paymentMethod === 'bkash' && (
                    <div className="mt-4 pt-4 border-t border-pink-100 space-y-3 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-white border border-pink-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            অফিশিয়াল বিকাশ নম্বর:
                          </span>
                          <span className="font-mono font-black text-sm text-[#E2136E]">
                            {merchantPhone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNumber(merchantPhone);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-[#E2136E] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedNumber === merchantPhone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>কপি</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          বিকাশ ট্রানজেকশন আইডি (Transaction ID / TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: BL9X8K2..."
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#E2136E] bg-white uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Nagad */}
                <div
                  onClick={() => setPaymentMethod('nagad')}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    paymentMethod === 'nagad'
                      ? 'border-[#F7941D] bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#F7941D]">
                        {paymentMethod === 'nagad' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                          <span>Nagad (নগদ ডিজিটাল পেমেন্ট)</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-[#F7941D]">
                            Send Money
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          নগদ অ্যাপ বা *167# দিয়ে সেন্ড মানি করুন
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nagad Instructions & TrxID Input */}
                  {paymentMethod === 'nagad' && (
                    <div className="mt-4 pt-4 border-t border-amber-100 space-y-3 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            অফিশিয়াল নগদ নম্বর:
                          </span>
                          <span className="font-mono font-black text-sm text-[#F7941D]">
                            {merchantPhone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNumber(merchantPhone);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#F7941D] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedNumber === merchantPhone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>কপি</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                          নগদ ট্রানজেকশন আইডি (Transaction ID / TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: 7B6YQ..."
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#F7941D] bg-white uppercase"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: STICKY ORDER SUMMARY & PLACE ORDER CTA */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-[#0A1B3D]">
                  অর্ডার সামারি (Order Summary)
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  {items.length}টি পণ্য
                </span>
              </div>

              {/* Items List in Cart */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 scrollbar-none">
                {items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        width={44}
                        height={44}
                        loading="lazy"
                        decoding="async"
                        className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0A1B3D] truncate">
                          {item.product.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} × ৳{item.product.price.toLocaleString()}
                          {item.selectedSize && ` (${item.selectedSize})`}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#0A1B3D] shrink-0">
                      ৳{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-slate-100">
                {isCouponApplied && appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-emerald-800">
                        কুপন <code className="font-mono">{couponCode}</code> যুক্ত হয়েছে
                      </span>
                    </div>
                    {onRemoveCoupon && (
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="কুপন কোড (যেমন: VAULT10)"
                        value={inputCouponCode}
                        onChange={(e) => setInputCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:border-[#007BFF] bg-slate-50/50"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCouponCode}
                        disabled={!inputCouponCode.trim()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        প্রয়োগ
                      </button>
                    </div>

                    {couponFeedback && (
                      <p
                        className={`text-[11px] font-bold ${
                          couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {couponFeedback.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>সাবটোটাল (Subtotal):</span>
                  <span className="font-mono font-bold text-slate-800">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="text-[10px] text-slate-400">
                      ({cityDivision === 'Inside Dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'})
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    ৳{deliveryFee.toLocaleString()}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>কুপন ছাড় (Coupon Discount):</span>
                    <span className="font-mono">-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                {walletDiscount > 0 && (
                  <div className="flex justify-between text-indigo-600 font-bold">
                    <span>ওয়ালেট ব্যালেন্স ছাড়:</span>
                    <span className="font-mono">-৳{walletDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-black text-[#0A1B3D] block">
                      সর্বমোট পরিশোধযোগ্য:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ভ্যাট অন্তর্ভুক্ত (All Taxes Included)
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#007BFF]">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#007BFF] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm transition-all duration-150 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>অর্ডার প্রক্রিয়াধীন...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>অর্ডার নিশ্চিত করুন • ৳{grandTotal.toLocaleString()}</span>
                  </>
                )}
              </button>

              {/* Trust & Guarantee Badges */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>১০০% অরিজিনাল ব্র্যান্ডেড পণ্য গ্যারান্টি</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>৭ দিনের সহজ রিটার্ন পলিসি সুবিধা</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ফার্স্ট ডেলিভারি পার্টনার: Steadfast ও Pathao Courier</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
