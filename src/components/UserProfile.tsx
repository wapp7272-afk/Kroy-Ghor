import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Wallet, 
  Package, 
  Heart, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Phone, 
  Mail, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Truck, 
  ArrowRight, 
  ChevronRight, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  Search, 
  Tag, 
  Coins, 
  History, 
  AlertCircle,
  Building2,
  Gift,
  Star,
  Navigation,
  Youtube,
  RefreshCw,
  Lock,
  ArrowLeft,
  X,
  CreditCard,
  FileText,
  Camera,
  CheckCircle
} from 'lucide-react';
import { 
  UserProfile as UserProfileType, 
  Order, 
  Product, 
  Address, 
  WalletTransaction, 
  ReturnRequest, 
  YouTubeBonusClaim 
} from '../types';
import { InvoiceModal } from './InvoiceModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { BrandLogo } from './BrandLogo';
import { submitYouTubeBonusClaim, getUserYouTubeBonusClaim } from '../services/youtubeBonusService';
import { subscribeToUserOrdersFromFirestore } from '../services/orderFirestoreService';
import { db } from '../lib/firebaseAuth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export interface UserProfileProps {
  user: UserProfileType;
  orders: Order[];
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onSelectProduct: (product: Product) => void;
  onReorder: (order: Order) => void;
  onUpdateAddress: (address: Address) => void;
  onUpdateSavedAddresses?: (addresses: Address[]) => void;
  onLogout: () => void;
  onBackToShop: () => void;
  onOpenAuth: () => void;
  initialTab?: 'overview' | 'profile' | 'orders' | 'cart' | 'wallet' | 'wishlist' | 'addresses' | 'security';
  onSubmitReturnRequest?: (orderId: string, returnData: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>) => void;
  onOpenReturnPolicy?: () => void;
  onTrackOrder?: (orderId: string) => void;
  onOpenAdmin?: () => void;
  onOpenYouTubeBonusModal?: () => void;
  cartItems?: { product: Product; quantity: number; selectedSize?: string }[];
  onOpenCart?: () => void;
  onProceedToCheckout?: () => void;
}

type AccountTab = 'profile' | 'orders' | 'cart' | 'wallet' | 'addresses' | 'wishlist' | 'security';

