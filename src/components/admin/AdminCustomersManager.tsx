import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ShoppingBag,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Crown,
  UserCheck,
  UserX,
  Coins,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth, subscribeToFirebaseAuthState, signInWithGoogle } from '../../lib/firebaseAuth';
import { Order, UserRole } from '../../types';
import { AdminCustomerDetailModal } from './AdminCustomerDetailModal';

export interface CustomerRecord {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  role: UserRole;
  isPhoneVerified: boolean;
  walletBalance: number;
  hasClaimedYouTubeBonus: boolean;
  createdAtRaw?: any;
  createdAtFormatted: string;
  lastLoginAtRaw?: any;
  lastLoginAtFormatted: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'suspended';
}

export type CustomerQuickFilter = 'all' | 'has_orders' | 'no_orders' | 'yt_bonus';

interface AdminCustomersManagerProps {
  orders: Order[];
  showToast?: (msg: string) => void;
}

const formatDate = (val: any): string => {
  if (!val) return 'Recent';
  if (val.seconds) {
    return new Date(val.seconds * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (typeof val === 'string' && val.includes('-')) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {}
  }
  return String(val);
};

const formatTimeAgo = (val: any): string => {
  if (!val) return 'Recent';
  let timestamp = 0;
  if (val.seconds) {
    timestamp = val.seconds * 1000;
  } else if (typeof val === 'string') {
    timestamp = new Date(val).getTime();
  }
  if (!timestamp || isNaN(timestamp)) return 'Recent';

  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const AdminCustomersManager: React.FC<AdminCustomersManagerProps> = ({
  orders,
  showToast = () => {},
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<CustomerQuickFilter>('all');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Subscribe to real-time updates from Firestore `users` collection upon Auth readiness
  useEffect(() => {
    setIsLoading(true);
    let unsubSnapshot = () => {};

    const unsubAuth = subscribeToFirebaseAuthState((fUser) => {
      console.log('[AdminCustomersManager] AUTH STATE CHANGED:', fUser ? fUser.email : 'UNAUTHENTICATED');
      console.log('[AdminCustomersManager] ADMIN AUTH UID:', fUser?.uid || 'NONE');

      if (unsubSnapshot) {
        unsubSnapshot();
      }

      if (db) {
        try {
          const usersCol = collection(db, 'users');
          unsubSnapshot = onSnapshot(
            usersCol,
            (snapshot) => {
              console.log('[AdminCustomersManager] USERS SNAPSHOT SIZE:', snapshot.size);
              const customerMap = new Map<string, CustomerRecord>();

              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const email = (data.email || '').toLowerCase().trim();
                const uid = docSnap.id;
                const key = uid || email;

                customerMap.set(key, {
                  uid,
                  name: data.displayName || data.name || (email ? email.split('@')[0] : 'Kroy Ghor Member'),
                  email: data.email || '',
                  phone: data.phone || data.customerPhone || '',
                  photoURL: data.photoURL || data.avatar || '',
                  role: (data.role || (email === 'wapp7272@gmail.com' ? 'super_admin' : 'customer')) as UserRole,
                  isPhoneVerified: Boolean(data.isPhoneVerified || data.phoneVerified || (data.phone && data.phone.length === 11)),
                  walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
                  hasClaimedYouTubeBonus: Boolean(data.hasClaimedYouTubeBonus || data.hasReceivedBonus),
                  createdAtRaw: data.createdAt,
                  createdAtFormatted: formatDate(data.createdAt),
                  lastLoginAtRaw: data.lastLoginAt,
                  lastLoginAtFormatted: formatTimeAgo(data.lastLoginAt),
                  totalOrders: 0,
                  totalSpent: 0,
                  status: data.status === 'suspended' ? 'suspended' : 'active',
                });
              });

              // Merge local storage accounts fallback for dev / preview testing
              try {
                const stored =
                  localStorage.getItem('zeropicbd_registered_accounts') ||
                  localStorage.getItem('primevault_registered_accounts');
                const accounts: any[] = stored ? JSON.parse(stored) : [];
                accounts.forEach((acc) => {
                  const email = (acc.email || '').toLowerCase().trim();
                  const key = email || acc.phone || `user_${Date.now()}`;
                  if (!customerMap.has(key)) {
                    customerMap.set(key, {
                      uid: acc.uid || key,
                      name: acc.name || 'Registered Customer',
                      email: acc.email || '',
                      phone: acc.phone || '',
                      photoURL: acc.avatar || '',
                      role: (acc.role || (email === 'wapp7272@gmail.com' ? 'super_admin' : 'customer')) as UserRole,
                      isPhoneVerified: Boolean(acc.isPhoneVerified || acc.phone),
                      walletBalance: acc.walletBalance || 0,
                      hasClaimedYouTubeBonus: Boolean(acc.hasClaimedYouTubeBonus || acc.hasReceivedBonus),
                      createdAtFormatted: 'Recent',
                      lastLoginAtFormatted: 'Recent',
                      totalOrders: 0,
                      totalSpent: 0,
                      status: 'active',
                    });
                  }
                });
              } catch (e) {
                console.warn('[AdminCustomersManager] LocalStorage merge error:', e);
              }

              // Calculate lifetime orders and spend per customer
              orders.forEach((o) => {
                const oEmail = (o.customerEmail || '').toLowerCase().trim();
                const oPhone = (o.customerPhone || o.address?.phone || '').replace(/[^0-9]/g, '');
                const oUserId = o.userId;

                for (const [_, cust] of customerMap.entries()) {
                  const matchUid = oUserId && cust.uid === oUserId;
                  const matchEmail = oEmail && cust.email && cust.email.toLowerCase() === oEmail;
                  const matchPhone = oPhone && cust.phone && cust.phone.replace(/[^0-9]/g, '') === oPhone;

                  if (matchUid || matchEmail || matchPhone) {
                    cust.totalOrders += 1;
                    cust.totalSpent += o.total || 0;
                  }
                }
              });

              setCustomers(Array.from(customerMap.values()));
              setIsLoading(false);
            },
            (err) => {
              console.warn('[AdminCustomersManager] Snapshot error:', err);
              setIsLoading(false);
            }
          );
        } catch (err) {
          console.error('[AdminCustomersManager] Initialization error:', err);
          setIsLoading(false);
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [orders]);

  // Toggle account status (Active / Suspended)
  const handleToggleCustomerStatus = async (cust: CustomerRecord) => {
    const nextStatus = cust.status === 'active' ? 'suspended' : 'active';
    setUpdatingUid(cust.uid);

    // Update UI immediately
    setCustomers((prev) =>
      prev.map((c) => (c.uid === cust.uid ? { ...c, status: nextStatus } : c))
    );

    // Persist in Firestore
    if (db && cust.uid) {
      try {
        const userDocRef = doc(db, 'users', cust.uid);
        await updateDoc(userDocRef, {
          status: nextStatus,
        }).catch(async () => {
          await setDoc(userDocRef, { status: nextStatus }, { merge: true });
        });
        showToast(`✓ Account for "${cust.name}" is now ${nextStatus.toUpperCase()}`);
      } catch (err) {
        console.error('[AdminCustomersManager] Status update error:', err);
        showToast(`❌ Failed to update status in Firestore.`);
      } finally {
        setUpdatingUid(null);
      }
    } else {
      setUpdatingUid(null);
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Quick Filters
      if (activeFilter === 'has_orders' && c.totalOrders === 0) return false;
      if (activeFilter === 'no_orders' && c.totalOrders > 0) return false;
      if (activeFilter === 'yt_bonus' && !c.hasClaimedYouTubeBonus) return false;

      // 2. Search Query (Name, Email, Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = q.replace(/[^0-9]/g, '');
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone =
          (cleanQ && c.phone.replace(/[^0-9]/g, '').includes(cleanQ)) ||
          c.phone.toLowerCase().includes(q);
        const matchUid = c.uid.toLowerCase().includes(q);

        return matchName || matchEmail || matchPhone || matchUid;
      }

      return true;
    });
  }, [customers, activeFilter, searchQuery]);

  // Aggregate statistics for header cards
  const stats = useMemo(() => {
    const totalCount = customers.length;
    const withOrdersCount = customers.filter((c) => c.totalOrders > 0).length;
    const noOrdersCount = customers.filter((c) => c.totalOrders === 0).length;
    const ytBonusCount = customers.filter((c) => c.hasClaimedYouTubeBonus).length;
    const totalWalletOutstanding = customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0);
    const totalLifetimeSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    return {
      totalCount,
      withOrdersCount,
      noOrdersCount,
      ytBonusCount,
      totalWalletOutstanding,
      totalLifetimeSpend,
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. DIRECTORY HEADER & SUMMARY METRICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Registered */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Customers</p>
            <p className="text-xl font-black text-white">{stats.totalCount}</p>
          </div>
        </div>

        {/* Metric 2: Customers with Orders */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Has Placed Orders</p>
            <p className="text-xl font-black text-emerald-400">{stats.withOrdersCount}</p>
          </div>
        </div>

        {/* Metric 3: YouTube Bonus Claimed */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">YT Bonus Claimed</p>
            <p className="text-xl font-black text-amber-400">{stats.ytBonusCount}</p>
          </div>
        </div>

        {/* Metric 4: Wallet Outstanding */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Wallet Liability</p>
            <p className="text-xl font-black text-cyan-400 font-mono">৳{stats.totalWalletOutstanding.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & QUICK FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {[
            {
              key: 'all' as CustomerQuickFilter,
              label: 'All Customers',
              count: stats.totalCount,
            },
            {
              key: 'has_orders' as CustomerQuickFilter,
              label: 'Has Orders',
              count: stats.withOrdersCount,
            },
            {
              key: 'no_orders' as CustomerQuickFilter,
              label: 'No Orders Yet',
              count: stats.noOrdersCount,
            },
            {
              key: 'yt_bonus' as CustomerQuickFilter,
              label: 'YouTube Bonus Claimed',
              count: stats.ytBonusCount,
            },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeFilter === f.key
                  ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search by Name, Email, or Phone */}
        <div className="relative min-w-[280px] sm:min-w-[320px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer p-1"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STRUCTURED DATA TABLE (CUSTOMERS DIRECTORY) */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Customer Info</th>
                <th className="py-3.5 px-4">Phone & Verification</th>
                <th className="py-3.5 px-4">Joining & Last Active</th>
                <th className="py-3.5 px-4">Lifetime Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4 text-right">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#007BFF] mx-auto mb-2" />
                    <span className="font-semibold text-xs text-slate-300">Streaming customer directory from Firestore...</span>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-300">No customers found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery
                        ? `No matching records for "${searchQuery}". Try a different keyword.`
                        : 'No customer accounts available under this filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSuspended = cust.status === 'suspended';
                  const isSuper = cust.role === 'super_admin';
                  const isAdmin = cust.role === 'admin';

                  return (
                    <tr
                      key={cust.uid}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`hover:bg-slate-800/70 transition-colors cursor-pointer group ${
                        isSuspended ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Column 1: Customer Info (Name, Email/Gmail, Profile Photo) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Profile Photo with Fallback Avatar */}
                          <div className="relative shrink-0">
                            {cust.photoURL ? (
                              <img
                                src={cust.photoURL}
                                alt={cust.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-xs"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {isSuper && (
                              <span
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] shadow-xs"
                                title="Super Admin"
                              >
                                👑
                              </span>
                            )}
                          </div>

                          {/* Customer Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-white text-xs truncate max-w-[160px] sm:max-w-[200px]">
                                {cust.name}
                              </p>
                              {/* Role Badge */}
                              <span
                                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                  isSuper
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : isAdmin
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    : cust.role === 'seller'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {cust.role}
                              </span>
                            </div>

                            {/* Email */}
                            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate max-w-[180px] sm:max-w-[220px]">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{cust.email || 'No email registered'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Phone Number & Verification Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cust.phone ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cust.phone}</span>
                            </div>
                            <div>
                              {cust.isPhoneVerified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Unverified</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No phone attached</span>
                        )}
                      </td>

                      {/* Column 3: Joining Date (`createdAt`) & Last Active (`lastLoginAt`) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Joined: <strong className="text-white">{cust.createdAtFormatted}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Active: <span className="text-slate-300">{cust.lastLoginAtFormatted}</span></span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Lifetime Orders Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                            cust.totalOrders > 0
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                              : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{cust.totalOrders} {cust.totalOrders === 1 ? 'Order' : 'Orders'}</span>
                        </span>
                      </td>

                      {/* Column 5: Total Amount Spent (BDT) */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-black text-sm text-white">
                        ৳{cust.totalSpent.toLocaleString()}
                      </td>

                      {/* Column 6: Wallet Balance (BDT) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-1 font-mono font-black text-xs text-emerald-400">
                            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>৳{cust.walletBalance.toLocaleString()}</span>
                          </div>
                          {cust.hasClaimedYouTubeBonus && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/80 mt-1">
                              <Coins className="w-2.5 h-2.5" />
                              <span>৳20 YT Bonus</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 7: Account Status (Active / Suspended) & Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCustomerStatus(cust);
                            }}
                            disabled={updatingUid === cust.uid}
                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isSuspended
                                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                            }`}
                            title={`Click to ${isSuspended ? 'Activate' : 'Suspend'} account`}
                          >
                            {updatingUid === cust.uid ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isSuspended ? (
                              <UserX className="w-3 h-3 text-rose-400" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                            )}
                            <span className="capitalize">{cust.status}</span>
                          </button>

                          {/* Quick Profile View Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-[#007BFF] text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/80"
                            title="View Lifetime Customer Profile & Orders"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer Info */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong className="text-white">{filteredCustomers.length}</strong> of{' '}
            <strong className="text-white">{customers.length}</strong> total customers
          </span>
          <span className="text-slate-500">
            Real-time synchronization enabled via Firestore Snapshot Listener • Click any row to view full profile & lifetime orders
          </span>
        </div>
      </div>

      {/* Detailed Customer Profile & Lifetime Order History Modal */}
      {selectedCustomer && (
        <AdminCustomerDetailModal
          customer={selectedCustomer}
          orders={orders}
          onClose={() => setSelectedCustomer(null)}
          onToggleStatus={(cust) => {
            handleToggleCustomerStatus(cust);
            setSelectedCustomer((prev) =>
              prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null
            );
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
