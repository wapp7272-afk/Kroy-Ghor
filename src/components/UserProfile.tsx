import React, { useState, useMemo } from 'react';
import { 
  User, 
  Wallet, 
  Package, 
  Heart, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
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
  Navigation
} from 'lucide-react';
import { UserProfile as UserProfileType, Order, Product, Address, WalletTransaction, ReturnRequest } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { ReturnRequestModal } from './ReturnRequestModal';

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
  initialTab?: 'overview' | 'orders' | 'wallet' | 'wishlist' | 'addresses';
  onSubmitReturnRequest?: (orderId: string, returnData: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>) => void;
  onOpenReturnPolicy?: () => void;
  onTrackOrder?: (orderId: string) => void;
}

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
  initialTab = 'overview',
  onSubmitReturnRequest,
  onOpenReturnPolicy,
  onTrackOrder,
}) => {
  // Navigation tabs in Customer Portal
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wallet' | 'wishlist' | 'addresses'>(initialTab);
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);

  // Sync tab with initialTab prop if it changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Orders filtering & search
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null);

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

  // Copy order ID helper
  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // User Wishlist Products
  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlist.includes(p.id));
  }, [products, wishlist]);

  // Saved Addresses List (merge primary address and savedAddresses)
  const savedAddressesList: Address[] = useMemo(() => {
    const list: Address[] = [];
    if (user.address?.fullName && user.address?.fullAddress) {
      list.push({ ...user.address, label: user.address.label || 'Primary', isDefault: true });
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

  // Order summary statistics
  const totalOrdersCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
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
        const matchName = order.address.fullName.toLowerCase().includes(q);
        const matchPhone = order.address.phone.includes(q);
        const matchItem = order.items.some((item) =>
          item.product.title.toLowerCase().includes(q) ||
          (item.product.category && item.product.category.toLowerCase().includes(q))
        );
        return matchId || matchName || matchPhone || matchItem;
      }
      return true;
    });
  }, [orders, orderFilter, orderSearchQuery]);

  // Helper for tracking steps based on status
  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return { step: 1, percent: 20, label: 'Order Received', bangla: 'অর্ডার গ্রহণ করা হয়েছে' };
      case 'Confirmed':
        return { step: 1, percent: 30, label: 'Order Confirmed', bangla: 'অর্ডার নিশ্চিত করা হয়েছে' };
      case 'Processing':
        return { step: 2, percent: 55, label: 'Processing & Quality Checked', bangla: 'ভল্টে প্যাকিং সম্পন্ন হয়েছে' };
      case 'Shipped':
        return { step: 3, percent: 85, label: 'In Transit / With Courier', bangla: 'কুরিয়ারে ডেলিভারির পথে' };
      case 'Delivered':
        return { step: 4, percent: 100, label: 'Delivered Successfully', bangla: 'সফলভাবে ডেলিভারি সম্পন্ন' };
      case 'Cancelled':
        return { step: 0, percent: 0, label: 'Order Cancelled', bangla: 'অর্ডার বাতিল হয়েছে' };
      default:
        return { step: 1, percent: 25, label: 'Order Confirmed', bangla: 'অর্ডার প্লেস করা হয়েছে' };
    }
  };

  // Courier details fallback
  const getCourierDetails = (order: Order) => {
    const courierName = order.courierName || (order.address.cityDivision === 'Inside Dhaka' ? 'Pathao Express' : 'Steadfast Courier');
    const orderDigits = order.id.replace(/\D/g, '') || '89241';
    const trackingNumber = order.trackingNumber || `PVZ-BD-${orderDigits}`;
    return { courierName, trackingNumber };
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

    // Also persist to localStorage registered accounts
    try {
      const accounts = (() => {
        const stored = localStorage.getItem('primevault_registered_accounts');
        return stored ? JSON.parse(stored) : [];
      })();
      const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
      const idx = accounts.findIndex((a: any) => 
        (cleanPhone && a.phone === cleanPhone) || 
        (user.email && a.email?.toLowerCase() === user.email?.toLowerCase())
      );
      if (idx >= 0) {
        accounts[idx].savedAddresses = updatedList;
        if (addressForm.isDefault) {
          accounts[idx].address = addressForm;
        }
        localStorage.setItem('primevault_registered_accounts', JSON.stringify(accounts));
      }
    } catch {}

    setShowAddressModal(false);
    setEditingAddressIndex(null);
    setAddressSuccessMsg('✓ Address saved successfully');
    setTimeout(() => setAddressSuccessMsg(null), 3000);
  };

  // If user is not logged in, show gentle portal login invitation
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] shadow-xl p-8 text-center space-y-5 animate-fadeIn">
          <div className="w-18 h-18 rounded-2xl bg-[#EDE9FE] text-[#5B21B6] flex items-center justify-center mx-auto border border-purple-200">
            <User className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#171717]">
              Customer Account & Portal
            </h2>
            <p className="text-xs text-[#525252] mt-1 leading-relaxed">
              অনুগ্রহ করে লগইন করুন আপনার লাইভ ওয়ালেট ব্যালেন্স (৳২০ বোনাস), বিস্তারিত অর্ডার হিস্ট্রি এবং সেভ করা ডেলিভারি ঠিকানা দেখতে।
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-[#5B21B6] font-semibold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5B21B6]" />
            <span>নতুন সাইনআপ ও ফোন ভেরিফিকেশনে ৳২০ ইনস্ট্যান্ট বোনাস!</span>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={onOpenAuth}
              className="w-full py-3.5 px-4 rounded-xl font-extrabold text-white bg-[#5B21B6] hover:bg-[#4C1D95] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <User className="w-4 h-4" />
              <span>লগইন বা সাইন আপ করুন (Access Portal)</span>
            </button>

            <button
              onClick={onBackToShop}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-500 hover:text-[#171717] transition-colors cursor-pointer"
            >
              কেনাকাটা চালিয়ে যান (Continue Shopping)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-4 sm:py-10 pb-28 md:pb-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 text-xs text-[#525252]">
            <button 
              onClick={onBackToShop}
              className="min-h-[36px] hover:text-[#5B21B6] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#5B21B6] font-bold">Customer Portal & Order History</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToShop}
              className="min-h-[40px] text-xs font-bold text-gray-600 hover:text-[#5B21B6] px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-purple-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#5B21B6]" />
              <span>Continue Shopping</span>
            </button>

            <button
              onClick={onLogout}
              className="min-h-[40px] text-xs font-bold text-rose-600 hover:text-rose-700 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ================= 1. CUSTOMER PROFILE HERO CARD ================= */}
        <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 sm:p-7 shadow-xs overflow-hidden relative">
          {/* Subtle Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-100/60 via-indigo-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* User Info with Avatar & Verified Badge */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#5B21B6] to-[#4C1D95] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md border-2 border-white">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'P'
                  )}
                </div>
                {user.isPhoneVerified && (
                  <div 
                    title="Phone Verified & Secured"
                    className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#171717]">{user.name}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                    user.role === 'admin'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : user.role === 'seller'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-[#EDE9FE] text-[#5B21B6] border-purple-200'
                  }`}>
                    {user.role === 'admin' ? '🛡️ Super Admin' : user.role === 'seller' ? '🏪 Verified Seller' : 'Prime Member'}
                  </span>
                  {user.session?.accessToken && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Bearer Session Active</span>
                    </span>
                  )}
                  {user.authProvider === 'google' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1 border border-gray-200">
                      Google OAuth
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#525252]">
                  {user.phone && (
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#5B21B6]" />
                      <span>{user.phone}</span>
                      {user.isPhoneVerified && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                          Verified
                        </span>
                      )}
                    </span>
                  )}
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#5B21B6]" />
                      <span>{user.email}</span>
                    </span>
                  )}
                  {user.address?.cityDivision && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#5B21B6]" />
                      <span>{user.address.cityDivision}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live Wallet Balance Hero Widget */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#171717] to-[#262626] text-white shadow-md flex items-center justify-between gap-4 md:min-w-[260px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-purple-300 font-bold uppercase tracking-wider">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span>Prime Vault Wallet</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                    ৳{user.walletBalance || 0}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">BDT</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  চেকআউটে সরাসরি ব্যবহারযোগ্য ব্যালেন্স
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#E5E7EB] text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Total Orders</span>
              <span className="text-lg font-black text-[#171717] font-mono">{totalOrdersCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Delivered</span>
              <span className="text-lg font-black text-emerald-600 font-mono">{deliveredOrdersCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Wishlist Items</span>
              <span className="text-lg font-black text-rose-600 font-mono">{wishlist.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Saved Addresses</span>
              <span className="text-lg font-black text-[#5B21B6] font-mono">{savedAddressesList.length}</span>
            </div>
          </div>
        </div>

        {/* ================= 2. PORTAL NAVIGATION TABS (Min 44px Thumb Touch Targets) ================= */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xs scrollbar-none touch-pan-x">
          <button
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#5B21B6] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#5B21B6] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History & Tracking</span>
            {totalOrdersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'orders' ? 'bg-white text-[#5B21B6]' : 'bg-gray-200 text-gray-700'
              }`}>
                {totalOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-[#5B21B6] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet & Bonus History</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'wallet' ? 'bg-white text-[#5B21B6]' : 'bg-purple-100 text-[#5B21B6]'
            }`}>
              ৳{user.walletBalance || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'bg-[#5B21B6] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Saved Wishlist</span>
            {wishlist.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'wishlist' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
              }`}>
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'bg-[#5B21B6] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {addressSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{addressSuccessMsg}</span>
          </div>
        )}

        {/* ================= 3. TAB CONTENT VIEWS ================= */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Orders Preview */}
            <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#5B21B6]" />
                  <h3 className="font-extrabold text-[#171717] text-sm sm:text-base">
                    Recent Orders & Live Shipment Track
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#5B21B6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({orders.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-gray-500">আপনার এখনও কোনো সক্রিয় অর্ডার নেই।</p>
                  <button
                    onClick={onBackToShop}
                    className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white text-xs font-bold hover:bg-[#4C1D95] transition-colors cursor-pointer"
                  >
                    শপিং শুরু করুন
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 space-y-3">
                  {orders.slice(0, 2).map((order) => {
                    const progress = getStepProgress(order.status);
                    const { courierName, trackingNumber } = getCourierDetails(order);

                    return (
                      <div key={order.id} className="pt-3 first:pt-0 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#171717]">{order.id}</span>
                            <span className="text-[11px] text-gray-500">• {order.date}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              order.status === 'Delivered' 
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-[#5B21B6]'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <span className="font-mono font-black text-sm text-[#5B21B6]">
                            ৳{order.total.toLocaleString()}
                          </span>
                        </div>

                        {/* Tracker Progress Bar */}
                        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-[#5B21B6] flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5" />
                              <span>{progress.bangla}</span>
                            </span>
                            <span className="text-gray-500 text-[11px] font-mono">
                              Courier: {courierName} ({trackingNumber})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#5B21B6] h-full rounded-full transition-all duration-500"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Two-column Widgets: Primary Address & Wallet Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Primary Address Widget */}
              <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#171717]">
                    <MapPin className="w-4 h-4 text-[#5B21B6]" />
                    <span>Primary Delivery Address</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="text-[11px] font-bold text-[#5B21B6] hover:underline cursor-pointer"
                  >
                    Manage Addresses
                  </button>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-[#171717]">{user.address?.fullName || user.name}</p>
                  <p className="font-mono">{user.address?.phone || user.phone}</p>
                  <p>{user.address?.fullAddress || 'No full address specified yet.'}</p>
                  <p className="text-[#5B21B6] font-semibold">
                    {user.address?.cityDivision || 'Inside Dhaka'}
                  </p>
                </div>
              </div>

              {/* Wallet Bonus Information Card */}
              <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#171717]">
                    <Gift className="w-4 h-4 text-[#5B21B6]" />
                    <span>Wallet Bonus Perks</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className="text-[11px] font-bold text-[#5B21B6] hover:underline cursor-pointer"
                  >
                    View History
                  </button>
                </div>

                <div className="text-xs space-y-2 text-gray-600">
                  <p className="leading-relaxed">
                    • আপনার ওয়ালেট ব্যালেন্সের মাধ্যমে প্রতিটি কেনাকাটায় সর্বোচ্চ <strong>৳২০ ইনস্ট্যান্ট ছাড়</strong> পেয়ে যান।
                  </p>
                  <p className="leading-relaxed">
                    • সাইনআপ বা রিফারেল ফ্রেন্ডদের সাথে যুক্ত হলে আরও রিওয়ার্ড পয়েন্ট অর্জন করা সম্ভব।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED ORDER HISTORY & TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Order Controls Bar (Search + Filter Chips) */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { key: 'all', label: 'All Orders' },
                  { key: 'active', label: 'Active & In Transit' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      orderFilter === f.key
                        ? 'bg-[#5B21B6] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Order Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Order ID, item..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                />
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5B21B6] flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-[#171717]">কোনো অর্ডার খুঁজে পাওয়া যায়নি</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  আপনার নির্বাচিত ফিল্টারে কোনো অর্ডার বিদ্যমান নেই।
                </p>
                <button
                  onClick={() => {
                    setOrderFilter('all');
                    setOrderSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const progress = getStepProgress(order.status);
                  const { courierName, trackingNumber } = getCourierDetails(order);

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden transition-all hover:border-purple-200"
                    >
                      {/* Order Header */}
                      <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-[#171717]">{order.id}</span>
                            <button
                              onClick={() => handleCopyOrderId(order.id)}
                              className="text-gray-400 hover:text-[#5B21B6] p-1 cursor-pointer"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 font-mono">{order.date}</span>
                          <span className="text-gray-300">•</span>

                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : order.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-purple-100 text-[#5B21B6] border border-purple-200'
                          }`}>
                            {order.status}
                          </span>

                          {/* Payment Method Badge */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-gray-700 border border-gray-200 uppercase">
                            {order.paymentMethod}
                          </span>
                        </div>

                        {/* Order Total & Actions */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block">Total Amount</span>
                            <span className="text-base font-black text-[#5B21B6] font-mono">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Print / Download Invoice"
                          >
                            <Download className="w-3.5 h-3.5 text-[#5B21B6]" />
                            <span className="hidden sm:inline">Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Multi-Step Delivery Status Tracker Stepper */}
                      <div className="p-4 sm:p-5 border-b border-gray-100 bg-purple-50/20">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#5B21B6]">
                            <Truck className="w-4 h-4 text-[#5B21B6]" />
                            <span>{progress.bangla} ({progress.label})</span>
                          </div>
                          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-2">
                            <span>Courier: <strong className="text-gray-800">{courierName}</strong> | Tracking: <strong className="text-[#5B21B6]">{trackingNumber}</strong></span>
                            {onTrackOrder && (
                              <button
                                type="button"
                                onClick={() => onTrackOrder(order.id)}
                                className="px-2 py-0.5 rounded bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              >
                                <Navigation className="w-3 h-3 text-emerald-300" />
                                <span>Live GPS</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 4-Step Visual Stepper */}
                        <div className="relative pt-2 pb-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#5B21B6] h-full rounded-full transition-all duration-500"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold text-gray-500 pt-2 text-center">
                            <span className={progress.step >= 1 ? 'text-[#5B21B6] font-bold' : ''}>1. Confirmed</span>
                            <span className={progress.step >= 2 ? 'text-[#5B21B6] font-bold' : ''}>2. Packed</span>
                            <span className={progress.step >= 3 ? 'text-[#5B21B6] font-bold' : ''}>3. On the Way</span>
                            <span className={progress.step >= 4 ? 'text-emerald-700 font-bold' : ''}>4. Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Ordered Items Breakdown */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="divide-y divide-gray-100">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={item.product.image}
                                  alt={item.product.title}
                                  className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0 bg-gray-50"
                                />
                                <div className="min-w-0">
                                  <h6 
                                    onClick={() => onSelectProduct(item.product)}
                                    className="font-bold text-[#171717] hover:text-[#5B21B6] cursor-pointer truncate transition-colors"
                                  >
                                    {item.product.title}
                                  </h6>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    Qty: <strong className="text-gray-800">{item.quantity}</strong>
                                    {item.selectedSize ? ` • Size: ${item.selectedSize}` : ''}
                                    {item.product.sellerName ? ` • Store: ${item.product.sellerName}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-bold text-[#171717] font-mono">
                                  ৳{(item.product.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Return Request Status Banner (If Submitted) */}
                        {order.returnRequest && (
                          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                                <span className="font-extrabold text-amber-950">
                                  রিটার্ন / রিপ্লেসমেন্ট আবেদন #{order.returnRequest.id}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.returnRequest.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.returnRequest.status === 'Refund Credited to Wallet'
                                  ? 'bg-purple-100 text-[#5B21B6]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {order.returnRequest.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                              <span><strong>কারণ:</strong> {order.returnRequest.reason}</span>
                              <span>•</span>
                              <span><strong>পছন্দের সমাধান:</strong> {order.returnRequest.resolutionType}</span>
                              <span>•</span>
                              <span><strong>অ্যামাউন্ট:</strong> ৳{order.returnRequest.refundAmount.toLocaleString()}</span>
                            </div>
                            {order.returnRequest.photoProofUrl && (
                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">আপলোডকৃত প্রমাণ:</span>
                                <img
                                  src={order.returnRequest.photoProofUrl}
                                  alt="Return Proof"
                                  className="w-8 h-8 rounded-md object-cover border border-amber-200"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Order Footer Details (Address, TrxID, Reorder, Return Action) */}
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="text-gray-500 space-y-0.5">
                            <span className="font-bold text-gray-800 block">
                              Delivery: {order.address.fullName} ({order.address.phone})
                            </span>
                            <span className="text-[11px] block">{order.address.fullAddress}</span>
                            {order.trxId && (
                              <span className="text-[11px] font-mono text-[#5B21B6] font-bold block">
                                TrxID: {order.trxId}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Return Request Button for Delivered Orders */}
                            {order.status === 'Delivered' && !order.returnRequest && (
                              <button
                                type="button"
                                onClick={() => setReturnTargetOrder(order)}
                                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="7 দিনের সহজ রিপ্লেসমেন্ট বা রিটার্ন আবেদন করুন"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                <span>7-Day Return / Replacement</span>
                              </button>
                            )}

                            <button
                              onClick={() => onReorder(order)}
                              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B21B6] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder (আবার অর্ডার করুন)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET & BONUS TRANSACTION HISTORY */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Card Component */}
            <div className="rounded-3xl bg-gradient-to-br from-[#171717] via-[#262626] to-[#1e1b4b] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
                <Wallet className="w-40 h-40 text-purple-400" />
              </div>

              <div className="relative space-y-4 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-widest">
                    Prime Vault Digital Wallet
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live Active
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-300">Current Available Balance</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                      ৳{user.walletBalance || 0}
                    </span>
                    <span className="text-sm font-bold text-purple-300">BDT</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs text-xs text-gray-200 space-y-1">
                  <p className="font-semibold text-white">স্বয়ংক্রিয় ক্যাশব্যাক ও বোনাস সুবিধা:</p>
                  <p className="text-[11px] text-gray-300">
                    চেকআউট করার সময় আপনার ওয়ালেট ব্যালেন্স থেকে প্রতি অর্ডারে সরাসরি ৳২০ ছাড় উপভোগ করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Transaction Ledger */}
            <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#5B21B6]" />
                  <h3 className="font-extrabold text-[#171717] text-sm sm:text-base">
                    Wallet Transaction Ledger (লেনদেন ইতিহাস)
                  </h3>
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {user.walletHistory?.length || 1} transactions
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {user.walletHistory && user.walletHistory.length > 0 ? (
                  user.walletHistory.map((tx) => (
                    <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#171717]">{tx.description}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{tx.date} • Reference ID: {tx.id}</p>
                      </div>

                      <span className={`font-mono font-black text-sm ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'credit' ? `+৳${tx.amount}` : `-৳${tx.amount}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#171717]">৳২০ সাইনআপ ও ফোন ভেরিফিকেশন ওয়েলকাম বোনাস</p>
                      <p className="text-[11px] text-gray-400">Welcome Signup Reward Credit</p>
                    </div>
                    <span className="font-mono font-black text-sm text-emerald-600">+৳20</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SAVED WISHLIST MANAGEMENT */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#171717] text-sm">
                  My Wishlist ({wishlistProducts.length} Items)
                </h3>
                <p className="text-xs text-gray-500">
                  আপনার পছন্দের সংরক্ষিত পারফিউম ও লাইফস্টাইল পণ্যসমূহ
                </p>
              </div>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-[#171717]">আপনার উইশলিস্টে কোনো পণ্য নেই</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  পণ্য ব্রাউজ করার সময় হার্ট আইকনে ট্যাপ করে আপনার পছন্দের আইটেমগুলো সেভ করে রাখুন।
                </p>
                <button
                  onClick={onBackToShop}
                  className="px-5 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  পণ্য ব্রাউজ করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {wishlistProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">{product.category}</span>
                        <h5 
                          onClick={() => onSelectProduct(product)}
                          className="text-xs font-bold text-[#171717] hover:text-[#5B21B6] transition-colors cursor-pointer line-clamp-1 mt-0.5"
                        >
                          {product.title}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-xs text-[#5B21B6]">
                          <span>৳{product.price.toLocaleString()}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ৳{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="w-full py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SAVED ADDRESSES MANAGEMENT */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#171717] text-sm">
                  Saved Shipping Addresses ({savedAddressesList.length})
                </h3>
                <p className="text-xs text-gray-500">
                  চেকআউটে দ্রুত ডেলিভারির জন্য আপনার বিভিন্ন ঠিকানা ম্যানেজ করুন
                </p>
              </div>

              <button
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
                className="px-3.5 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedAddressesList.map((addr, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3 shadow-2xs relative hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#171717]">{addr.fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#5B21B6] border border-purple-100">
                        {addr.label || (idx === 0 ? 'Primary' : 'Address')}
                      </span>
                    </div>

                    {addr.isDefault && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-mono text-gray-800">{addr.phone}</p>
                    <p>{addr.fullAddress}</p>
                    <p className="text-[#5B21B6] font-semibold">{addr.cityDivision} ({addr.district || 'Dhaka'})</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setEditingAddressIndex(idx);
                        setAddressForm(addr);
                        setShowAddressModal(true);
                      }}
                      className="text-[#5B21B6] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {!addr.isDefault && (
                      <button
                        onClick={() => {
                          onUpdateAddress(addr);
                          setAddressSuccessMsg('✓ Default address updated');
                          setTimeout(() => setAddressSuccessMsg(null), 2500);
                        }}
                        className="text-gray-500 hover:text-[#171717] font-semibold cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal Dialog */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-[#171717] text-base">
                {editingAddressIndex !== null ? 'Edit Shipping Address' : 'Add New Shipping Address'}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-[#171717] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  maxLength={11}
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Region</label>
                  <select
                    value={addressForm.cityDivision}
                    onChange={(e) => setAddressForm({ ...addressForm, cityDivision: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B21B6] bg-white"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (৳60)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳120)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Label</label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B21B6] bg-white"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Detailed Address</label>
                <textarea
                  required
                  rows={2}
                  value={addressForm.fullAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                  placeholder="House, Road, Area, Thana..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addr-default"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-[#5B21B6] focus:ring-[#5B21B6]"
                />
                <label htmlFor="addr-default" className="text-gray-700 font-semibold cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for Printable / Downloadable Invoice */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
        />
      )}

      {/* 7-Day Return & Replacement Modal */}
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