const AVATAR_PRESETS = [
  { id: '1', name: 'Luxury Fragrance VIP', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Executive Noir', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Velvet Style', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Modern Minimalist', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Aroma Connoisseur', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Signature Member', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  orders,
  products,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onReorder,
  onUpdateAddress,
  onUpdateSavedAddresses,
  onLogout,
  onBackToShop,
  onOpenAuth,
  initialTab = 'profile',
  onSubmitReturnRequest,
  onOpenReturnPolicy,
  onTrackOrder,
  onOpenAdmin,
  onOpenYouTubeBonusModal,
  cartItems = [],
  onOpenCart,
  onProceedToCheckout,
}) => {
  // Normalize initialTab
  const normalizedInitialTab = useMemo<AccountTab>(() => {
    if (initialTab === 'overview' || initialTab === 'profile') return 'profile';
    if (initialTab === 'orders') return 'orders';
    if (initialTab === 'cart') return 'cart';
    if (initialTab === 'wallet') return 'wallet';
    if (initialTab === 'addresses') return 'addresses';
    if (initialTab === 'wishlist') return 'wishlist';
    if (initialTab === 'security') return 'security';
    return 'profile';
  }, [initialTab]);

  const [activeTab, setActiveTab] = useState<AccountTab>(normalizedInitialTab);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const cartTotalQty = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const cartSubtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cartItems]);

  // Sync tab with initialTab prop when updated
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'overview') setActiveTab('profile');
      else if (initialTab === 'cart') setActiveTab('cart');
      else setActiveTab(initialTab as AccountTab);
    }
  }, [initialTab]);

  // Order Details Modal state
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user.name || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setProfileName(user.name || '');
    setProfileEmail(user.email || '');
    setProfilePhone(user.phone || '');
    setProfileAvatar(user.avatar || '');
  }, [user]);

  // Real-time Firestore Lifetime Orders
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>(orders);

  useEffect(() => {
    setRealtimeOrders(orders);
  }, [orders]);

  useEffect(() => {
    if (user.isLoggedIn) {
      const unsub = subscribeToUserOrdersFromFirestore(
        (user as any).uid || user.email,
        user.email,
        (liveOrders) => {
          if (liveOrders && liveOrders.length > 0) {
            setRealtimeOrders(liveOrders);
          }
        }
      );
      return () => unsub();
    }
  }, [user.isLoggedIn, user.email]);

  const displayOrders = realtimeOrders.length > 0 ? realtimeOrders : orders;

  // Orders filtering & search
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return displayOrders.filter((order) => {
      if (orderFilter === 'active' && (order.status === 'Delivered' || order.status === 'Cancelled')) {
        return false;
      }
      if (orderFilter === 'delivered' && order.status !== 'Delivered') {
        return false;
      }
      if (orderFilter === 'cancelled' && order.status !== 'Cancelled') {
        return false;
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchId = order.id.toLowerCase().includes(q);
        const matchName = order.address?.fullName?.toLowerCase().includes(q);
        const matchPhone = order.address?.phone?.includes(q);
        const matchItem = order.items.some((item) =>
          item.product?.title?.toLowerCase().includes(q) ||
          (item.product?.category && item.product.category.toLowerCase().includes(q))
        );
        return matchId || matchName || matchPhone || matchItem;
      }
      return true;
    });
  }, [displayOrders, orderFilter, orderSearchQuery]);

  // Address Management state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: user.name || '',
    phone: user.phone || '',
    cityDivision: 'Inside Dhaka',
    fullAddress: '',
    label: 'Home',
    isDefault: false,
    district: 'Dhaka',
  });
  const [addressSuccessMsg, setAddressSuccessMsg] = useState<string | null>(null);

  // Saved Addresses List (merge primary address and savedAddresses)
  const savedAddressesList: Address[] = useMemo(() => {
    const list: Address[] = [];
    if (user.address?.fullName && user.address?.fullAddress) {
      list.push({ ...user.address, label: user.address.label || 'Primary Home', isDefault: true });
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

  // YouTube Bonus Claim state
  const [ytHandleInput, setYtHandleInput] = useState(user.youtubeHandle || '');
  const [isSubmittingYt, setIsSubmittingYt] = useState(false);
  const [ytClaimStatus, setYtClaimStatus] = useState<YouTubeBonusClaim | null>(null);
  const [ytFeedbackMsg, setYtFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'wallet' && (user.email || user.name)) {
      getUserYouTubeBonusClaim(user.email || user.name).then((claim) => {
        if (claim) setYtClaimStatus(claim);
      });
    }
  }, [activeTab, user.email, user.name]);

  const handleSubmitYtClaim = async () => {
    if (!ytHandleInput.trim()) {
      setYtFeedbackMsg('⚠️ অনুগ্রহ করে আপনার YouTube চ্যানেল বা হ্যান্ডেল নাম (@handle) লিখুন।');
      return;
    }
    setYtFeedbackMsg(null);
    setIsSubmittingYt(true);

    try {
      const claim = await submitYouTubeBonusClaim(
        (user as any).uid || user.email || user.name || 'guest',
        user.name || 'Member',
        user.email || '',
        ytHandleInput.trim()
      );
      setYtClaimStatus(claim);
      setYtFeedbackMsg('✓ আপনার YouTube বোনাস রিকোয়েস্ট জমা হয়েছে! অ্যাডমিন যাচাই করার পর ওয়ালেটে ৳২০ যুক্ত হবে।');
    } catch (err: any) {
      setYtFeedbackMsg(`❌ ${err.message || 'রিকোয়েস্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'}`);
    } finally {
      setIsSubmittingYt(false);
    }
  };

  // Helper for copying text
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // User Wishlist Products
  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlist.includes(p.id));
  }, [products, wishlist]);

  // Summary Metrics
  const totalOrdersCount = displayOrders.length;
  const totalSpent = displayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredOrdersCount = displayOrders.filter((o) => o.status === 'Delivered').length;

  // Order status progress helper
  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return { step: 1, percent: 20, label: 'Order Received', bangla: 'অর্ডার গ্রহণ করা হয়েছে' };
      case 'Confirmed':
        return { step: 2, percent: 40, label: 'Order Confirmed', bangla: 'অর্ডার নিশ্চিত করা হয়েছে' };
      case 'Processing':
        return { step: 3, percent: 65, label: 'Processing & Packed', bangla: 'ভল্টে প্যাকিং সম্পন্ন হয়েছে' };
      case 'Shipped':
        return { step: 4, percent: 85, label: 'In Transit / With Courier', bangla: 'কুরিয়ারে ডেলিভারির পথে' };
      case 'Delivered':
        return { step: 5, percent: 100, label: 'Delivered Successfully', bangla: 'সফলভাবে ডেলিভারি সম্পন্ন' };
      case 'Cancelled':
        return { step: 0, percent: 0, label: 'Order Cancelled', bangla: 'অর্ডার বাতিল হয়েছে' };
      default:
        return { step: 1, percent: 20, label: 'Order Confirmed', bangla: 'অর্ডার প্লেস করা হয়েছে' };
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    const updatedData = {
      name: profileName.trim() || user.name,
      avatar: profileAvatar.trim() || user.avatar,
      phone: profilePhone.trim() || user.phone,
    };

    try {
      // Update Firestore `users/{uid}` if available
      const targetUid = (user as any).uid || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : null);
      if (db && targetUid) {
        const userRef = doc(db, 'users', targetUid);
        await updateDoc(userRef, {
          displayName: updatedData.name,
          photoURL: updatedData.avatar,
          phone: updatedData.phone,
        }).catch(async () => {
          await setDoc(userRef, {
            displayName: updatedData.name,
            photoURL: updatedData.avatar,
            phone: updatedData.phone,
          }, { merge: true });
        });
      }

      // Update primary address fullName if matches
      onUpdateAddress({
        ...user.address,
        fullName: updatedData.name,
        phone: updatedData.phone || user.address.phone,
      });

      setProfileSuccessMsg('✓ প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileSuccessMsg('✓ লোকাল প্রোফাইল সংরক্ষিত হয়েছে!');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save new or edited address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.fullAddress.trim()) {
      return;
    }

    const currentSaved = user.savedAddresses ? [...user.savedAddresses] : [];
    let updatedList: Address[] = [];

    if (editingAddressIndex !== null) {
      updatedList = [...currentSaved];
      updatedList[editingAddressIndex] = addressForm;
    } else {
      updatedList = [addressForm, ...currentSaved];
    }

    if (addressForm.isDefault) {
      onUpdateAddress(addressForm);
    }

    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(updatedList);
    }

    setShowAddressModal(false);
    setEditingAddressIndex(null);
    setAddressSuccessMsg('✓ ডেলিভারি ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে!');
    setTimeout(() => setAddressSuccessMsg(null), 3000);
  };

  // Delete address
  const handleDeleteAddress = (index: number) => {
    if (!user.savedAddresses) return;
    const updated = user.savedAddresses.filter((_, i) => i !== index);
    if (onUpdateSavedAddresses) {
      onUpdateSavedAddresses(updated);
    }
  };

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#007BFF] mx-auto shadow-xs">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#0A1B3D]">সাইন ইন প্রয়োজন</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            আপনার অ্যাকাউন্ট প্রোফাইল, অর্ডার হিস্ট্রি, ওয়ালেট ব্যালেন্স এবং সেভ করা অ্যাড্রেস দেখতে অনুগ্রহ করে সাইন ইন করুন।
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex-1 py-3 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>লগইন / রেজিস্টার</span>
            </button>
            <button
              type="button"
              onClick={onBackToShop}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              শপে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================================= */}
        {/* BREADCRUMB & STORE TITLE */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToShop}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#007BFF] hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              title="Back to Store"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Kroyghor Customer Portal</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-[#007BFF] uppercase tracking-wider">My Account</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0A1B3D] tracking-tight">
                স্বাগতম, {user.name || 'সম্মানিত মেম্বার'}!
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Wallet Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ওয়ালেট: ৳{user.walletBalance.toLocaleString()}</span>
            </button>

            {/* Super Admin Quick Switch if authorized */}
            {onOpenAdmin && (user.role === 'admin' || user.role === 'super_admin' || user.email?.toLowerCase() === 'wapp7272@gmail.com') && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN RESPONSIVE LAYOUT (SIDEBAR + CONTENT) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT RESPONSIVE SIDEBAR ================= */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* User Identity Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#007BFF]/20 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#007BFF] to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'Z'}
                    </div>
                  )}
                  {user.role === 'super_admin' && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-xs">
                      👑
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-extrabold text-[#0A1B3D] text-sm truncate max-w-[150px]">
                      {user.name || 'Member'}
                    </p>
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email || 'No email'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>ভেরিফাইড</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span>আনভেরিফাইড</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini Stats Banner */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">মোট অর্ডার</p>
                  <p className="text-base font-black text-[#0A1B3D]">{totalOrdersCount}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">মোট খরচ</p>
                  <p className="text-base font-black text-emerald-600 font-mono">৳{totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs (Desktop Side Menu) */}
            <div className="p-2 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1 hidden lg:block">
              {[
                { id: 'profile' as AccountTab, label: 'আমার প্রোফাইল (Profile)', icon: User },
                { id: 'orders' as AccountTab, label: 'আমার অর্ডার হিস্ট্রি (My Orders)', icon: Package, badge: totalOrdersCount },
                { id: 'cart' as AccountTab, label: 'শপিং কার্ট সামারি (Cart Summary)', icon: ShoppingBag, badge: cartTotalQty },
                { id: 'wallet' as AccountTab, label: 'আমার ওয়ালেট ও বোনাস (My Wallet)', icon: Wallet, badge: `৳${user.walletBalance}` },
                { id: 'addresses' as AccountTab, label: 'ডেলিভারি ঠিকানা (Addresses)', icon: MapPin, badge: savedAddressesList.length },
                { id: 'wishlist' as AccountTab, label: 'উইশলিস্ট (Wishlist)', icon: Heart, badge: wishlist.length },
                { id: 'security' as AccountTab, label: 'সিকিউরিটি ও লগআউট (Security)', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#007BFF] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#0A1B3D] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ================= MAIN CONTENT TABS ================= */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Mobile Tab Pills Bar */}
            <div className="lg:hidden p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'profile' as AccountTab, label: 'Profile', icon: User },
                { id: 'orders' as AccountTab, label: 'Orders', icon: Package, count: totalOrdersCount },
                { id: 'cart' as AccountTab, label: 'Cart', icon: ShoppingBag, count: cartTotalQty },
                { id: 'wallet' as AccountTab, label: 'Wallet', icon: Wallet, count: `৳${user.walletBalance}` },
                { id: 'addresses' as AccountTab, label: 'Addresses', icon: MapPin },
                { id: 'wishlist' as AccountTab, label: 'Wishlist', icon: Heart, count: wishlist.length },
                { id: 'security' as AccountTab, label: 'Security', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#007BFF] text-white shadow-xs'
                        : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: PROFILE TAB */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-black text-[#0A1B3D] flex items-center gap-2">
                      <User className="w-5 h-5 text-[#007BFF]" />
                      <span>কাস্টমার প্রোফাইল ইনফরমেশন</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      আপনার ব্যক্তিগত তথ্য, প্রোফাইল ছবি এবং যোগাযোগের বিবরণ আপডেট করুন।
                    </p>
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Avatar Preset Chooser */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        প্রোফাইল অ্যাভাটার বেছে নিন বা কাস্টম URL দিন:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setProfileAvatar(preset.url)}
                            className={`p-1 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                              profileAvatar === preset.url
                                ? 'border-[#007BFF] ring-2 ring-[#007BFF]/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              width={48}
                              height={48}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-12 rounded-xl object-cover"
                            />
                            {profileAvatar === preset.url && (
                              <div className="absolute inset-0 bg-[#007BFF]/30 flex items-center justify-center text-white">
                                <Check className="w-4 h-4 drop-shadow-md" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          placeholder="Custom Avatar Image URL (https://...)"
                          value={profileAvatar}
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          আপনার পূর্ণ নাম *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          মোবাইল নম্বর
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="017xxxxxxxx"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50 font-mono"
                          />
                        </div>
                      </div>

                      {/* Email (Readonly info) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          রেজিস্টার্ড ইমেইল অ্যাড্রেস
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            disabled
                            value={profileEmail}
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          ইমেইল অ্যাকাউন্ট পরিবর্তন করতে কাস্টমার সাপোর্টে যোগাযোগ করুন।
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="py-2.5 px-6 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>প্রোফাইল পরিবর্তন সংরক্ষণ করুন</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: MY ORDERS TAB */}
            {/* ========================================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Orders Toolbar */}
                <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {[
                      { key: 'all', label: `সকল (${displayOrders.length})` },
                      { key: 'active', label: 'চলমান অর্ডার' },
                      { key: 'delivered', label: 'ডেলিভার্ড' },
                      { key: 'cancelled', label: 'বাতিলকৃত' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setOrderFilter(f.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                          orderFilter === f.key
                            ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Search orders */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="অর্ডার আইডি বা প্রডাক্ট খুঁজুন..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                    />
                  </div>
                </div>

                {/* Orders Listing */}
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-black text-[#0A1B3D]">কোন অর্ডার পাওয়া যায়নি</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {orderSearchQuery ? 'সার্চ ফিল্টারের সাথে কোন অর্ডার মিলেনি।' : 'আপনি এখনও কোন পার্সেল অর্ডার করেননি।'}
                    </p>
                    <button
                      type="button"
                      onClick={onBackToShop}
                      className="mt-2 py-2 px-5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>শপিং শুরু করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredOrders.map((order) => {
                      const progress = getStepProgress(order.status);
                      const statusBadgeColors: Record<string, string> = {
                        Pending: 'bg-amber-50 text-amber-700 border-amber-200',
                        Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
                        Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
                        Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
                      };

                      return (
                        <div
                          key={order.id}
                          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
                        >
                          {/* Top Row: ID, Date, Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-[#0A1B3D] text-sm">
                                  #{order.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(order.id, `Order-${order.id}`)}
                                  className="text-[10px] text-slate-400 hover:text-[#007BFF] p-1 cursor-pointer"
                                  title="Copy Order ID"
                                >
                                  {copiedText === `Order-${order.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusBadgeColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">অর্ডারের তারিখ: {order.date}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Open Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedDetailOrder(order)}
                                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#007BFF] text-slate-700 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>বিস্তারিত বিবরণ</span>
                              </button>

                              {/* Invoice Trigger */}
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-[#007BFF] transition-all cursor-pointer"
                                title="Print Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Items Grid */}
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={item.product?.image || '/kroyghor-logo.png'}
                                    alt={item.product?.title || 'Product'}
                                    width={40}
                                    height={40}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                                  />
                                  <div className="truncate">
                                    <p className="font-bold text-[#0A1B3D] truncate">{item.product?.title}</p>
                                    <p className="text-[11px] text-slate-500">
                                      পরিমাণ: {item.quantity} × ৳{item.product?.price?.toLocaleString()}
                                      {item.selectedSize ? ` • সাইজ: ${item.selectedSize}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-[#0A1B3D] shrink-0">
                                  ৳{((item.product?.price || 0) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Row: Price & Actions */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs font-mono text-slate-500">
                              <span>মোট পরিশোধিত: </span>
                              <strong className="text-[#0A1B3D] font-black text-sm">৳{order.total?.toLocaleString()}</strong>
                              <span className="text-[11px] text-slate-400 ml-2">({order.paymentMethod?.toUpperCase()})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Track parcel */}
                              {onTrackOrder && (
                                <button
                                  type="button"
                                  onClick={() => onTrackOrder(order.id)}
                                  className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>ট্র্যাক পার্সেল</span>
                                </button>
                              )}

                              {/* Reorder button */}
                              <button
                                type="button"
                                onClick={() => onReorder(order)}
                                className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                <span>পুনরায় অর্ডার</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: CART SUMMARY TAB */}
            {/* ========================================================================= */}
            {activeTab === 'cart' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-[#0A1B3D] flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#007BFF]" />
                        <span>শপিং কার্ট সামারি (Current Cart)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        আপনার ব্যাগে সংরক্ষিত পণ্যের বিবরণ, মোট মূল্য ও দ্রুত চেকআউট করুন।
                      </p>
                    </div>

                    {cartItems.length > 0 && onOpenCart && (
                      <button
                        type="button"
                        onClick={onOpenCart}
                        className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>সম্পূর্ণ কার্ট ভিউ দেখুন</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-200 shadow-2xs">
                        <ShoppingBag className="w-8 h-8 stroke-[1.6]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-base">আপনার কার্ট বর্তমানে খালি আছে</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          আমাদের নতুন কালেকশন থেকে আপনার পছন্দের পণ্য কার্টে যুক্ত করুন।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onBackToShop}
                        className="py-2.5 px-6 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        শপিং শুরু করুন
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Cart Items List */}
                      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4 space-y-3">
                        {cartItems.map((item, idx) => (
                          <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {item.product.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.quantity} x ৳{item.product.price.toLocaleString()}
                                  {item.selectedSize && <span className="ml-1.5 font-semibold text-indigo-600">({item.selectedSize})</span>}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono font-black text-slate-900 text-sm">
                              ৳{(item.product.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Breakdown */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>সাবটোটাল ({cartTotalQty} টি পণ্য):</span>
                          <span className="font-mono font-bold text-slate-800">৳{cartSubtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>ডেলিভারি চার্জ:</span>
                          <span className="font-mono font-bold text-slate-800">৳৬০ (ঢাকা) / ৳১২০ (ঢাকার বাইরে)</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
                          <span>সর্বমোট আনুমানিক বিল:</span>
                          <span className="text-base font-black text-[#007BFF] font-mono">
                            ৳{(cartSubtotal + 60).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {onProceedToCheckout && (
                          <button
                            type="button"
                            onClick={onProceedToCheckout}
                            className="flex-1 py-3 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                          >
                            <span>চেকআউট সম্পন্ন করুন</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {onOpenCart && (
                          <button
                            type="button"
                            onClick={onOpenCart}
                            className="py-3 px-5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            কার্ট আপডেট ও কুপন অ্যাপ্লাই
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: MY WALLET TAB */}
            {/* ========================================================================= */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Large Balance Card (Clean Light Theme) */}
                <div className="p-6 rounded-3xl bg-gradient-to-tr from-blue-50/90 via-indigo-50/40 to-white text-slate-900 border border-blue-200/80 shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[#007BFF] text-xs font-bold uppercase tracking-wider">
                        <Wallet className="w-4 h-4" />
                        <span>Kroyghor ডিজিটাল ওয়ালেট ব্যালেন্স</span>
                      </div>
                      <p className="text-3xl sm:text-4xl font-black text-[#0A1B3D] font-mono tracking-tight">
                        ৳{user.walletBalance.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600">
                        যেকোনো অর্ডারে চেকআউটে তাৎক্ষণিক ডিসকাউন্ট হিসেবে ব্যবহারযোগ্য।
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-emerald-200 text-xs text-emerald-800 shadow-2xs">
                        <span className="font-black text-emerald-600">✓ ১০০% ইনস্ট্যান্ট রিডিমযোগ্য</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim ৳20 YouTube Bonus Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                        <Youtube className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-black text-[#0A1B3D]">
                            YouTube সাবস্ক্রিপশন বোনাস (৳২০)
                          </h4>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                            বোনাস রিওয়ার্ড
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          আমাদের অফিশিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করে আপনার ওয়ালেটে ৳২০ বোনাস গ্রহণ করুন।
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://www.youtube.com/@kroy-ghor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs shrink-0"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>ভিজিট চ্যানেল</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Submission Status & Handle Form */}
                  {user.hasClaimedYouTubeBonus || ytClaimStatus?.status === 'approved' ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-black text-sm">৳২০ ইউটিউব বোনাস সফলভাবে ওয়ালেটে যুক্ত হয়েছে!</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          আপনার অ্যাকাউন্টে YouTube সাবস্ক্রাইবার বোনাস অ্যাক্টিভ রয়েছে।
                        </p>
                      </div>
                    </div>
                  ) : ytClaimStatus?.status === 'pending' ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-black">যাচাইকরণ প্রক্রিয়াধীন (Pending Verification)</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          হ্যান্ডেল <code className="font-mono font-bold bg-amber-100 px-1 py-0.2 rounded">{ytClaimStatus.youtubeHandle}</code> জমা হয়েছে। অ্যাডমিন ভেরিফিকেশন সম্পন্ন হলে ৳২০ যোগ হবে।
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Prominent Instant Automatic Check Button */}
                      {onOpenYouTubeBonusModal && (
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                              <span>তাত্ক্ষণিক অটো ভেরিফিকেশন (Instant Automated Check)</span>
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              Google অ্যাকাউন্ট কানেক্ট করে ১-সেকেন্ডে আপনার সাবস্ক্রিপশন নিশ্চিত করুন এবং ওয়ালেটে ৳২০ যোগ করুন।
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={onOpenYouTubeBonusModal}
                            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Youtube className="w-4 h-4 fill-white" />
                            <span>১-ক্লিক অটো ভেরিফাই</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Manual Review Handle Fallback */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="text-[11px] font-semibold text-slate-500">
                          অথবা নিচে আপনার YouTube হ্যান্ডেল নাম লিখে ম্যানুয়াল ভেরিফিকেশনের জন্য পাঠান:
                        </p>

                        {ytFeedbackMsg && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                            {ytFeedbackMsg}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <Youtube className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="আপনার YouTube হ্যান্ডেল বা নাম লিখুন (যেমন: @yourhandle)"
                              value={ytHandleInput}
                              onChange={(e) => setYtHandleInput(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleSubmitYtClaim}
                            disabled={isSubmittingYt || !ytHandleInput.trim()}
                            className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                          >
                            {isSubmittingYt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                            <span>ম্যানুয়াল ভেরিফাই রিকোয়েস্ট</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>১. চ্যানেল সাবস্ক্রাইব করুন</span>
                          <span>•</span>
                          <span>২. আপনার হ্যান্ডেল লিখে সাবমিট করুন</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet Transactions Ledger */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-black text-[#0A1B3D] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#007BFF]" />
                    <span>ওয়ালেট ট্রানজেকশন হিস্ট্রি</span>
                  </h4>

                  {user.walletHistory && user.walletHistory.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {user.walletHistory.map((tx) => (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <Coins className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0A1B3D]">{tx.description}</p>
                              <p className="text-[10px] text-slate-400">{tx.date}</p>
                            </div>
                          </div>
                          <span className={`font-mono font-black text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'credit' ? '+' : '-'}৳{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      এখনও কোন ওয়ালেট ট্রানজেকশন রেকর্ড হয়নি।
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SAVED ADDRESSES TAB */}
            {/* ========================================================================= */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#0A1B3D] flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#007BFF]" />
                      <span>সংরক্ষিত ডেলিভারি ঠিকানা</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      দ্রুত চেকআউটের জন্য আপনার ডেলিভারি অ্যাড্রেসগুলো ম্যানেজ করুন।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressIndex(null);
                      setAddressForm({
                        fullName: user.name || '',
                        phone: user.phone || '',
                        cityDivision: 'Inside Dhaka',
                        fullAddress: '',
                        label: 'Home',
                        isDefault: false,
                        district: 'Dhaka',
                      });
                      setShowAddressModal(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন ঠিকানা</span>
                  </button>
                </div>

                {addressSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{addressSuccessMsg}</span>
                  </div>
                )}

                {/* Addresses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddressesList.map((addr, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0A1B3D] text-sm">{addr.fullName}</span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {addr.label || 'Saved'}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddressIndex(idx);
                              setAddressForm(addr);
                              setShowAddressModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-[#007BFF] transition-colors cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{addr.fullAddress}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{addr.cityDivision}</span>
                        <span>ফোন: {addr.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: WISHLIST TAB */}
            {/* ========================================================================= */}
            {activeTab === 'wishlist' && (
              <div className="space-y-4">
                <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
                  <h3 className="text-base font-black text-[#0A1B3D] flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span>সংরক্ষিত উইশলিস্ট ({wishlistProducts.length})</span>
                  </h3>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
                    <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-black text-[#0A1B3D]">উইশলিস্ট খালি</h3>
                    <p className="text-xs text-slate-500">
                      আপনার পছন্দের পণ্যগুলোতে হার্ট আইকন ক্লিক করে উইশলিস্টে যুক্ত করুন।
                    </p>
                    <button
                      type="button"
                      onClick={onBackToShop}
                      className="mt-2 py-2 px-5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>কালেকশন এক্সপ্লোর করুন</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {wishlistProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-[#0A1B3D] truncate">{prod.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{prod.category}</p>
                            <p className="text-sm font-black text-emerald-600 font-mono mt-1">৳{prod.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              onAddToCart(prod);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>কার্টে নিন</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleWishlist(prod.id)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: SECURITY & LOGOUT TAB */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-black text-[#0A1B3D] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#007BFF]" />
                      <span>অ্যাকাউন্ট সিকিউরিটি ও লগআউট</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      আপনার অ্যাকাউন্টের নিরাপত্তা ও লগইন সেশন নিয়ন্ত্রণ করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-500 text-[10px] uppercase">লগইন মেথড</p>
                      <p className="font-extrabold text-[#0A1B3D] text-sm">
                        {user.authProvider === 'google' ? 'Google OAuth 2.0' : 'Email & Password'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-500 text-[10px] uppercase">অ্যাকাউন্ট স্ট্যাটাস</p>
                      <p className="font-extrabold text-emerald-600 text-sm flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>অ্যাক্টিভ ও সুরক্ষিত</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#0A1B3D]">ডিভাইস থেকে সাইন আউট</p>
                      <p className="text-[11px] text-slate-400">আপনার সেশন নিরাপদে সমাপ্ত করতে নিচের বাটনে ক্লিক করুন।</p>
                    </div>

                    <button
                      type="button"
                      onClick={onLogout}
                      className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>নিরাপদে লগআউট করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED CUSTOMER ORDER VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedDetailOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#0A1B3D] text-white flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base">#{selectedDetailOrder.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                    {selectedDetailOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{selectedDetailOrder.date}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin">
              {/* Order Timeline Progress Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0A1B3D]">ডেলিভারি ট্র্যাকিং স্ট্যাটাস:</span>
                  <span className="font-bold text-[#007BFF]">{getStepProgress(selectedDetailOrder.status).label}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#007BFF] to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${getStepProgress(selectedDetailOrder.status).percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  স্ট্যাটাস নোট: {getStepProgress(selectedDetailOrder.status).bangla}
                </p>
              </div>

              {/* Ordered Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">অর্ডারকৃত পণ্যসমূহ</h4>
                <div className="space-y-2">
                  {selectedDetailOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product?.image || '/kroyghor-logo.png'}
                          alt={item.product?.title || 'Product'}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-extrabold text-[#0A1B3D] truncate">{item.product?.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            পরিমাণ: {item.quantity} × ৳{item.product?.price?.toLocaleString()}
                            {item.selectedSize ? ` • সাইজ: ${item.selectedSize}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-sm text-[#0A1B3D] shrink-0">
                        ৳{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                <h4 className="font-sans font-black text-slate-700 text-xs uppercase tracking-wider mb-2">পেমেন্ট ও হিসাব বিবরণী</h4>
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span>৳{selectedDetailOrder.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>৳{selectedDetailOrder.deliveryFee}</span>
                </div>
                {selectedDetailOrder.walletDeducted > 0 && (
                  <div className="flex justify-between text-cyan-600 font-bold">
                    <span>ওয়ালেট ডিসকাউন্ট:</span>
                    <span>-৳{selectedDetailOrder.walletDeducted}</span>
                  </div>
                )}
                {selectedDetailOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>কুপন ডিসকাউন্ট:</span>
                    <span>-৳{selectedDetailOrder.discount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-[#0A1B3D]">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-600">৳{selectedDetailOrder.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Shipping Address & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">ডেলিভারি ঠিকানা</p>
                  <p className="font-bold text-[#0A1B3D]">{selectedDetailOrder.address?.fullName}</p>
                  <p className="text-slate-600 leading-relaxed">{selectedDetailOrder.address?.fullAddress}</p>
                  <p className="text-slate-500 font-mono">{selectedDetailOrder.address?.cityDivision} • {selectedDetailOrder.address?.phone}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">পেমেন্ট মেথড ও স্ট্যাটাস</p>
                  <p className="font-bold text-[#0A1B3D] uppercase">{selectedDetailOrder.paymentMethod}</p>
                  <p className="text-emerald-600 font-bold">পেমেন্ট স্ট্যাটাস: {selectedDetailOrder.paymentStatus || 'Pending'}</p>
                  {selectedDetailOrder.trxId && (
                    <p className="text-slate-500 font-mono text-[10px]">TrxID: {selectedDetailOrder.trxId}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceOrder(selectedDetailOrder)}
                className="py-2 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট ইনভয়েস</span>
              </button>

              <div className="flex items-center gap-2">
                {onSubmitReturnRequest && selectedDetailOrder.status === 'Delivered' && !selectedDetailOrder.returnRequest && (
                  <button
                    type="button"
                    onClick={() => {
                      setReturnTargetOrder(selectedDetailOrder);
                      setSelectedDetailOrder(null);
                    }}
                    className="py-2 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>৭-দিনের রিটার্ন আবেদন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onReorder(selectedDetailOrder);
                    setSelectedDetailOrder(null);
                  }}
                  className="py-2 px-5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>পুনরায় অর্ডার করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADDRESS CREATE/EDIT MODAL */}
      {/* ========================================================================= */}
      {showAddressModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-[#0A1B3D] text-base">
                {editingAddressIndex !== null ? 'ডেলিভারি ঠিকানা এডিট করুন' : 'নতুন ডেলিভারি ঠিকানা যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                  placeholder="Receiver Name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50 font-mono"
                  placeholder="017xxxxxxxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">এরিয়া</label>
                  <select
                    value={addressForm.cityDivision}
                    onChange={(e) => setAddressForm({ ...addressForm, cityDivision: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="Inside Dhaka">Inside Dhaka</option>
                    <option value="Outside Dhaka">Outside Dhaka</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">লেবেল</label>
                  <input
                    type="text"
                    value={addressForm.label || 'Home'}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                    placeholder="Home / Office"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পূর্ণ ঠিকানা *</label>
                <textarea
                  required
                  rows={3}
                  value={addressForm.fullAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
                  placeholder="House, Road, Flat, Area, Thana, District"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-[#007BFF]"
                />
                <span>ডিফল্ট প্রাইমারি ঠিকানা হিসেবে নির্ধারণ করুন</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVOICE MODAL */}
      {/* ========================================================================= */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />
      )}

      {/* ========================================================================= */}
      {/* 7-DAY RETURN REQUEST MODAL */}
      {/* ========================================================================= */}
      {returnTargetOrder && (
        <ReturnRequestModal
          isOpen={Boolean(returnTargetOrder)}
          onClose={() => setReturnTargetOrder(null)}
          order={returnTargetOrder}
          onSubmit={(orderId, returnData) => {
            if (onSubmitReturnRequest) {
              onSubmitReturnRequest(orderId, returnData);
            }
            setReturnTargetOrder(null);
          }}
          onOpenReturnPolicy={onOpenReturnPolicy}
        />
      )}
    </div>
  );
};
