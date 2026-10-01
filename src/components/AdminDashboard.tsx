import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
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
  Youtube,
  Tv,
  Bell,
  Crown,
  LayoutDashboard
} from 'lucide-react';
import { Order, Product, Coupon, Seller, SystemBannerSettings, PayoutRequest, UserProfile } from '../types';
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
import { getStoredSession, clearStoredSession, isTokenExpired, SUPER_ADMIN_EMAIL, isSuperAdminEmail } from '../services/authService';
import { BrandLogo } from './BrandLogo';

const DEFAULT_BANNER_SETTINGS: SystemBannerSettings = {
  announcementBadge: '⚡ Flash Offer',
  announcementText: 'Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed',
  helplineNumber: '01883-418309',
  heroHeadline: 'ZeropicBD - Premium Marketplace & Lifestyle',
  heroSubheadline: 'Bangladesh’s Premier Lifestyle & Multi-Vendor Marketplace.',
  flashSaleTag: 'EXCLUSIVE COLLECTION',
  youtubeVideoUrl: 'https://www.youtube.com/watch?v=sU3FkmV9b70',
  youtubeChannelUrl: 'https://www.youtube.com/@zeropicbd',
  youtubeSectionTitle: 'Featured YouTube Videos',
  youtubeSectionSubtitle: 'Watch authentic product unboxings and official showcases.',
  promoBanners: INITIAL_PROMO_BANNERS,
};

export const AUTHORIZED_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
const ADMIN_STORAGE_KEY = 'zeropicbd_admin_session';

export interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  onUpdateOrderNotes?: (orderId: string, notes: string) => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onResetDemoProducts?: () => void;
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
  user,
  orders,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  onUpdateOrderNotes,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onResetDemoProducts,
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
  // Session check with permanent Owner auto-auth
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    // 1. If user is currently logged in with wapp7272@gmail.com, grant absolute owner access immediately!
    if (user && user.isLoggedIn && isSuperAdminEmail(user.email)) {
      return true;
    }

    try {
      const session = getStoredSession();
      if (session && session.role === 'admin' && !isTokenExpired(session.accessToken)) {
        return true;
      }
      const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return isSuperAdminEmail(parsed?.email) && parsed?.authenticated === true;
      }
    } catch {
      return false;
    }
    return false;
  });

  // Automatically update login state if user prop changes to owner
  useEffect(() => {
    if (user && user.isLoggedIn && isSuperAdminEmail(user.email)) {
      setIsAdminLoggedIn(true);
    }
  }, [user]);

  // Login Form States (for manual challenge)
  const [inputEmail, setInputEmail] = useState(user?.email || SUPER_ADMIN_EMAIL);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'products' | 'orders' | 'analytics' | 'inventory' | 'sellers' | 'settlements' | 'banners' | 'coupons' | 'youtube' | 'notifications'
  >('products');

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
            email: SUPER_ADMIN_EMAIL,
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
        showToast('✓ Super Admin session authorized with Bearer token.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        id="admin-modal-container"
        className="relative w-full max-w-7xl my-auto rounded-3xl bg-slate-50 border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* ================= TOP HEADER (Clean Light ZeropicBD Branding) ================= */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0A1B3D] tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-[#007BFF]" />
                  <span>Super Admin Control Center</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span>Absolute Owner</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Permanent Super Admin: <strong className="text-emerald-700 font-bold">{SUPER_ADMIN_EMAIL}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoShop && (
              <button
                id="admin-nav-shop-btn"
                onClick={() => {
                  onClose();
                  onGoShop();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Return to Main Storefront"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#007BFF]" />
                <span className="hidden sm:inline">Storefront</span>
              </button>
            )}

            {isAdminLoggedIn && (
              <button
                id="admin-logout-btn"
                onClick={handleAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Log out of Super Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            <button
              id="admin-close-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close Admin Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= MAIN CONTENT ================= */}
        {!isAdminLoggedIn ? (
          /* ========================================================================= */
          /* 1. SECURE SUPER ADMIN LOGIN CHALLENGE (Light Theme) */
          /* ========================================================================= */
          <div className="p-6 sm:p-12 max-w-md mx-auto w-full my-auto flex flex-col items-center animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#007BFF] mb-5 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-[#0A1B3D] tracking-tight text-center">
              Super Admin Authentication
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6">
              Permanent Owner Access is restricted to <strong className="text-emerald-700 font-mono">{SUPER_ADMIN_EMAIL}</strong>
            </p>

            {loginError && (
              <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder={SUPER_ADMIN_EMAIL}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter password (e.g. admin123)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#007BFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Unlock Super Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 w-full text-center">
              💡 <strong>Quick Access:</strong> Default owner password is <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">admin123</code> or <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">wapp7272</code>.
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. AUTHENTICATED SUPER ADMIN CONTROL PANEL (Light Clean Theme) */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Horizontal Navigation Tabs */}
            <div className="px-5 sm:px-7 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Products & Catalog</span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[#007BFF] text-[10px] font-mono font-bold">
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Order Management</span>
                {pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Overview Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('coupons')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'coupons'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Coupons & Promos</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                  {coupons.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sellers')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'sellers'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Merchants & Settlements</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                  {sellers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('youtube')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'youtube'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>YouTube Showcase</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('banners')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'banners'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Store Banners</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'border-[#007BFF] text-[#007BFF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>SMS & Notifications</span>
              </button>
            </div>

            {/* Scrollable Main Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
              {/* TAB 1: PRODUCT MANAGEMENT */}
              {activeTab === 'products' && (
                <AdminProductsManager
                  products={products}
                  onAddProduct={onAddProduct}
                  onUpdateProduct={onUpdateProduct}
                  onDeleteProduct={onDeleteProduct}
                  onBulkDeleteProducts={onBulkDeleteProducts}
                  onResetDemoProducts={onResetDemoProducts}
                />
              )}

              {/* TAB 2: ORDER MANAGEMENT */}
              {activeTab === 'orders' && (
                <AdminOrdersManager
                  orders={orders}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  onUpdateOrderPaymentStatus={onUpdateOrderPaymentStatus}
                  onUpdateOrderTracking={onUpdateOrderTracking}
                  onUpdateOrderNotes={onUpdateOrderNotes}
                  showToast={showToast}
                />
              )}

              {/* TAB 3: OVERVIEW ANALYTICS */}
              {activeTab === 'analytics' && (
                <AdminOverviewAnalytics
                  orders={orders}
                  products={products}
                  sellers={sellers}
                  commissionRate={effectiveCommissionRate}
                />
              )}

              {/* TAB 4: COUPONS & PROMOS */}
              {activeTab === 'coupons' && (
                <AdminCouponsManager
                  coupons={coupons}
                  onAddCoupon={onAddCoupon}
                  onUpdateCoupon={onUpdateCoupon}
                  onDeleteCoupon={onDeleteCoupon}
                />
              )}

              {/* TAB 5: SELLERS & SETTLEMENTS */}
              {activeTab === 'sellers' && (
                <AdminSettlementsManager
                  sellers={sellers}
                  commissionRate={effectiveCommissionRate}
                  payoutRequests={payoutRequests}
                  onApprovePayout={onApprovePayout || (() => {})}
                  onRejectPayout={onRejectPayout || (() => {})}
                />
              )}

              {/* TAB 6: YOUTUBE SHOWCASE */}
              {activeTab === 'youtube' && (
                <AdminYouTubeManager
                  settings={bannerSettings || DEFAULT_BANNER_SETTINGS}
                  onUpdateSettings={onUpdateBannerSettings || (() => {})}
                  showToast={showToast}
                />
              )}

              {/* TAB 7: BANNERS */}
              {activeTab === 'banners' && (
                <AdminBannersManager
                  settings={bannerSettings || DEFAULT_BANNER_SETTINGS}
                  onUpdateSettings={onUpdateBannerSettings || (() => {})}
                  showToast={showToast}
                />
              )}

              {/* TAB 8: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <AdminNotificationsManager
                  orders={orders}
                  showToast={showToast}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
