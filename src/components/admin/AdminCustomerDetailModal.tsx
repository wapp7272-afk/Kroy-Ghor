import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Wallet,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Coins,
  Package,
  CreditCard,
  Truck,
  FileText,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { CustomerRecord } from './AdminCustomersManager';
import { Order, CartItem, Address, WalletTransaction } from '../../types';
import { getUserOrdersFromFirestore } from '../../services/orderFirestoreService';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseAuth';

interface AdminCustomerDetailModalProps {
  customer: CustomerRecord;
  orders: Order[];
  onClose: () => void;
  onToggleStatus: (cust: CustomerRecord) => void;
  showToast?: (msg: string) => void;
}

type CustomerDetailTab = 'orders' | 'wallet' | 'addresses' | 'overview';

export const AdminCustomerDetailModal: React.FC<AdminCustomerDetailModalProps> = ({
  customer,
  orders: globalOrders,
  onClose,
  onToggleStatus,
  showToast = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('orders');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch all lifetime orders belonging to this customer from Firestore & global orders
  useEffect(() => {
    let isMounted = true;
    setIsLoadingOrders(true);

    const fetchOrders = async () => {
      try {
        const firestoreOrders = await getUserOrdersFromFirestore(
          customer.uid,
          customer.email,
          customer.phone
        );

        if (isMounted) {
          // Merge with globalOrders prop to be 100% comprehensive
          const map = new Map<string, Order>();
          firestoreOrders.forEach((o) => map.set(o.id, o));

          const cEmail = customer.email?.toLowerCase().trim();
          const cPhone = customer.phone?.replace(/[^0-9]/g, '');

          globalOrders.forEach((o) => {
            const matchUid = o.userId && o.userId === customer.uid;
            const matchEmail = cEmail && o.customerEmail && o.customerEmail.toLowerCase().trim() === cEmail;
            const matchPhone = cPhone && o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '') === cPhone;

            if (matchUid || matchEmail || matchPhone) {
              map.set(o.id, o);
            }
          });

          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setCustomerOrders(sorted);
          setIsLoadingOrders(false);
        }
      } catch (err) {
        console.warn('[AdminCustomerDetailModal] Error fetching customer orders:', err);
        if (isMounted) {
          // Fallback to filtering globalOrders
          const cEmail = customer.email?.toLowerCase().trim();
          const cPhone = customer.phone?.replace(/[^0-9]/g, '');

          const filtered = globalOrders.filter((o) => {
            const matchUid = o.userId && o.userId === customer.uid;
            const matchEmail = cEmail && o.customerEmail && o.customerEmail.toLowerCase().trim() === cEmail;
            const matchPhone = cPhone && o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '') === cPhone;
            return matchUid || matchEmail || matchPhone;
          });

          setCustomerOrders(filtered);
          setIsLoadingOrders(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [customer.uid, customer.email, customer.phone, globalOrders]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`✓ Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Derive unique shipping addresses collected from all customer orders
  const customerAddresses = useMemo(() => {
    const addressList: (Address & { orderCount: number; lastUsed: string })[] = [];

    customerOrders.forEach((order) => {
      const addr = order.address || (order as any).shippingAddress;
      if (!addr || !addr.fullAddress) return;

      const normalized = `${addr.fullName || ''}-${addr.phone || ''}-${addr.fullAddress || ''}`.toLowerCase();
      const existing = addressList.find(
        (a) => `${a.fullName}-${a.phone}-${a.fullAddress}`.toLowerCase() === normalized
      );

      if (existing) {
        existing.orderCount += 1;
      } else {
        addressList.push({
          fullName: addr.fullName || customer.name,
          phone: addr.phone || customer.phone,
          cityDivision: addr.cityDivision || 'Inside Dhaka',
          fullAddress: addr.fullAddress,
          district: addr.district || 'Dhaka',
          notes: addr.notes || '',
          label: addressList.length === 0 ? 'Primary' : 'Shipping',
          isDefault: addressList.length === 0,
          orderCount: 1,
          lastUsed: order.date,
        });
      }
    });

    return addressList;
  }, [customerOrders, customer.name, customer.phone]);

  // Derived wallet transactions ledger
  const walletTransactions = useMemo(() => {
    const txs: { id: string; date: string; amount: number; type: 'credit' | 'debit'; reason: string }[] = [];

    // 1. YouTube Bonus if claimed
    if (customer.hasClaimedYouTubeBonus) {
      txs.push({
        id: 'tx-yt-bonus',
        date: customer.createdAtFormatted || 'Initial',
        amount: 20,
        type: 'credit',
        reason: 'YouTube Subscription Reward Bonus',
      });
    }

    // 2. Welcome bonus if has received bonus or balance >= 20 without orders
    if (customer.walletBalance >= 20 || customer.hasClaimedYouTubeBonus) {
      txs.push({
        id: 'tx-welcome-bonus',
        date: customer.createdAtFormatted || 'Initial',
        amount: 20,
        type: 'credit',
        reason: 'New Account Welcome Sign-up Bonus',
      });
    }

    // 3. Deductions from past orders
    customerOrders.forEach((o) => {
      if (o.walletDeducted && o.walletDeducted > 0) {
        txs.push({
          id: `tx-deduct-${o.id}`,
          date: o.date,
          amount: o.walletDeducted,
          type: 'debit',
          reason: `Applied to Order #${o.id}`,
        });
      }
    });

    return txs;
  }, [customer.hasClaimedYouTubeBonus, customer.walletBalance, customer.createdAtFormatted, customerOrders]);

  const isSuspended = customer.status === 'suspended';
  const totalSpentCalculated = useMemo(() => {
    return customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [customerOrders]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-detail-title"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-100">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Profile Avatar / Photo */}
            <div className="relative shrink-0">
              {customer.photoURL ? (
                <img
                  src={customer.photoURL}
                  alt={customer.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white font-black flex items-center justify-center text-xl shadow-md">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              )}

              {customer.role === 'super_admin' && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs shadow-xs"
                  title="Super Admin / Owner"
                >
                  👑
                </span>
              )}
            </div>

            {/* Customer Header Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="customer-detail-title" className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  {customer.name}
                </h2>

                {/* Role Badge */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    customer.role === 'super_admin'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : customer.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {customer.role}
                </span>

                {/* Verification Badge */}
                {customer.isPhoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Phone Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Unverified</span>
                  </span>
                )}

                {/* Account Status Pill */}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isSuspended
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isSuspended ? <XCircle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span className="capitalize">{customer.status}</span>
                </span>
              </div>

              {/* Email & Phone Details */}
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1 flex-wrap">
                {customer.email && (
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.email}</span>
                  </span>
                )}
                {customer.phone && (
                  <span className="flex items-center gap-1 hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions: Toggle Status & Close */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onToggleStatus(customer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80'
              }`}
            >
              {isSuspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{isSuspended ? 'Activate Account' : 'Suspend Account'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Profile (Esc)"
              aria-label="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. METRIC SUMMARY CARDS (4 KEY METRICS) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Metric 1: Lifetime Orders Count */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lifetime Orders</span>
            </div>
            <p className="text-xl font-black text-white">
              {isLoadingOrders ? '...' : customerOrders.length}
            </p>
          </div>

          {/* Metric 2: Total Spent (BDT) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Spent</span>
            </div>
            <p className="text-xl font-black text-emerald-400 font-mono">
              ৳{totalSpentCalculated.toLocaleString()}
            </p>
          </div>

          {/* Metric 3: Current Wallet Balance */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wallet Balance</span>
            </div>
            <p className="text-xl font-black text-cyan-400 font-mono">
              ৳{customer.walletBalance.toLocaleString()}
            </p>
          </div>

          {/* Metric 4: Account Joined Date */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Joined Date</span>
            </div>
            <p className="text-sm font-bold text-white mt-1">
              {customer.createdAtFormatted || 'Recent'}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TABBED SECTIONS NAVIGATION */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            {
              id: 'orders' as CustomerDetailTab,
              label: 'Orders History',
              icon: ShoppingBag,
              badge: customerOrders.length,
            },
            {
              id: 'wallet' as CustomerDetailTab,
              label: 'Wallet & Bonus',
              icon: Wallet,
              badge: customer.walletBalance > 0 ? `৳${customer.walletBalance}` : undefined,
            },
            {
              id: 'addresses' as CustomerDetailTab,
              label: 'Saved Addresses',
              icon: MapPin,
              badge: customerAddresses.length,
            },
            {
              id: 'overview' as CustomerDetailTab,
              label: 'Account Metadata',
              icon: User,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#007BFF]/20 text-[#007BFF]' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. TAB CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[50vh] scrollbar-thin">
          {/* TAB 1: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {isLoadingOrders ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#007BFF] mx-auto mb-2" />
                  <span>Loading lifetime orders from Firestore...</span>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800 p-6">
                  <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-300">No lifetime orders found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    This customer has not placed any orders yet on ZeropicBD.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => {
                    const statusColors: Record<string, string> = {
                      Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      Confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                      Processing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                      Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    };

                    const paymentColors: Record<string, string> = {
                      Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      Verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    };

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-white text-xs">
                              #{order.id}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Payment Status */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                paymentColors[order.paymentStatus || 'Pending'] || 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {order.paymentStatus || 'Pending'} ({order.paymentMethod?.toUpperCase()})
                            </span>

                            {/* Order Status */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                statusColors[order.status] || 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={item.product?.image || '/zeropicbd_logo_exact.png'}
                                  alt={item.product?.title || 'Product'}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-800 shrink-0"
                                />
                                <div className="truncate">
                                  <p className="font-semibold text-slate-200 truncate">
                                    {item.product?.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Qty: {item.quantity} × ৳{item.product?.price?.toLocaleString()}
                                    {item.selectedSize ? ` • Size: ${item.selectedSize}` : ''}
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-white shrink-0">
                                ৳{((item.product?.price || 0) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Financial Breakdown */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                          <div className="text-[11px] text-slate-400 space-x-3">
                            <span>Subtotal: ৳{order.subtotal?.toLocaleString()}</span>
                            <span>Delivery: ৳{order.deliveryFee}</span>
                            {order.walletDeducted > 0 && (
                              <span className="text-cyan-400 font-bold">
                                Wallet: -৳{order.walletDeducted}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-black text-white">
                            Total: <strong className="text-emerald-400">৳{order.total?.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WALLET & BONUS */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">
              {/* Balance Highlight Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold">Available Customer Balance</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    ৳{customer.walletBalance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">YouTube Subscription Bonus</p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border mt-1 ${
                      customer.hasClaimedYouTubeBonus
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {customer.hasClaimedYouTubeBonus ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{customer.hasClaimedYouTubeBonus ? 'Claimed (৳20 Credited)' : 'Not Claimed Yet'}</span>
                  </span>
                </div>
              </div>

              {/* Transaction History Ledger */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Wallet Transactions & Bonus Ledger
                </h4>
                {walletTransactions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-950 rounded-xl border border-slate-800">
                    No wallet transactions recorded for this account.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {walletTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              tx.type === 'credit'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.reason}</p>
                            <p className="text-[10px] text-slate-500">{tx.date}</p>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-black ${
                            tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}৳{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-3">
              {customerAddresses.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 p-6">
                  <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-300">No delivery addresses on file</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Addresses will automatically populate as the customer completes orders.
                  </p>
                </div>
              ) : (
                customerAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{addr.fullName}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                          {addr.label || 'Saved'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Used in {addr.orderCount} {addr.orderCount === 1 ? 'order' : 'orders'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{addr.fullAddress}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {addr.cityDivision} • Phone: {addr.phone}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(`${addr.fullName}, ${addr.phone}, ${addr.fullAddress}`, 'Address')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-700 w-fit shrink-0 flex items-center gap-1.5"
                    >
                      {copiedText === 'Address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Address</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNT OVERVIEW & METADATA */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Firebase Authentication & Backend Identity
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* UID */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Firestore User UID</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <code className="text-emerald-400 text-xs font-mono truncate">{customer.uid}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.uid, 'UID')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copy UID"
                      >
                        {copiedText === 'UID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Auth Provider */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Auth Provider</p>
                    <p className="font-bold text-white mt-1">
                      {customer.email?.includes('@gmail.com') ? 'Google OAuth 2.0' : 'Email & Password'}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Assigned Security Role</p>
                    <p className="font-bold text-amber-400 mt-1 uppercase">{customer.role}</p>
                  </div>

                  {/* Last Active Timestamp */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Last Login Activity</p>
                    <p className="font-bold text-slate-200 mt-1">{customer.lastLoginAtFormatted}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Customer ID: <code className="text-slate-300 font-mono">{customer.uid}</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
