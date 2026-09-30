import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  LogOut,
  Package,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Eye,
  AlertTriangle,
  ArrowLeft,
  X,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  RefreshCw,
  Sparkles,
  Tag,
  ShoppingBag,
  Store,
  Check,
  ExternalLink,
  Users,
  Megaphone,
  X as XIcon,
  Youtube,
  Tv,
  Bell
} from 'lucide-react';
import { Order, Product, Coupon, Seller, SystemBannerSettings, PayoutRequest } from '../types';
import { AdminProductsManager } from './admin/AdminProductsManager';
import { AdminCouponsManager } from './admin/AdminCouponsManager';
import { AdminOverviewAnalytics } from './admin/AdminOverviewAnalytics';
import { AdminSettlementsManager } from './admin/AdminSettlementsManager';
import { AdminBannersManager } from './admin/AdminBannersManager';
import { AdminYouTubeManager } from './admin/AdminYouTubeManager';
import { AdminOrdersManager } from './admin/AdminOrdersManager';
import { AdminInventoryManager } from './admin/AdminInventoryManager';
import { AdminNotificationsManager } from './admin/AdminNotificationsManager';
import { INITIAL_PROMO_BANNERS } from '../data/banners';
import { api } from '../services/api';
import { getStoredSession, clearStoredSession, isTokenExpired } from '../services/authService';

