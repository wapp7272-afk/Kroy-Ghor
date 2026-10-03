import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingBag, 
  Copy, 
  Check, 
  Printer, 
  RotateCcw, 
  Wallet, 
  ShieldCheck, 
  Search, 
  Tag,
  Home,
  Sparkles,
  Store,
  CreditCard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Navigation
} from 'lucide-react';
import { Order, UserProfile, Product, CartItem, ReturnRequest } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { ReturnRequestModal } from './ReturnRequestModal';

interface MyOrdersViewProps {
  orders: Order[];
  user: UserProfile;
  onBackToShop: () => void;
  onViewProduct: (product: Product) => void;
  onReorder: (order: Order) => void;
  onOpenAuth: () => void;
  onSubmitReturnRequest?: (orderId: string, returnData: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>) => void;
  onOpenReturnPolicy?: () => void;
  onTrackOrder?: (orderId: string) => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  orders,
  user,
  onBackToShop,
  onViewProduct,
  onReorder,
  onOpenAuth,
  onSubmitReturnRequest,
  onOpenReturnPolicy,
  onTrackOrder,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null);
  const [returnTargetOrder, setReturnTargetOrder] = useState<Order | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for tracking steps based on status
  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return { step: 1, percent: 15, label: 'Order Confirmed', bangla: 'অর্ডার নিশ্চিতকরণ প্রক্রিয়াধীন' };
      case 'Confirmed':
        return { step: 1, percent: 25, label: 'Order Confirmed', bangla: 'অর্ডার নিশ্চিত করা হয়েছে' };
      case 'Processing':
        return { step: 2, percent: 50, label: 'Processing / Packed', bangla: 'ভল্টে প্যাকিং সম্পন্ন হয়েছে' };
      case 'Shipped':
        return { step: 3, percent: 80, label: 'Shipped / On the Way', bangla: 'কুরিয়ারে পথে রয়েছে' };
      case 'Delivered':
        return { step: 4, percent: 100, label: 'Delivered', bangla: 'সফলভাবে ডেলিভারি সম্পন্ন' };
      case 'Cancelled':
        return { step: 0, percent: 0, label: 'Order Cancelled', bangla: 'অর্ডার বাতিল হয়েছে' };
      default:
        return { step: 1, percent: 25, label: 'Order Confirmed', bangla: 'অর্ডার প্লেস করা হয়েছে' };
    }
  };

  // Simulated courier tracking generator
  const getCourierDetails = (order: Order) => {
    const courierName = order.courierName || (order.address.cityDivision === 'Inside Dhaka' ? 'Pathao Express' : 'Steadfast Courier');
    const orderDigits = order.id.replace(/\D/g, '') || '92841';
    const trackingNumber = order.trackingNumber || `ST-${orderDigits}BD`;
    return { courierName, trackingNumber };
  };

  // Filter orders by tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter === 'active' && order.status === 'Delivered') return false;
      if (statusFilter === 'delivered' && order.status !== 'Delivered') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
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
  }, [orders, statusFilter, searchQuery]);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  // Extract merchant / store names from an order
  const getOrderSellers = (order: Order): string[] => {
    const stores = new Set<string>();
    order.items.forEach((item) => {
      const store = item.storeName || item.product.storeName || item.product.sellerName || 'ZeropicBD Official';
      stores.add(store);
    });
    return Array.from(stores);
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ==================== 1. BREADCRUMBS & TOP NAV ==================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 text-xs text-[#525252]">
            <button 
              onClick={onBackToShop}
              className="hover:text-[#5B21B6] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#5B21B6] font-bold">Customer Order History & Live Tracking</span>
          </div>

          <button
            id="back-to-shop-from-orders"
            onClick={onBackToShop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-xs font-bold text-[#171717] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#5B21B6]" />
            <span>Back to Shopping (কেনাকাটা চালিয়ে যান)</span>
          </button>
        </div>

        {/* ==================== 2. CUSTOMER PROFILE OVERVIEW ==================== */}
        <div className="relative overflow-hidden rounded-3xl bg-[#EDE9FE]/40 border border-purple-200 p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* User Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-[#5B21B6] p-1 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-[#5B21B6] flex items-center justify-center text-xl sm:text-2xl font-black text-white">
                    {user.isLoggedIn && user.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-white" />}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-purple-200 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#5B21B6]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#171717]">
                    {user.isLoggedIn && user.name ? user.name : 'Valued Customer / গেস্ট প্রোফাইল'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EDE9FE] border border-purple-300 text-[#5B21B6] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#5B21B6]" />
                    VIP Member
                  </span>
                </div>

                <p className="text-xs text-[#525252] flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium">
                    {user.isLoggedIn && user.phone ? user.phone : (orders[0]?.address.phone || '01883418309')}
                  </span>
                  {user.isLoggedIn && user.email && (
                    <>
                      <span>•</span>
                      <span>{user.email}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-[#5B21B6] font-semibold">ZeropicBD Shopper</span>
                </p>

                <p className="text-[11px] text-[#525252] flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#5B21B6] shrink-0" />
                  <span className="truncate max-w-md">
                    {user.address?.fullAddress || orders[0]?.address.fullAddress || 'House 14, Road 5, Dhanmondi, Dhaka'}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white border border-purple-200 p-3 rounded-2xl lg:min-w-[340px] shadow-2xs">
              {/* Total Orders */}
              <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-[#525252]">Orders</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#5B21B6]">
                  {orders.length}
                </span>
              </div>

              {/* Total Spent */}
              <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-[#525252]">Total Spent</span>
                <span className="text-lg sm:text-xl font-mono font-black text-[#171717]">
                  ৳{totalSpent.toLocaleString()}
                </span>
              </div>

              {/* Wallet Bonus */}
              <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="block text-[10px] uppercase tracking-wider font-bold text-[#525252]">Wallet</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-600">
                  ৳{user.walletBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Manage Profile CTA */}
          <div className="mt-5 pt-4 border-t border-purple-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#525252]">
              {user.isLoggedIn 
                ? 'আপনার ওয়ালেট ও সেভ করা ডেলিভারি ঠিকানা অ্যাকাউন্ট সেটিংস থেকে সহজে পরিচালনা করুন।'
                : 'অ্যাকাউন্টে লগইন করে সেভ করা ঠিকানা ও ওয়ালেট বোনাস উপভোগ করুন।'}
            </span>

            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-[#5B21B6] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>{user.isLoggedIn ? 'Manage Profile & Address' : 'Sign In / Register (৳20 Bonus)'}</span>
            </button>
          </div>
        </div>

        {/* ==================== 3. SEARCH & STATUS FILTER TABS ==================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-50 border border-[#E5E7EB] overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#5B21B6] text-white shadow-xs font-black'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-[#5B21B6] text-white shadow-xs font-black'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Active / Tracking ({orders.filter(o => o.status !== 'Delivered').length})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'delivered'
                  ? 'bg-emerald-700 text-white shadow-xs font-black'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              Delivered ({orders.filter(o => o.status === 'Delivered').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (#PVZ), product, phone..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#171717] placeholder-gray-400 focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-[#171717] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ==================== 4. ORDERS LIST OR EMPTY STATE ==================== */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-gray-50 border border-[#E5E7EB] space-y-5">
            <div className="w-20 h-20 rounded-full bg-[#EDE9FE] border border-purple-200 flex items-center justify-center mx-auto text-[#5B21B6]">
              <Package className="w-10 h-10 stroke-[1.5]" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-[#171717]">
                {orders.length === 0 
                  ? 'আপনার কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি'
                  : 'এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি'}
              </h3>
              <p className="text-xs text-[#525252] leading-relaxed">
                {orders.length === 0
                  ? 'প্রাইম ভল্ট জোনের প্রিমিয়াম পারফিউম, ইলেকট্রনিক গ্যাজেট ও লাইফস্টাইল কালেকশন থেকে এখনই আপনার পছন্দের পণ্য অর্ডার করুন।'
                  : 'অন্য কোনো ফিল্টার সিলেক্ট করুন অথবা নতুন সার্চ টার্ম দিয়ে চেষ্টা করুন।'}
              </p>
            </div>

            <button
              onClick={onBackToShop}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Now (কেনাকাটা শুরু করুন)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const progress = getStepProgress(order.status);
              const { courierName, trackingNumber } = getCourierDetails(order);
              const sellers = getOrderSellers(order);
              const isTrackingExpanded = expandedTrackingId === order.id;

              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id.replace('#', '')}`}
                  className="rounded-3xl bg-white border border-[#E5E7EB] hover:border-purple-300 transition-all duration-300 overflow-hidden shadow-2xs"
                >
                  {/* Card Header Bar */}
                  <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#525252] font-semibold">Order ID:</span>
                        <span className="font-mono font-black text-[#5B21B6] text-sm sm:text-base">
                          {order.id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.id)}
                          className="p-1 text-gray-400 hover:text-[#5B21B6] transition-colors cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedId === order.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <span className="hidden sm:inline text-gray-300">•</span>

                      <div className="flex items-center gap-1 text-[11px] text-[#525252] font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{order.date}</span>
                      </div>

                      {/* Seller Tag */}
                      <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EDE9FE] text-[#5B21B6] border border-purple-200">
                        <Store className="w-3 h-3" />
                        <span>{sellers.join(', ')}</span>
                      </span>
                    </div>

                    {/* Status & Payment Method Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Payment Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                        order.paymentMethod === 'cod'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : order.paymentMethod === 'bkash'
                          ? 'bg-pink-50 border-pink-200 text-pink-700'
                          : order.paymentMethod === 'nagad'
                          ? 'bg-orange-50 border-orange-200 text-orange-700'
                          : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <CreditCard className="w-3 h-3" />
                        <span>
                          {order.paymentMethod === 'cod'
                            ? 'Cash on Delivery (Pending)'
                            : `${order.paymentMethod.toUpperCase()} • Paid`}
                        </span>
                      </span>

                      {/* Order Delivery Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : order.status === 'Shipped'
                          ? 'bg-[#EDE9FE] border-purple-300 text-[#5B21B6]'
                          : order.status === 'Processing'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-purple-50 border-purple-200 text-[#5B21B6]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-600' : 'bg-[#5B21B6] animate-pulse'}`} />
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* ==================== 4-STEP LIVE VISUAL ORDER TRACKER ==================== */}
                  <div className="p-5 sm:p-6 bg-white border-b border-[#E5E7EB] space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#171717] flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#5B21B6]" />
                        <span>Live Shipment Progress (লাইভ অর্ডার ট্র্যাকার)</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#5B21B6] font-bold bg-[#EDE9FE] px-2.5 py-0.5 rounded-md border border-purple-200">
                        {order.address.cityDivision === 'Inside Dhaka' 
                          ? 'ডেলিভারি এরিয়া: ঢাকা (১-২ দিন)' 
                          : 'ডেলিভারি এরিয়া: ঢাকার বাইরে (৩-৫ দিন)'}
                      </span>
                    </div>

                    {/* Visual 4-Step Stepper Bar */}
                    <div className="relative pt-4 pb-2">
                      {/* Background Bar */}
                      <div className="absolute top-8 left-8 right-8 h-1.5 bg-gray-200 rounded-full -translate-y-1/2" />
                      
                      {/* Active Progress Bar Fill in Deep Purple (#5B21B6) */}
                      <div 
                        className="absolute top-8 left-8 h-1.5 bg-[#5B21B6] rounded-full -translate-y-1/2 transition-all duration-700 shadow-xs"
                        style={{ width: `calc(${progress.percent}% - 32px)` }}
                      />

                      {/* 4 Steps */}
                      <div className="relative z-10 grid grid-cols-4 text-center">
                        {/* Step 1: Order Confirmed 📝 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                            progress.step >= 1
                              ? 'bg-[#5B21B6] border-[#5B21B6] text-white shadow-xs'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] sm:text-xs font-bold mt-2 ${progress.step >= 1 ? 'text-[#171717]' : 'text-gray-400'}`}>
                            Order Confirmed 📝
                          </span>
                          <span className="text-[10px] text-[#525252] hidden sm:block">অর্ডার নিশ্চিত</span>
                        </div>

                        {/* Step 2: Processing / Packed 📦 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                            progress.step >= 2
                              ? 'bg-[#5B21B6] border-[#5B21B6] text-white shadow-xs'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] sm:text-xs font-bold mt-2 ${progress.step >= 2 ? 'text-[#171717]' : 'text-gray-400'}`}>
                            Processing / Packed 📦
                          </span>
                          <span className="text-[10px] text-[#525252] hidden sm:block">ভল্টে প্যাকিং</span>
                        </div>

                        {/* Step 3: Shipped / On the Way 🚚 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                            progress.step >= 3
                              ? 'bg-[#5B21B6] border-[#5B21B6] text-white shadow-xs'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] sm:text-xs font-bold mt-2 ${progress.step >= 3 ? 'text-[#171717]' : 'text-gray-400'}`}>
                            Shipped / In Transit 🚚
                          </span>
                          <span className="text-[10px] text-[#525252] hidden sm:block">কুরিয়ারে রওয়ানা</span>
                        </div>

                        {/* Step 4: Delivered 🎉 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                            progress.step >= 4
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            <Home className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] sm:text-xs font-bold mt-2 ${progress.step >= 4 ? 'text-emerald-700 font-extrabold' : 'text-gray-400'}`}>
                            Delivered 🎉
                          </span>
                          <span className="text-[10px] text-[#525252] hidden sm:block">ডেলিভারি সম্পন্ন</span>
                        </div>
                      </div>
                    </div>

                    {/* Step description badge with simulated courier & tracking */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#525252]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5B21B6] animate-pulse" />
                        <span>
                          Current Status: <strong className="text-[#171717]">{progress.label}</strong> ({progress.bangla})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Partner:</span>
                        <span className="font-bold text-[#171717]">{courierName}</span>
                        <span className="font-mono text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded text-[#5B21B6] font-bold">
                          {trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedTrackingId(isTrackingExpanded ? null : order.id)}
                          className="text-[#5B21B6] hover:underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <span>{isTrackingExpanded ? 'Hide Timeline' : 'View Timeline'}</span>
                          {isTrackingExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {onTrackOrder && (
                          <button
                            type="button"
                            onClick={() => onTrackOrder(order.id)}
                            className="ml-auto px-2.5 py-1 rounded-md bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-emerald-300" />
                            <span>Live GPS Tracker</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Simulated live courier tracking timeline (Expandable) */}
                    {isTrackingExpanded && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 text-xs space-y-3">
                        <h5 className="font-bold text-[#171717] flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#5B21B6]" />
                          <span>Detailed Courier Journey Timeline ({courierName})</span>
                        </h5>

                        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                          <div className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#5B21B6]" />
                            <p className="font-bold text-[#171717]">Tejgaon Central Hub — Out for Delivery</p>
                            <p className="text-[11px] text-gray-500">Rider assigned with parcel. Contact: 01883418309</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#5B21B6]" />
                            <p className="font-bold text-[#171717]">Parcel Received at Courier Sorting Facility</p>
                            <p className="text-[11px] text-gray-500">Dispatched from ZeropicBD Central Warehouse</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            <p className="font-bold text-[#171717]">Order Verified & Packed</p>
                            <p className="text-[11px] text-gray-500">Quality checked by ZeropicBD Inspection Team</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ==================== PURCHASED ITEMS LIST ==================== */}
                  <div className="p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#171717] flex items-center justify-between pb-1">
                      <span>অর্ডারকৃত পণ্যসমূহ ({order.items.reduce((s, i) => s + i.quantity, 0)} টি আইটেম)</span>
                      <span className="text-[11px] text-gray-500">বিস্তারিত দেখতে পণ্যের উপর ক্লিক করুন</span>
                    </h4>

                    <div className="space-y-2.5">
                      {order.items.map((item, idx) => {
                        const itemStore = item.storeName || item.product.storeName || item.product.sellerName || 'Kroyghor Official';
                        return (
                          <div
                            key={idx}
                            onClick={() => onViewProduct(item.product)}
                            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 border border-[#E5E7EB] hover:border-purple-300 hover:bg-purple-50/20 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                width={48}
                                height={48}
                                loading="lazy"
                                decoding="async"
                                className="w-12 h-12 rounded-xl object-cover bg-white border border-gray-200 shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-[#171717] group-hover:text-[#5B21B6] transition-colors truncate">
                                  {item.product.title}
                                </p>
                                <div className="text-[11px] text-[#525252] flex items-center gap-2 mt-0.5">
                                  <span className="text-[#5B21B6] font-semibold flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    {itemStore}
                                  </span>
                                  {item.selectedSize && (
                                    <>
                                      <span>•</span>
                                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-[#5B21B6] font-bold text-[10px]">
                                        {item.selectedSize}
                                      </span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="font-mono">৳{item.product.price.toLocaleString()} × {item.quantity}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-xs sm:text-sm text-[#171717]">
                                ৳{(item.product.price * item.quantity).toLocaleString()}
                              </span>
                              <span className="block text-[10px] text-[#5B21B6] group-hover:underline font-semibold mt-0.5">
                                View Product ↗
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ==================== ADDRESS & FINANCIAL BREAKDOWN ==================== */}
                  <div className="p-5 bg-gray-50 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shipping Address & Contact */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#5B21B6] pb-1 border-b border-gray-100">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>ডেলিভারি ঠিকানা ও যোগাযোগের তথ্য</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">প্রাপক (Recipient):</span>
                        <span className="font-bold text-[#171717]">{order.address.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">মোবাইল ফোন:</span>
                        <span className="font-mono font-bold text-[#171717]">{order.address.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ঠিকানা:</span>
                        <span className="text-right text-[#171717] max-w-[220px] font-medium truncate" title={order.address.fullAddress}>
                          {order.address.fullAddress}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ডেলিভারি জোন:</span>
                        <span className="text-[#5B21B6] font-bold">{order.address.district || order.address.cityDivision}</span>
                      </div>
                      {order.address.notes && (
                        <div className="flex justify-between text-[11px] pt-1 border-t border-gray-100">
                          <span className="text-gray-500">বিশেষ নোট:</span>
                          <span className="text-[#171717] italic">{order.address.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#5B21B6] pb-1 border-b border-gray-100">
                        <Tag className="w-3.5 h-3.5" />
                        <span>মূল্য বিবরণী (Financial Breakdown)</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>আইটেম সাবটোটাল:</span>
                        <span className="font-mono font-bold text-[#171717]">৳{order.subtotal.toLocaleString()}</span>
                      </div>

                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>কুপন ছাড় (Coupon Discount):</span>
                          <span className="font-mono">-৳{order.discount.toLocaleString()}</span>
                        </div>
                      )}

                      {order.walletDeducted > 0 && (
                        <div className="flex justify-between text-purple-700 font-semibold">
                          <span>ওয়ালেট বোনাস ছাড়:</span>
                          <span className="font-mono">-৳{order.walletDeducted.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-500">
                        <span>ডেলিভারি চার্জ ({order.address.cityDivision}):</span>
                        <span className="font-mono font-bold text-[#171717]">৳{order.deliveryFee.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 font-extrabold text-sm text-[#171717]">
                        <span>সর্বমোট প্রদেয় বিল (Total):</span>
                        <span className="font-mono text-base sm:text-lg text-[#5B21B6] font-black">
                          ৳{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return Request Status Banner (If Submitted) */}
                  {order.returnRequest && (
                    <div className="mx-5 mb-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
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
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            className="w-8 h-8 rounded-md object-cover border border-amber-200"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions Footer: Print Invoice & Reorder & Return Request */}
                  <div className="p-4 bg-gray-50/80 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {order.trxId && (
                        <span className="text-[11px] font-mono text-gray-500">
                          TrxID: <strong className="text-[#5B21B6]">{order.trxId}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Return Request Action for Delivered Items */}
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

                      {/* Print / Download Invoice Button */}
                      <button
                        id={`print-invoice-btn-${order.id.replace('#', '')}`}
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 border border-[#E5E7EB] hover:border-purple-300 text-xs font-bold text-[#171717] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="View & Print Official Invoice"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#5B21B6]" />
                        <span>Print Invoice</span>
                      </button>

                      {/* Reorder Button */}
                      <button
                        id={`reorder-btn-${order.id.replace('#', '')}`}
                        onClick={() => onReorder(order)}
                        className="px-4 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-black text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Order Again (পুনরায় অর্ডার)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

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
