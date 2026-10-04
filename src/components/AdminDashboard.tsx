import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Boxes,
  Tag,
  Megaphone,
  Wallet,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  LogOut,
  Bell,
  ShieldCheck,
  Crown,
  Youtube,
  Coins,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  Order,
  Product,
  Coupon,
  Seller,
  SystemBannerSettings,
  PayoutRequest,
  UserProfile,
} from '../types';
import { AdminOverviewAnalytics } from './admin/AdminOverviewAnalytics';
import { AdminOrdersManager } from './admin/AdminOrdersManager';
import { AdminProductsManager } from './admin/AdminProductsManager';
import { AdminInventoryManager } from './admin/AdminInventoryManager';
import { AdminCouponsManager } from './admin/AdminCouponsManager';
import { AdminBannersManager } from './admin/AdminBannersManager';
import { AdminYouTubeManager } from './admin/AdminYouTubeManager';
import { AdminBonusRequestsManager } from './admin/AdminBonusRequestsManager';
import { AdminSettlementsManager } from './admin/AdminSettlementsManager';
import { AdminNotificationsManager } from './admin/AdminNotificationsManager';
import { AdminCustomersManager } from './admin/AdminCustomersManager';
import { AdminSettingsManager } from './admin/AdminSettingsManager';
import { INITIAL_PROMO_BANNERS } from '../data/banners';
import { SUPER_ADMIN_EMAIL } from '../services/authService';
import { BrandLogo, Logo } from './Logo';

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'products'
  | 'inventory'
  | 'categories_coupons'
  | 'marketing'
  | 'finance'
  | 'settings';

const DEFAULT_BANNER_SETTINGS: SystemBannerSettings = {
  announcementBadge: '⚡ Flash Offer',
  announcementText: 'Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed',
  helplineNumber: '01883-418309',
  heroHeadline: 'Kroyghor (ক্রয় ঘর) - Premium Lifestyle & Marketplace',
  heroSubheadline: 'Bangladesh’s Premier Lifestyle & Multi-Vendor Marketplace.',
  flashSaleTag: 'EXCLUSIVE COLLECTION',
  youtubeVideoUrl: 'https://www.youtube.com/watch?v=sU3FkmV9b70',
  youtubeChannelUrl: 'https://www.youtube.com/@kroy-ghor-office',
  youtubeSectionTitle: 'Featured YouTube Videos',
  youtubeSectionSubtitle: 'Watch authentic product unboxings and official showcases.',
  promoBanners: INITIAL_PROMO_BANNERS,
};