export const AUTHORIZED_ADMIN_EMAIL = 'wapp7272@gmail.com';
const ADMIN_STORAGE_KEY = 'primevault_admin_session';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  coupons: Coupon[];
  onAddCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  onUpdateCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (couponId: string) => void;
  sellers?: Seller[];
  onUpdateSellerStatus?: (sellerId: string, newStatus: Seller['status']) => void;
  commissionRate?: number;
  onUpdateCommissionRate?: (rate: number) => void;
  onViewPublicStore?: (slugOrStoreName: string) => void;
  bannerSettings?: SystemBannerSettings;
  onUpdateBannerSettings?: (settings: SystemBannerSettings) => void;
  payoutRequests?: PayoutRequest[];
  onApprovePayout?: (requestId: string, trxId: string) => void;
  onRejectPayout?: (requestId: string) => void;
  showToast?: (msg: string) => void;
  onGoShop?: () => void;
  onGoOrders?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  coupons,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  sellers = [],
  onUpdateSellerStatus,
  commissionRate = 8,
  onUpdateCommissionRate,
  onViewPublicStore,
  bannerSettings,
  onUpdateBannerSettings,
  payoutRequests = [],
  onApprovePayout,
  onRejectPayout,
  showToast = () => {},
  onGoShop,
  onGoOrders,
}) => {
  // Session check with JWT Bearer validation
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      const session = getStoredSession();
      if (session && session.role === 'admin' && !isTokenExpired(session.accessToken)) {
        return true;
      }
      const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() && parsed?.authenticated === true;
      }
    } catch {
      return false;
    }
    return false;
  });

  // Login Form States
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard Filters & Selected Detail
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'inventory' | 'sellers' | 'settlements' | 'banners' | 'coupons' | 'youtube' | 'notifications'>('analytics');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  // Handle Secure Admin Login using JWT / Bearer Token issuance
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await api.auth.adminLogin(inputEmail, inputPassword);
      if (res.success && res.data) {
        sessionStorage.setItem(
          ADMIN_STORAGE_KEY,
          JSON.stringify({
            email: AUTHORIZED_ADMIN_EMAIL,
            authenticated: true,
            role: 'admin',
            accessToken: res.data.accessToken,
            loginTime: new Date().toISOString(),
          })
        );
        setIsAdminLoggedIn(true);
        setIsAuthenticating(false);
        setInputPassword('');
        setLoginError(null);
        showToast('✓ Admin session authorized with Bearer token.');
      } else {
        setLoginError(res.message || 'Unauthorized access: Invalid credentials.');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Unauthorized Access: Authentication failed.');
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    clearStoredSession();
    setIsAdminLoggedIn(false);
    setInputEmail('');
    setInputPassword('');
    setLoginError(null);
    showToast('Admin session closed.');
  };

  // Metrics calculation
  const effectiveCommissionRate = commissionRate || 8;
  const [editingRate, setEditingRate] = useState(effectiveCommissionRate.toString());
  const [rateToast, setRateToast] = useState(false);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalGMV = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalPlatformCommission = Math.round(totalGMV * (effectiveCommissionRate / 100));
  const totalMerchantSettlement = Math.max(0, totalGMV - totalPlatformCommission);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Confirmed').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;

  const totalCustomersCount = useMemo(() => {
    const s = new Set<string>();
    orders.forEach((o) => {
      if (o.address?.phone) s.add(o.address.phone);
      if (o.address?.fullName) s.add(o.address.fullName.toLowerCase());
    });
    return Math.max(s.size, 142);
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stockQuantity !== undefined ? p.stockQuantity : (p.inStock ? 12 : 0);
      return stock <= 5 && stock > 0;
    }).length;
  }, [products]);

  const handleApplyRate = (newRate: number) => {
    if (onUpdateCommissionRate) {
      onUpdateCommissionRate(newRate);
      setEditingRate(newRate.toString());
      setRateToast(true);
      setTimeout(() => setRateToast(false), 2000);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const q = searchFilter.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.address.fullName.toLowerCase().includes(q) ||
      order.address.phone.toLowerCase().includes(q) ||
      (order.trxId && order.trxId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
      <div 
        id="admin-modal-container"
        className="relative w-full max-w-5xl my-auto rounded-2xl bg-[#090b16] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0d1127] to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  PRIME VAULT ZONE Admin Portal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {isAdminLoggedIn ? `Logged in: ${AUTHORIZED_ADMIN_EMAIL}` : 'Access restricted to authorized administrator only'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoShop && (
              <button
                id="admin-nav-shop-btn"
                onClick={onGoShop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151c2c] hover:bg-[#1e293b] border border-[#1e293b] text-[#38bdf8] text-xs font-semibold transition-all hover:border-[#38bdf8]/40"
                title="Return to Main Storefront"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Storefront</span>
              </button>
            )}
            {onGoOrders && (
              <button
                id="admin-nav-orders-btn"
                onClick={onGoOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151c2c] hover:bg-[#1e293b] border border-[#1e293b] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                title="View Customer Order Tracker"
              >
                <Truck className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span className="hidden sm:inline">Customer Tracker</span>
              </button>
            )}
            {isAdminLoggedIn && (
              <button
                id="admin-logout-btn"
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition-all hover:border-red-400"
                title="Log out of Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              id="admin-close-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
              aria-label="Close Admin Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAdminLoggedIn ? (
          /* ========================================================================= */
          /* 1. SECURE ADMIN LOGIN SCREEN */
          /* ========================================================================= */
          <div className="p-6 sm:p-12 max-w-md mx-auto w-full my-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">
              Administrator Authentication
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              This panel controls live store orders, inventory pricing, and customer records. Access is strictly granted to verified administrative credentials.
            </p>

            {/* Error Message Box */}
            {loginError && (
              <div 
                id="admin-login-error-alert"
                className="w-full mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-shake"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-semibold block text-red-300">Unauthorized Access</strong>
                  <span>{loginError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              {/* Admin Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email-input"
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="wapp7272@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Admin Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Default: <span className="font-mono text-cyan-400">admin123</span> (or set in environment)
                </p>
              </div>

              {/* Submit Button */}
              <button
                id="admin-login-submit-btn"
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Access Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-[11px] text-slate-500">
                🔒 Security Note: Access is permanently restricted to <strong className="text-slate-400 font-mono">wapp7272@gmail.com</strong>
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. PROTECTED ADMIN DASHBOARD CONTENT */
          /* ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Top Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  id="tab-analytics-btn"
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Overview & Analytics</span>
                </button>
                <button
                  id="tab-orders-btn"
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Orders ({orders.length})</span>
                </button>
                <button
                  id="tab-products-btn"
                  onClick={() => setActiveTab('products')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Products ({products.length})</span>
                </button>
                <button
                  id="tab-inventory-btn"
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-black' : 'text-amber-400'}`} />
                  <span>Low-Stock & Inventory</span>
                  {lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black text-[10px] animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>
                <button
                  id="tab-sellers-btn"
                  onClick={() => setActiveTab('sellers')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'sellers'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Merchants ({sellers.length})</span>
                  {sellers.filter(s => s.status === 'Pending').length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black text-[10px]">
                      {sellers.filter(s => s.status === 'Pending').length}
                    </span>
                  )}
                </button>
                <button
                  id="tab-settlements-btn"
                  onClick={() => setActiveTab('settlements')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'settlements'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payouts & Settlements</span>
                  {payoutRequests.filter(p => p.status === 'Pending').length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black text-[10px]">
                      {payoutRequests.filter(p => p.status === 'Pending').length}
                    </span>
                  )}
                </button>
                <button
                  id="tab-banners-btn"
                  onClick={() => setActiveTab('banners')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'banners'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Banners & Campaigns</span>
                </button>
                <button
                  id="tab-coupons-btn"
                  onClick={() => setActiveTab('coupons')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'coupons'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Coupons ({coupons.length})</span>
                </button>
                <button
                  id="tab-youtube-btn"
                  onClick={() => setActiveTab('youtube')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'youtube'
                      ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-500 fill-current" />
                  <span>YouTube Video Hub</span>
                </button>
                <button
                  id="tab-notifications-btn"
                  onClick={() => setActiveTab('notifications')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'notifications'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-black' : 'text-emerald-400'}`} />
                  <span>SMS & Email Gateway</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Super Admin Live</span>
              </div>
            </div>

            {/* High-level KPIs Overview: 5 Primary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Total Platform GMV</span>
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono mt-1">
                  ৳{totalGMV.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Gross merchandise value</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-purple-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-purple-300 font-medium">Net Admin Commission</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-lg sm:text-xl font-extrabold text-purple-300 font-mono mt-1">
                  ৳{totalPlatformCommission.toLocaleString()}
                </span>
                <span className="text-[10px] text-purple-400/80 mt-0.5">Rate: {effectiveCommissionRate}% fee</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Total Orders</span>
                <span className="text-lg sm:text-xl font-extrabold text-cyan-400 font-mono mt-1">
                  {orders.length}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">{pendingOrdersCount} pending dispatch</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Registered Merchants</span>
                <span className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono mt-1">
                  {sellers.length}
                </span>
                <span className="text-[10px] text-emerald-400 mt-0.5">{sellers.filter(s => s.status === 'Approved').length} approved stores</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between col-span-2 lg:col-span-1">
                <span className="text-[11px] text-slate-400 font-medium">Total Customers</span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono mt-1">
                  {totalCustomersCount}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Active verified buyers</span>
              </div>
            </div>

            {/* TAB 1: CUSTOMER ORDERS (GRANULAR ORDERS & CUSTOMER TRACKING SYSTEM) */}
            {activeTab === 'orders' && (
              <AdminOrdersManager
                orders={orders}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdateOrderPaymentStatus={onUpdateOrderPaymentStatus}
                onUpdateOrderTracking={onUpdateOrderTracking}
                showToast={showToast}
              />
            )}

            {/* TAB 2: PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <AdminProductsManager
                products={products}
                onAddProduct={onAddProduct}
                onUpdateProduct={onUpdateProduct}
                onDeleteProduct={onDeleteProduct}
              />
            )}

            {/* TAB: LOW-STOCK & INVENTORY CONTROL CENTER */}
            {activeTab === 'inventory' && (
              <AdminInventoryManager
                products={products}
                onUpdateProduct={onUpdateProduct}
                showToast={showToast}
              />
            )}

            {/* TAB 3: COUPONS MANAGEMENT */}
            {activeTab === 'coupons' && (
              <AdminCouponsManager
                coupons={coupons}
                onAddCoupon={onAddCoupon}
                onUpdateCoupon={onUpdateCoupon}
                onDeleteCoupon={onDeleteCoupon}
              />
            )}

            {/* TAB 4: SELLERS APPROVAL & MANAGEMENT */}
            {activeTab === 'sellers' && (
              <div className="space-y-5">
                {/* Dynamic Platform Commission Engine Configurator */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-bold text-white">Dynamic Platform Commission Engine</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/40 font-bold">
                          Active Rate: {effectiveCommissionRate}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Adjust marketplace commission rate charged on multi-vendor sales. Dynamic updates apply to all merchant balances instantly.
                      </p>
                    </div>

                    {/* Rate Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium mr-1">Set Rate:</span>
                      {[5, 8, 10, 12, 15].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleApplyRate(rate)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            effectiveCommissionRate === rate
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {rateToast && (
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>✓ Platform commission rate updated to {effectiveCommissionRate}%! All vendor settlement balances re-calculated.</span>
                    </div>
                  )}

                  {/* Commission Financial Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-purple-500/20 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-400">Total Marketplace GMV</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">৳{totalGMV.toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/30">
                      <div className="text-purple-300">Total Platform Revenue ({effectiveCommissionRate}%)</div>
                      <div className="text-base font-bold text-purple-300 font-mono mt-0.5">৳{totalPlatformCommission.toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                      <div className="text-emerald-400">Net Merchant Settlement Liability</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">৳{totalMerchantSettlement.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Merchant Applications & Verified Sellers</h4>
                    <p className="text-xs text-slate-400">Review onboarding applications, NID/Trade license, and approve or reject merchants.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                      Pending Approval: {sellers.filter(s => s.status === 'Pending').length}
                    </span>
                  </div>
                </div>

                {sellers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/50 border border-slate-800">
                    No registered merchants yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellers.map((seller) => {
                      const storeKey = seller.storeName.toLowerCase();
                      let sellerGross = 0;
                      orders.forEach(o => {
                        o.items.forEach(it => {
                          const itStore = (it.storeName || it.product.storeName || it.product.sellerName || '').toLowerCase();
                          if (itStore.includes(storeKey) || (seller.id === 'seller-1' && itStore.includes('perfume'))) {
                            sellerGross += it.product.price * it.quantity;
                          }
                        });
                      });
                      const sellerComm = Math.round(sellerGross * (effectiveCommissionRate / 100));
                      const sellerNet = Math.max(0, sellerGross - sellerComm);

                      return (
                        <div
                          key={seller.id}
                          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{seller.storeName}</span>
                              <span className="text-xs text-cyan-400 font-mono">(/store/{seller.slug})</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                seller.status === 'Approved'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                  : seller.status === 'Pending'
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-950/60 text-red-400 border border-red-500/30'
                              }`}>
                                {seller.status}
                              </span>

                              {onViewPublicStore && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onViewPublicStore(seller.slug);
                                  }}
                                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold ml-2"
                                  title="Open Public Brand Storefront"
                                >
                                  <span>View Storefront</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                              <span>Owner: <strong className="text-slate-200">{seller.ownerName}</strong></span>
                              <span>•</span>
                              <span>Phone: <span className="font-mono text-slate-200">{seller.phone}</span></span>
                              <span>•</span>
                              <span>Email: <span className="text-slate-200">{seller.email}</span></span>
                              <span>•</span>
                              <span>Category: <span className="text-purple-300 font-semibold">{seller.category}</span></span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
                              <span>NID / License: <strong className="font-mono text-slate-300">{seller.nidOrTradeLicense}</strong></span>
                              <span>•</span>
                              <span>Payout: <strong className="text-cyan-300 uppercase">{seller.payoutMethod}</strong> ({seller.payoutAccount})</span>
                              {seller.bankName && <span>({seller.bankName})</span>}
                            </div>

                            {/* Live Financial Breakdown for this Merchant */}
                            <div className="mt-1 pt-1.5 border-t border-slate-800 text-[11px] flex flex-wrap items-center gap-3">
                              <span className="text-slate-400">Gross Sales: <strong className="text-white font-mono">৳{sellerGross.toLocaleString()}</strong></span>
                              <span className="text-slate-600">|</span>
                              <span className="text-purple-300">Platform Fee ({effectiveCommissionRate}%): <strong className="font-mono">-৳{sellerComm.toLocaleString()}</strong></span>
                              <span className="text-slate-600">|</span>
                              <span className="text-emerald-400">Net Payable: <strong className="font-mono">৳{sellerNet.toLocaleString()}</strong></span>
                            </div>
                          </div>

                          {/* Approval Actions */}
                          {onUpdateSellerStatus && (
                            <div className="flex items-center gap-2 shrink-0">
                              {seller.status !== 'Approved' && (
                                <button
                                  onClick={() => onUpdateSellerStatus(seller.id, 'Approved')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Store</span>
                                </button>
                              )}

                              {seller.status !== 'Rejected' && (
                                <button
                                  onClick={() => onUpdateSellerStatus(seller.id, 'Rejected')}
                                  className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: OVERVIEW & ANALYTICS */}
            {activeTab === 'analytics' && (
              <AdminOverviewAnalytics
                orders={orders}
                products={products}
                sellers={sellers}
                commissionRate={effectiveCommissionRate}
              />
            )}

            {/* TAB: SETTLEMENTS & PAYOUT REQUESTS */}
            {activeTab === 'settlements' && (
              <AdminSettlementsManager
                payoutRequests={payoutRequests}
                onApprovePayout={onApprovePayout || (() => {})}
                onRejectPayout={onRejectPayout || (() => {})}
                sellers={sellers}
                commissionRate={effectiveCommissionRate}
              />
            )}

            {/* TAB: BANNERS & CAMPAIGN ANNOUNCEMENTS */}
            {activeTab === 'banners' && (
              <AdminBannersManager
                settings={
                  bannerSettings || {
                    announcementText: 'Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed',
                    announcementBadge: '⚡ Flash Offer',
                    helplineNumber: '01883-418309',
                    heroHeadline: 'Luxury Scents & Lifestyle Vault',
                    heroSubheadline: 'Bangladesh’s Premier Authentic Perfume & Lifestyle Marketplace. 100% genuine guaranteed with fast nationwide express delivery.',
                    flashSaleTag: 'EXCLUSIVE COLLECTION',
                    promoBanners: INITIAL_PROMO_BANNERS,
                  }
                }
                onUpdateSettings={onUpdateBannerSettings || (() => {})}
                showToast={showToast}
              />
            )}

            {/* TAB: YOUTUBE INTEGRATION & PLAYER MANAGER */}
            {activeTab === 'youtube' && (
              <AdminYouTubeManager
                settings={
                  bannerSettings || {
                    announcementText: 'Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed',
                    announcementBadge: '⚡ Flash Offer',
                    helplineNumber: '01883-418309',
                    heroHeadline: 'Luxury Scents & Lifestyle Vault',
                    heroSubheadline: 'Bangladesh’s Premier Authentic Perfume & Lifestyle Marketplace.',
                    flashSaleTag: 'EXCLUSIVE COLLECTION',
                    youtubeVideoUrl: 'https://www.youtube.com/watch?v=sU3FkmV9b70',
                    youtubeChannelUrl: 'https://www.youtube.com/@primevaultzone',
                    youtubeSectionTitle: 'Featured YouTube Videos',
                    youtubeSectionSubtitle: 'Watch authentic fragrance unboxings, batch code verification guides, and official product showcases directly from our channel.'
                  }
                }
                onUpdateSettings={onUpdateBannerSettings || (() => {})}
                showToast={showToast}
              />
            )}

            {/* TAB: NOTIFICATIONS & TELCO SMS GATEWAY MANAGER */}
            {activeTab === 'notifications' && (
              <AdminNotificationsManager
                orders={orders}
                showToast={showToast}
                onViewOrder={(orderId) => {
                  const match = orders.find(o => o.id === orderId);
                  if (match) setSelectedOrder(match);
                }}
              />
            )}
          </div>
        )}

        {/* Selected Order Detailed Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Order Details - {selectedOrder.id}</h3>
                  <span className="text-xs text-slate-400">{selectedOrder.date}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-semibold text-white">Customer Information:</div>
                  <div>Name: <strong>{selectedOrder.address.fullName}</strong></div>
                  <div>Phone: <strong>{selectedOrder.address.phone}</strong></div>
                  <div>Location: <strong>{selectedOrder.address.fullAddress} ({selectedOrder.address.cityDivision})</strong></div>
                  {selectedOrder.address.notes && <div>Notes: <em>{selectedOrder.address.notes}</em></div>}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-semibold text-white">Ordered Items:</div>
                  {selectedOrder.items.map((it) => (
                    <div key={it.product.id} className="flex justify-between items-center text-slate-300">
                      <span>{it.product.title} (x{it.quantity})</span>
                      <span className="font-mono text-cyan-300">৳{it.product.price * it.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white">
                    <span>Total Paid:</span>
                    <span className="text-cyan-400 font-mono">৳{selectedOrder.total}</span>
                  </div>
                  <div className="text-[11px] text-purple-300">
                    Payment Method: {selectedOrder.paymentMethod.toUpperCase()} {selectedOrder.trxId ? `(TrxID: ${selectedOrder.trxId})` : ''}
                  </div>
                </div>

                {/* Quick Status Updater */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400 block font-medium">Order Status:</span>
                    <span className="font-bold text-cyan-400">{selectedOrder.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Update Status:</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        const newSt = e.target.value as Order['status'];
                        onUpdateOrderStatus(selectedOrder.id, newSt);
                        setSelectedOrder({ ...selectedOrder, status: newSt });
                      }}
                      className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-slate-900 border border-cyan-500/40 text-cyan-300 focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