export interface AdminDashboardProps {
  user?: UserProfile;
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  onUpdateOrderNotes?: (orderId: string, notes: string) => void;
  products?: Product[];
  onAddProduct?: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onResetDemoProducts?: () => void;
  coupons?: Coupon[];
  onAddCoupon?: (coupon: Omit<Coupon, 'id'>) => void;
  onUpdateCoupon?: (coupon: Coupon) => void;
  onDeleteCoupon?: (couponId: string) => void;
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
  onLogout?: () => void;
  onClose?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  orders = [],
  onUpdateOrderStatus = () => {},
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  onUpdateOrderNotes,
  products = [],
  onAddProduct = () => {},
  onUpdateProduct = () => {},
  onDeleteProduct = () => {},
  onBulkDeleteProducts,
  onResetDemoProducts,
  coupons = [],
  onAddCoupon = () => {},
  onUpdateCoupon = () => {},
  onDeleteCoupon = () => {},
  sellers = [],
  onUpdateSellerStatus,
  commissionRate = 8,
  onUpdateCommissionRate,
  onViewPublicStore,
  bannerSettings = DEFAULT_BANNER_SETTINGS,
  onUpdateBannerSettings,
  payoutRequests = [],
  onApprovePayout,
  onRejectPayout,
  showToast = () => {},
  onGoShop,
  onGoOrders,
  onLogout,
  onClose,
}) => {
  // Navigation Section State
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Marketing sub-tab
  const [marketingSubTab, setMarketingSubTab] = useState<'banners' | 'youtube' | 'bonus' | 'notifications'>('banners');

  // Search state
  const [topSearch, setTopSearch] = useState('');

  // Counts for badges
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length,
    [orders]
  );

  const navItems = [
    {
      id: 'dashboard' as AdminSection,
      label: 'ড্যাশবোর্ড (Dashboard)',
      subtitle: 'Overview & Analytics',
      icon: LayoutDashboard,
    },
    {
      id: 'orders' as AdminSection,
      label: 'অর্ডারসমূহ (Orders)',
      subtitle: 'Orders & Statuses',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-900',
    },
    {
      id: 'customers' as AdminSection,
      label: 'গ্রাহক তালিকা (Customers)',
      subtitle: 'Directory & Lifetime Profiles',
      icon: Users,
    },
    {
      id: 'products' as AdminSection,
      label: 'পণ্য তালিকা (Products)',
      subtitle: 'Catalog & Media',
      icon: Package,
      badge: products.length,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'inventory' as AdminSection,
      label: 'ইনভেন্টরি (Inventory)',
      subtitle: 'Stock & Thresholds',
      icon: Boxes,
    },
    {
      id: 'categories_coupons' as AdminSection,
      label: 'কুপন ও ক্যাটাগরি (Coupons)',
      subtitle: 'Discounts & Promos',
      icon: Tag,
      badge: coupons.length,
      badgeColor: 'bg-slate-700 text-slate-300',
    },
    {
      id: 'marketing' as AdminSection,
      label: 'মার্কেটিং (Marketing)',
      subtitle: 'Campaigns, YouTube & Bonus',
      icon: Megaphone,
    },
    {
      id: 'finance' as AdminSection,
      label: 'ফাইন্যান্স (Finance)',
      subtitle: 'Transactions & Payouts',
      icon: Wallet,
    },
    {
      id: 'settings' as AdminSection,
      label: 'সেটিংস (Settings)',
      subtitle: 'Delivery & Config',
      icon: Settings,
    },
  ];

  const handleNavClick = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnHome = () => {
    if (onGoShop) onGoShop();
    else if (onClose) onClose();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else if (onClose) onClose();
    else if (onGoShop) onGoShop();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* ========================================================================= */}
      {/* TOP BAR */}
      {/* ========================================================================= */}
      <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Mobile Toggle & Brand/Section info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReturnHome}
              className="hidden sm:inline-flex focus:outline-none cursor-pointer group"
              title="Return to Storefront"
            >
              <Logo variant="full" theme="dark" size="sm" />
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-800" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-tight uppercase">
                  {navItems.find((n) => n.id === activeSection)?.label}
                </span>
                <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {navItems.find((n) => n.id === activeSection)?.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Quick Filter/Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search orders, items, customers..."
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all"
            />
          </div>
        </div>

        {/* Right: Quick actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* View Storefront button */}
          <button
            type="button"
            onClick={handleReturnHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-xs"
            title="Return to Public Storefront"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#007BFF]" />
            <span className="hidden sm:inline">Storefront</span>
          </button>

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-extrabold text-white text-[11px] leading-tight truncate max-w-[120px]">
                {user?.email || SUPER_ADMIN_EMAIL}
              </p>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                Owner
              </span>
            </div>
          </div>

          {/* Exit / Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Log out and Exit Admin Panel"
            aria-label="Log out and Exit Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BODY WITH FIXED SIDEBAR & MAIN CONTENT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= FIXED COLLAPSIBLE SIDEBAR ================= */}
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
          />
        )}

        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0 ${
            isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
          } ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          {/* Sidebar Top: Logo & Collapse button */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
            {/* Collapsed vs Expanded Logo */}
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={handleReturnHome}
                className="mx-auto focus:outline-none cursor-pointer group p-1"
                title="Go to Kroyghor Storefront"
              >
                <Logo variant="icon" theme="dark" size="md" />
              </button>
            ) : (
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  type="button"
                  onClick={handleReturnHome}
                  className="focus:outline-none cursor-pointer text-left block group"
                  title="Go to Kroyghor Storefront"
                >
                  <Logo variant="full" theme="dark" size="md" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 p-1.5 rounded transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? '▶' : '◀'}
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group relative ${
                    isActive
                      ? 'bg-[#007BFF] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  
                  {!isSidebarCollapsed && (
                    <div className="flex-1 text-left flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono shrink-0 ml-1.5 ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {isSidebarCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-slate-800">
            {!isSidebarCollapsed ? (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                <p className="font-bold text-slate-300">Dedicated Route:</p>
                <code className="text-emerald-400 text-[10px] font-mono">/admin</code>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReturnHome}
                className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                title="Return Home"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 1. DASHBOARD OVERVIEW & ANALYTICS */}
            {activeSection === 'dashboard' && (
              <AdminOverviewAnalytics
                orders={orders}
                products={products}
                sellers={sellers}
                commissionRate={commissionRate}
              />
            )}

            {/* 2. ORDERS MANAGEMENT */}
            {activeSection === 'orders' && (
              <AdminOrdersManager
                orders={orders}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdateOrderPaymentStatus={onUpdateOrderPaymentStatus}
                onUpdateOrderTracking={onUpdateOrderTracking}
                onUpdateOrderNotes={onUpdateOrderNotes}
                showToast={showToast}
              />
            )}

            {/* 3. CUSTOMERS DIRECTORY & LIFETIME PROFILES */}
            {activeSection === 'customers' && (
              <AdminCustomersManager orders={orders} showToast={showToast} />
            )}

            {/* 4. PRODUCTS CATALOG & MEDIA */}
            {activeSection === 'products' && (
              <AdminProductsManager
                products={products}
                onAddProduct={onAddProduct}
                onUpdateProduct={onUpdateProduct}
                onDeleteProduct={onDeleteProduct}
                onBulkDeleteProducts={onBulkDeleteProducts}
                onResetDemoProducts={onResetDemoProducts}
              />
            )}

            {/* 5. INVENTORY & STOCK TRACKING */}
            {activeSection === 'inventory' && (
              <AdminInventoryManager
                products={products}
                onUpdateProduct={onUpdateProduct}
                showToast={showToast}
              />
            )}

            {/* 6. CATEGORIES & COUPONS */}
            {activeSection === 'categories_coupons' && (
              <AdminCouponsManager
                coupons={coupons}
                onAddCoupon={onAddCoupon}
                onUpdateCoupon={onUpdateCoupon}
                onDeleteCoupon={onDeleteCoupon}
              />
            )}

            {/* 7. MARKETING & BANNERS (Sub-tabs for Campaigns/Durga Puja, YouTube, Bonus Requests, SMS) */}
            {activeSection === 'marketing' && (
              <div className="space-y-6">
                {/* Marketing Sub-nav */}
                <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {[
                    { key: 'banners', label: 'Store Banners & Campaigns', icon: Megaphone },
                    { key: 'youtube', label: 'YouTube Video Hub', icon: Youtube },
                    { key: 'bonus', label: 'YouTube Bonus Claims', icon: Coins },
                    { key: 'notifications', label: 'SMS & Notifications', icon: Bell },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => setMarketingSubTab(sub.key as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                          marketingSubTab === sub.key
                            ? 'bg-[#007BFF] text-white shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>

                {marketingSubTab === 'banners' && (
                  <AdminBannersManager
                    settings={bannerSettings}
                    onUpdateSettings={onUpdateBannerSettings || (() => {})}
                    showToast={showToast}
                  />
                )}

                {marketingSubTab === 'youtube' && (
                  <AdminYouTubeManager
                    settings={bannerSettings}
                    onUpdateSettings={onUpdateBannerSettings || (() => {})}
                    showToast={showToast}
                  />
                )}

                {marketingSubTab === 'bonus' && (
                  <AdminBonusRequestsManager showToast={showToast} />
                )}

                {marketingSubTab === 'notifications' && (
                  <AdminNotificationsManager orders={orders} showToast={showToast} />
                )}
              </div>
            )}

            {/* 8. FINANCE & WALLET */}
            {activeSection === 'finance' && (
              <AdminSettlementsManager
                sellers={sellers}
                commissionRate={commissionRate}
                payoutRequests={payoutRequests}
                onApprovePayout={onApprovePayout || (() => {})}
                onRejectPayout={onRejectPayout || (() => {})}
              />
            )}

            {/* 9. SETTINGS & DELIVERY CONFIG */}
            {activeSection === 'settings' && (
              <AdminSettingsManager
                user={user}
                commissionRate={commissionRate}
                onUpdateCommissionRate={onUpdateCommissionRate}
                bannerSettings={bannerSettings}
                onUpdateBannerSettings={onUpdateBannerSettings}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
