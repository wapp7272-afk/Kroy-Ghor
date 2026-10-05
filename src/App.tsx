import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Truck, 
  Gift, 
  ShoppingBag, 
  Flame,
  ArrowRight, 
  Heart,
  Award,
  Clock,
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Video,
  Store,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { Product, CartItem, UserProfile, Address, Order, Coupon, ActivePage, Seller, SystemBannerSettings, PayoutRequest, WalletTransaction, CatalogFilterState, SortOption, ReturnRequest } from './types';
import { PRODUCTS, CATEGORIES } from './data/products';
import { INITIAL_COUPONS } from './data/coupons';
import { 
  INITIAL_FILTER_STATE,
  DEPARTMENT_OPTIONS,
  SORT_OPTIONS,
  countActiveFilters,
  FilterSidebarContent,
  MobileFilterDrawer,
  ActiveFilterChips
} from './components/ProductCatalogFilter';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductCard } from './components/ProductCard';
import { HeroSection } from './components/HeroSection';
import { CategoryNavGrid } from './components/CategoryNavGrid';
import { INITIAL_PROMO_BANNERS } from './data/banners';
import { 
  subscribeCampaignBanner, 
  DEFAULT_CAMPAIGN_BANNER 
} from './services/campaignBannerService';
import { CampaignBannerConfig } from './types';
import { triggerOrderNotifications } from './utils/notificationService';
import { api } from './services/api';
import {
  createSession,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  isTokenExpiringSoon,
  checkIsAdmin,
  checkIsSeller,
  checkIsSuperAdmin,
  seedSuperAdminAccount,
  SUPER_ADMIN_EMAIL,
  isSuperAdminEmail,
} from './services/authService';
import {
  isFirebaseConfigured,
  checkGoogleRedirectResult,
  firebaseSignOut,
  getUserRoleFromFirestore,
  syncUserDocumentInFirestore,
  db,
  auth,
} from './lib/firebaseAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { UserRole } from './types';
import { AdminRoute } from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import {
  saveOrderToFirestore,
  getUserOrdersFromFirestore,
  getAllOrdersFromFirestore,
  deductUserWalletInFirestore,
  subscribeToAllOrdersFromFirestore,
  subscribeToUserOrdersFromFirestore,
} from './services/orderFirestoreService';
import {
  isDemoOrder,
  purgeAllDemoAndMockData,
} from './services/maintenanceService';
import {
  subscribeToProductsFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  bulkDeleteProductsFromFirestore,
  getLocalProducts,
} from './services/productFirestoreService';
import { HeroBannerSlider } from './components/HeroBannerSlider';
import { 
  subscribeBannersFromFirestore, 
  PromoSlideBanner, 
  INITIAL_SLIDER_BANNERS 
} from './services/bannerService';

// Code-split heavy secondary views, below-the-fold sections, drawers, modals, and admin components with React.lazy
const SortModal = lazy(() => import('./components/SortProducts').then((m) => ({ default: m.SortProducts })));
const StorefrontCampaignBanner = lazy(() => import('./components/StorefrontCampaignBanner').then((m) => ({ default: m.StorefrontCampaignBanner })));
const FlashSaleSection = lazy(() => import('./components/FlashSaleSection').then((m) => ({ default: m.FlashSaleSection })));
const YouTubeBonusBanner = lazy(() => import('./components/YouTubeBonusBanner').then((m) => ({ default: m.YouTubeBonusBanner })));
const TrustValueProposition = lazy(() => import('./components/TrustValueProposition').then((m) => ({ default: m.TrustValueProposition })));
const Footer = lazy(() => import('./components/Footer').then((m) => ({ default: m.Footer })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then((m) => ({ default: m.CartDrawer })));
const PwaInstallBanner = lazy(() => import('./components/PwaInstallBanner').then((m) => ({ default: m.PwaInstallBanner })));

const CheckoutPage = lazy(() => import('./components/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CustomerProfileView = lazy(() => import('./components/UserProfile').then((m) => ({ default: m.UserProfile })));
const OrderTrackingPortal = lazy(() => import('./components/OrderTrackingPortal').then((m) => ({ default: m.OrderTrackingPortal })));
const SellerCenterView = lazy(() => import('./components/SellerCenterView').then((m) => ({ default: m.SellerCenterView })));
const PublicSellerStoreView = lazy(() => import('./components/PublicSellerStoreView').then((m) => ({ default: m.PublicSellerStoreView })));
const ProductDetailView = lazy(() => import('./components/ProductDetailView').then((m) => ({ default: m.ProductDetailView })));
const ProductDetailsModal = lazy(() => import('./components/ProductDetailsModal').then((m) => ({ default: m.ProductDetailsModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const CustomerSupport = lazy(() => import('./components/CustomerSupport').then((m) => ({ default: m.CustomerSupport })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const InvoiceModal = lazy(() => import('./components/InvoiceModal').then((m) => ({ default: m.InvoiceModal })));
const ReturnPolicyModal = lazy(() => import('./components/ReturnPolicyModal').then((m) => ({ default: m.ReturnPolicyModal })));
const FaqModal = lazy(() => import('./components/FaqModal').then((m) => ({ default: m.FaqModal })));
const YouTubeBonusModal = lazy(() => import('./components/YouTubeBonusModal').then((m) => ({ default: m.YouTubeBonusModal })));

// Accessible Suspense Fallback Loader
const ModalSuspenseFallback = () => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn" 
    role="status" 
    aria-label="Loading modal interface..."
  >
    <div className="p-6 rounded-2xl bg-white shadow-2xl flex flex-col items-center gap-3 border border-slate-200 min-w-[200px]">
      <div className="w-9 h-9 border-3 border-[#5B21B6] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-800 tracking-wide">Loading module...</span>
    </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-pulse" aria-hidden="true">
    <div className="h-6 bg-slate-200 rounded-md w-48 mb-4" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="h-44 bg-slate-100 rounded-xl" />
      <div className="h-44 bg-slate-100 rounded-xl" />
      <div className="h-44 bg-slate-100 rounded-xl" />
      <div className="h-44 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

export default function App() {
  // State: Active Navigation Routing (Supports dedicated full-page /admin and /checkout routes)
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin') return 'Admin';
      if (window.location.pathname === '/checkout') return 'Checkout';
    }
    return 'Home';
  });

  // Dedicated /admin & /checkout route browser history & popstate listener
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/admin') {
          setActivePage('Admin');
        } else if (window.location.pathname === '/checkout') {
          setActivePage('Checkout');
        } else if (activePage === 'Admin' || activePage === 'Checkout') {
          setActivePage('Home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activePage]);

  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>('perfume-vault-bd');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSortDropdownOpen]);

  // Dynamic Slider Banners State (Admin Controlled)
  const [sliderBanners, setSliderBanners] = useState<PromoSlideBanner[]>(INITIAL_SLIDER_BANNERS);

  useEffect(() => {
    const unsubscribe = subscribeBannersFromFirestore((data) => {
      if (data && data.length > 0) {
        setSliderBanners(data);
      }
    });
    return () => unsubscribe();
  }, []);

  // State: Dynamic Platform Commission Rate (Configurable: Default 8%)
  const [commissionRate, setCommissionRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_commission_rate') || localStorage.getItem('primevault_commission_rate');
      return saved ? parseFloat(saved) : 8;
    } catch {
      return 8;
    }
  });

  const handleUpdateCommissionRate = (newRate: number) => {
    setCommissionRate(newRate);
    try {
      localStorage.setItem('zeropicbd_commission_rate', newRate.toString());
    } catch {}
    api.settings.updateCommissionRate(newRate).catch(() => {});
    showToast(`⚡ Platform commission rate set to ${newRate}%!`);
  };

  // State: System Banner & Announcement Settings
  const [bannerSettings, setBannerSettings] = useState<SystemBannerSettings>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_banner_settings') || localStorage.getItem('primevault_banner_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          promoBanners: parsed.promoBanners && parsed.promoBanners.length > 0 ? parsed.promoBanners : INITIAL_PROMO_BANNERS,
        };
      }
    } catch {}
    return {
      announcementBadge: '⚡ Flash Offer',
      announcementText: 'Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed',
      helplineNumber: '01883-418309',
      heroHeadline: 'Luxury Scents & Lifestyle Vault',
      heroSubheadline: 'Bangladesh’s Premier Authentic Perfume & Lifestyle Marketplace. 100% genuine guaranteed with fast nationwide express delivery.',
      flashSaleTag: 'EXCLUSIVE COLLECTION',
      youtubeVideoUrl: 'https://www.youtube.com/watch?v=sU3FkmV9b70',
      youtubeChannelUrl: 'https://www.youtube.com/@zeropicbd',
      youtubeSectionTitle: 'Featured YouTube Videos',
      youtubeSectionSubtitle: 'Watch authentic fragrance unboxings, batch code verification guides, and official product showcases directly from our channel.',
      promoBanners: INITIAL_PROMO_BANNERS,
    };
  });

  const handleUpdateBannerSettings = (newSettings: SystemBannerSettings) => {
    setBannerSettings(newSettings);
    try {
      localStorage.setItem('zeropicbd_banner_settings', JSON.stringify(newSettings));
    } catch {}
    api.settings.updateBannerSettings(newSettings).catch(() => {});
    showToast('🚀 System Banners & Global Announcements updated!');
  };

  // State: Real-time Seasonal Campaign Banner (settings/campaign_banner in Firestore)
  const [campaignBanner, setCampaignBanner] = useState<CampaignBannerConfig>(DEFAULT_CAMPAIGN_BANNER);

  useEffect(() => {
    const unsub = subscribeCampaignBanner((config) => {
      setCampaignBanner(config);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // State: Vendor Payout Requests & Settlements (Clean real data)
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    try {
      const saved = localStorage.getItem('primevault_payout_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (p: any) =>
              !p.id?.startsWith('PAY-1082') &&
              !p.id?.startsWith('PAY-1094') &&
              !p.id?.startsWith('PAY-1102')
          );
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('primevault_payout_requests', JSON.stringify(payoutRequests));
    } catch {}
  }, [payoutRequests]);

  const handleApprovePayout = (requestId: string, trxId: string) => {
    setPayoutRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'Completed', trxId } : r
      )
    );
    showToast(`✓ Payout #${requestId} disbursed with TrxID: ${trxId}`);
  };

  const handleRejectPayout = (requestId: string) => {
    setPayoutRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'Rejected' } : r
      )
    );
    showToast(`Payout #${requestId} has been rejected.`);
  };

  // Dynamic Document Title based on active page
  useEffect(() => {
    if (activePage === 'Admin') {
      document.title = 'এডমিন প্যানেল ও ড্যাশবোর্ড | Kroyghor';
    } else if (activePage === 'Checkout') {
      document.title = 'নিরাপদ চেকআউট | Kroyghor (ক্রয় ঘর)';
    } else if (activePage === 'Store') {
      document.title = 'ব্র্যান্ড স্টোরফ্রন্ট | Kroyghor';
    } else if (activePage === 'SellerCenter') {
      document.title = 'মার্চেন্ট সেলার সেন্টার | Kroyghor';
    } else if (activePage === 'MyOrders' || activePage === 'UserProfile') {
      document.title = 'কাস্টমার পোর্টাল ও অর্ডার হিস্ট্রি | Kroyghor';
    } else if (activePage === 'TrackOrder') {
      document.title = 'লাইভ পার্সেল ট্র্যাকিং | Kroyghor';
    } else {
      document.title = 'Kroyghor (ক্রয় ঘর) - আপনার বিশ্বস্ত শপিং পার্টনার';
    }
  }, [activePage, selectedStoreSlug]);

  // State: Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeFilterTab, setActiveFilterTab] = useState<'All' | 'Flash Sale' | 'Best Deals' | 'New Arrivals'>('All');
  const [catalogTab, setCatalogTab] = useState<'recommended' | 'bestsellers' | 'newarrivals' | 'perfumes' | 'tech'>('recommended');
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState<boolean>(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState<boolean>(false);

  // Phase 4: Advanced Catalog Filters & Sorting State
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterState>(INITIAL_FILTER_STATE);
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState<boolean>(false);

  // State: Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [userProfileInitialTab, setUserProfileInitialTab] = useState<'profile' | 'orders' | 'cart' | 'wallet' | 'addresses' | 'security'>('profile');

  const showToast = useCallback((msg: string, durationMs = 1500) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), durationMs);
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveFilterTab('All');
    setCatalogFilters(INITIAL_FILTER_STATE);
    showToast('✓ All filters cleared');
  }, [showToast]);

  const handleSelectCategoryFromNav = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setActiveFilterTab('All');
    if (cat === 'All') {
      setCatalogFilters((prev) => ({ ...prev, categories: [] }));
    } else {
      const foundDept = DEPARTMENT_OPTIONS.find((d) => d.name === cat || d.matches(cat));
      const deptName = foundDept ? foundDept.name : cat;
      setCatalogFilters((prev) => ({ ...prev, categories: [deptName] }));
    }
    setActivePage('Home');
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // State: Wishlist with LocalStorage persistence
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_wishlist') || localStorage.getItem('primevault_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('zeropicbd_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('primevault_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const handleToggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : '❤️ Added to your Wishlist!');
      return updated;
    });
  }, [showToast]);

  // State: Dynamic Products with Firestore real-time sync + LocalStorage persistence
  const [products, setProducts] = useState<Product[]>(() => getLocalProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProductsFromFirestore((firestoreProducts) => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        setProducts(firestoreProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  // Dynamic max ceiling price from catalog
  const maxCatalogPrice = useMemo(() => {
    return products.reduce((max, p) => Math.max(max, p.price), 20000);
  }, [products]);

  // State: Dynamic Coupons with LocalStorage persistence
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_coupons') || localStorage.getItem('primevault_coupons') || localStorage.getItem('zestflick_coupons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COUPONS;
  });

  // State: Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_cart') || localStorage.getItem('primevault_cart') || localStorage.getItem('zestflick_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State: Coupon & Wallet
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [applyWalletBonus, setApplyWalletBonus] = useState(true);

  // State: User Profile with LocalStorage & Tokenized Session persistence
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_user') || localStorage.getItem('primevault_user') || localStorage.getItem('zestflick_user');
      const activeSession = getStoredSession();
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedRole: UserRole =
          isSuperAdminEmail(parsed.email)
            ? 'admin'
            : (activeSession?.role || parsed.role || 'customer');

        return {
          isLoggedIn: parsed.isLoggedIn ?? false,
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          role: resolvedRole,
          walletBalance: parsed.walletBalance ?? 0,
          hasReceivedBonus: parsed.hasReceivedBonus ?? false,
          isPhoneVerified: parsed.isPhoneVerified ?? false,
          authProvider: parsed.authProvider || 'google',
          avatar: parsed.avatar,
          walletHistory: parsed.walletHistory || [],
          session: activeSession || undefined,
          address: parsed.address || {
            fullName: '',
            phone: '',
            cityDivision: 'Inside Dhaka',
            fullAddress: '',
          }
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      isLoggedIn: false,
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      walletBalance: 0,
      hasReceivedBonus: false,
      isPhoneVerified: false,
      authProvider: 'google',
      walletHistory: [],
      address: {
        fullName: '',
        phone: '',
        cityDivision: 'Inside Dhaka',
        fullAddress: '',
      }
    };
  });

  // State: Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isYouTubeBonusModalOpen, setIsYouTubeBonusModalOpen] = useState(false);

  // State: Orders with LocalStorage persistence (Strictly real orders, purged of demo items)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('primevault_orders') || localStorage.getItem('zeropicbd_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((o) => !isDemoOrder(o, o?.id));
        }
      }
    } catch {}
    return [];
  });

  const handleSubmitReturnRequest = (
    orderId: string,
    returnData: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>
  ) => {
    const newReq: ReturnRequest = {
      ...returnData,
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      requestedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Pending Review',
    };

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, returnRequest: newReq } : order
      )
    );

    showToast(`✓ রিটার্ন আবেদন #${newReq.id} জমা হয়েছে! আমাদের টিম ২৪ ঘণ্টার মধ্যে যোগাযোগ করবে।`);
  };

  // State: Registered Sellers with LocalStorage persistence
  const [sellers, setSellers] = useState<Seller[]>(() => {
    try {
      const saved = localStorage.getItem('primevault_sellers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [currentSellerId, setCurrentSellerId] = useState<string>('seller-1');

  // Seed permanent Super Admin / Owner account on mount
  useEffect(() => {
    seedSuperAdminAccount();
  }, []);

  useEffect(() => {
    localStorage.setItem('zeropicbd_user', JSON.stringify(user));
    localStorage.setItem('primevault_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('zeropicbd_cart', JSON.stringify(cart));
    localStorage.setItem('primevault_cart', JSON.stringify(cart));
    api.cart.save(cart).catch(() => {});
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('zeropicbd_orders', JSON.stringify(orders));
    localStorage.setItem('primevault_orders', JSON.stringify(orders));
  }, [orders]);

  // Real-time Order Sync Engine: Listens to Firestore, BroadcastChannel, and in-tab custom events
  useEffect(() => {
    const isOwnerOrAdmin =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      user.email?.toLowerCase() === 'wapp7272@gmail.com' ||
      (typeof window !== 'undefined' && window.location.pathname === '/admin');

    if (isOwnerOrAdmin) {
      const unsub = subscribeToAllOrdersFromFirestore((allOrders) => {
        if (allOrders && allOrders.length >= 0) {
          setOrders(allOrders);
        }
      });
      return () => unsub();
    } else if (user.isLoggedIn) {
      const targetUid = (user as any).uid || user.email;
      const unsub = subscribeToUserOrdersFromFirestore(targetUid, user.email, (userOrders) => {
        if (userOrders && userOrders.length >= 0) {
          setOrders(userOrders);
        }
      });
      return () => unsub();
    } else {
      const unsub = subscribeToAllOrdersFromFirestore((allOrders) => {
        if (allOrders && allOrders.length >= 0) {
          setOrders(allOrders);
        }
      });
      return () => unsub();
    }
  }, [user.isLoggedIn, user.role, user.email]);

  useEffect(() => {
    localStorage.setItem('zeropicbd_products', JSON.stringify(products));
    localStorage.setItem('primevault_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('zeropicbd_coupons', JSON.stringify(coupons));
    localStorage.setItem('primevault_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('zeropicbd_sellers', JSON.stringify(sellers));
    localStorage.setItem('primevault_sellers', JSON.stringify(sellers));
  }, [sellers]);

  // Centralized Automatic Token Refresh Hook (checks every 60s)
  useEffect(() => {
    const interval = setInterval(async () => {
      const session = getStoredSession();
      if (session && session.accessToken) {
        if (isTokenExpiringSoon(session.accessToken, 300)) {
          try {
            const res = await api.auth.refreshToken();
            if (res.success && res.data) {
              setUser((prev) => ({
                ...prev,
                session: res.data || undefined,
                role: res.data?.role || prev.role,
              }));
              console.log('[Auth] Token automatically refreshed via Bearer refresh token.');
            }
          } catch (e) {
            console.warn('[Auth] Automatic token refresh failed:', e);
          }
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for real Google OAuth redirect result on mount (for mobile flow)
  useEffect(() => {
    if (isFirebaseConfigured()) {
      checkGoogleRedirectResult()
        .then((googleUser) => {
          if (googleUser && !user.isLoggedIn) {
            handleLogin(
              googleUser.displayName,
              googleUser.email,
              '',
              false,
              'google',
              googleUser.photoURL
            );
          }
        })
        .catch((err) => {
          console.warn('[App] Google redirect result check:', err);
        });
    }
  }, []);

  // Product Management (Admin Handlers with Firestore Persistence)
  const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: `zbd-prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    saveProductToFirestore(newProduct).catch((e) => console.error(e));
    api.products.create(newProductData).catch(() => {});
    showToast(`✓ Product "${newProduct.title}" added to store!`);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === updatedProduct.id
          ? { ...item, product: updatedProduct }
          : item
      )
    );
    if (quickViewProduct?.id === updatedProduct.id) {
      setQuickViewProduct(updatedProduct);
    }
    if (selectedProductDetail?.id === updatedProduct.id) {
      setSelectedProductDetail(updatedProduct);
    }
    saveProductToFirestore(updatedProduct).catch((e) => console.error(e));
    api.products.update(updatedProduct).catch(() => {});
    showToast(`✓ Product "${updatedProduct.title}" updated!`);
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (quickViewProduct?.id === productId) {
      setQuickViewProduct(null);
    }
    if (selectedProductDetail?.id === productId) {
      setSelectedProductDetail(null);
      setActivePage('Home');
    }
    deleteProductFromFirestore(productId).catch((e) => console.error(e));
    api.products.delete(productId).catch(() => {});
    showToast('✓ Product deleted from store.');
  };

  const handleBulkDeleteProducts = async (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => prev.filter((p) => !idSet.has(p.id)));
    setCart((prev) => prev.filter((item) => !idSet.has(item.product.id)));
    if (quickViewProduct && idSet.has(quickViewProduct.id)) {
      setQuickViewProduct(null);
    }
    if (selectedProductDetail && idSet.has(selectedProductDetail.id)) {
      setSelectedProductDetail(null);
      setActivePage('Home');
    }
    bulkDeleteProductsFromFirestore(productIds).catch((e) => console.error(e));
    productIds.forEach((id) => api.products.delete(id).catch(() => {}));
    showToast(`✓ Removed ${productIds.length} products from catalog.`);
  };

  const handleResetDemoProducts = () => {
    setProducts(PRODUCTS);
    localStorage.setItem('zeropicbd_products', JSON.stringify(PRODUCTS));
    showToast('✓ Default demo catalog restored.');
  };

  const handleUpdateOrderNotes = (orderId: string, notes: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, trackingNotes: notes } : o))
    );
    showToast(`✓ Order ${orderId} dispatch notes updated.`);
  };

  // Coupon Management (Admin Handlers)
  const handleAddCoupon = (newCouponData: Omit<Coupon, 'id'>) => {
    const newCoupon: Coupon = {
      ...newCouponData,
      id: `coup-${Date.now()}`,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    showToast(`✓ Coupon "${newCoupon.code}" created!`);
  };

  const handleUpdateCoupon = (updatedCoupon: Coupon) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c))
    );
    if (appliedCoupon?.id === updatedCoupon.id) {
      setAppliedCoupon(updatedCoupon);
    }
    showToast(`✓ Coupon "${updatedCoupon.code}" updated!`);
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    if (appliedCoupon?.id === couponId) {
      setAppliedCoupon(null);
      setIsCouponApplied(false);
      setCouponCode('');
    }
    showToast('✓ Coupon removed.');
  };

  // Seller Management Handlers
  const handleRegisterSeller = (newSellerData: Omit<Seller, 'id' | 'createdAt' | 'status'>) => {
    const newSeller: Seller = {
      ...newSellerData,
      id: `seller-${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setSellers((prev) => [newSeller, ...prev]);
    setCurrentSellerId(newSeller.id);
    api.sellers.register(newSellerData as any).catch(() => {});
    showToast(`🏪 Application for "${newSeller.storeName}" submitted for approval!`);
  };

  const handleUpdateSellerStatus = (sellerId: string, newStatus: Seller['status']) => {
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, status: newStatus } : s))
    );
    api.sellers.updateStatus(sellerId, newStatus).catch(() => {});
    showToast(`✓ Merchant status changed to ${newStatus}`);
  };

  // Add to Cart handler
  const handleAddToCart = useCallback((product: Product, quantity = 1, selectedSize?: string) => {
    if (product.inStock === false) {
      showToast(`⚠️ Sorry, "${product.title}" is out of stock!`);
      return;
    }

    const derivedStoreName = product.storeName || product.sellerName || (() => {
      const cat = product.category || '';
      if (cat.includes('Perfume') || cat === 'Attar Perfumes') return 'PerfumeVault BD';
      if (cat.includes('Gadgets') || cat === 'Glow Lights') return 'Apex Tech BD';
      if (cat.includes('Fashion')) return 'Kroyghor Atelier';
      if (cat.includes('Watches')) return 'Chronos Official';
      if (cat.includes('Beauty')) return 'Glow & Glam BD';
      if (cat.includes('Home')) return 'Nordic Living';
      return 'Kroyghor Official';
    })();

    // Adjust price by size multiplier if applicable
    const sizeMultiplier = selectedSize?.includes('50ml') ? 0.85 : selectedSize?.includes('150ml') ? 1.35 : 1;
    const adjustedPrice = selectedSize ? Math.round(product.price * sizeMultiplier) : product.price;

    const itemToAdd: Product = {
      ...product,
      price: adjustedPrice,
      title: selectedSize ? `${product.title} (${selectedSize})` : product.title,
      id: selectedSize ? `${product.id}-${selectedSize}` : product.id,
      storeName: derivedStoreName,
    };

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === itemToAdd.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === itemToAdd.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev, 
        { 
          product: itemToAdd, 
          quantity, 
          selectedSize: selectedSize || (product.sizes && product.sizes[0]), 
          storeName: derivedStoreName 
        }
      ];
    });
    showToast(`🛒 "${itemToAdd.title}" added to cart!`);
  }, [showToast]);

  // Dedicated /checkout navigation handler
  const handleOpenCheckout = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/checkout') {
      window.history.pushState(null, '', '/checkout');
    }
    setSelectedProductDetail(null);
    setActivePage('Checkout');
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Instant Buy Now trigger
  const handleBuyNow = useCallback((product: Product, quantity = 1, selectedSize?: string) => {
    handleAddToCart(product, quantity, selectedSize);
    handleOpenCheckout();
  }, [handleAddToCart, handleOpenCheckout]);

  // Navigation Handlers memoized with useCallback to prevent re-renders
  const handleGoHome = useCallback(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.pathname === '/checkout')) {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setActivePage('Home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectProductDetail = useCallback((product: Product) => {
    setSelectedProductDetail(product);
    setActivePage('ProductDetail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenOrders = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setUserProfileInitialTab('orders');
    setActivePage('UserProfile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenUserProfile = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setUserProfileInitialTab('profile');
    setActivePage('UserProfile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenBonusClaim = useCallback(() => {
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('🎁 Sign in to claim your ৳20 YouTube Subscription Bonus!');
      return;
    }
    setIsYouTubeBonusModalOpen(true);
  }, [user.isLoggedIn, showToast]);

  const handleCampaignBannerNavigate = useCallback((target: string) => {
    if (!target) return;
    if (target === '/checkout') {
      handleOpenCheckout();
    } else if (['Flash Sale', 'Best Deals', 'New Arrivals'].includes(target)) {
      setActiveFilterTab(target as any);
      setSelectedCategory('All');
      setActivePage('Home');
      const el = document.getElementById('explore');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (target.startsWith('#')) {
      setActivePage('Home');
      const el = document.getElementById(target.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Category target
      handleSelectCategoryFromNav(target);
      setActivePage('Home');
      const el = document.getElementById('explore');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [handleOpenCheckout, handleSelectCategoryFromNav]);

  const handleOpenSellerCenter = useCallback(() => {
    // RBAC Security Guard: Require authenticated user session for merchant center
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('🔒 Please sign in to access the Merchant Seller Center.');
      return;
    }
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setActivePage('SellerCenter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user.isLoggedIn]);

  const handleOpenSellerStore = useCallback((slugOrName: string) => {
    const raw = (slugOrName || '').toLowerCase().trim();
    const slugKey = raw.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const found = sellers.find(
      (s) =>
        s.slug.toLowerCase() === slugKey ||
        s.slug.toLowerCase() === raw ||
        s.storeName.toLowerCase() === raw ||
        s.storeName.toLowerCase().includes(raw)
    );

    if (found) {
      setSelectedStoreSlug(found.slug);
    } else {
      setSelectedStoreSlug(slugKey || 'perfume-vault-bd');
    }
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setActivePage('Store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sellers]);

  const handleOpenAdmin = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
    setSelectedProductDetail(null);
    setActivePage('Admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleExitAdmin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    setSelectedProductDetail(null);
    setActivePage('Home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenTrackOrder = useCallback((orderId?: string) => {
    if (orderId) {
      setTrackedOrderId(orderId);
    }
    setSelectedProductDetail(null);
    setActivePage('TrackOrder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      handleAddToCart(item.product, item.quantity, item.selectedSize);
    });
    showToast(`✓ Order ${order.id} items added to cart!`);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  // Cart financial calculations
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const couponDiscount = useMemo(() => {
    if (!isCouponApplied || !appliedCoupon) return 0;
    if (appliedCoupon.minOrderAmount && cartSubtotal < appliedCoupon.minOrderAmount) {
      return 0;
    }
    if (appliedCoupon.discountType === 'percentage') {
      return Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
    }
    return Math.min(appliedCoupon.discountValue, cartSubtotal);
  }, [isCouponApplied, appliedCoupon, cartSubtotal]);

  const handleApplyCoupon = (codeToApply: string): { success: boolean; message: string } => {
    const formatted = codeToApply.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === formatted && c.isActive);

    if (!found) {
      const msg = 'Invalid or expired coupon code';
      showToast(`❌ ${msg}`);
      return { success: false, message: msg };
    }

    if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) {
      const msg = `Minimum order amount ৳${found.minOrderAmount} required for this coupon`;
      showToast(`⚠️ ${msg}`);
      return { success: false, message: msg };
    }

    setAppliedCoupon(found);
    setIsCouponApplied(true);
    setCouponCode(found.code);
    const msg = `Coupon "${found.code}" applied!`;
    showToast(`🎉 ${msg}`);
    return { success: true, message: msg };
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setIsCouponApplied(false);
    setCouponCode('');
    showToast('Coupon removed');
  };

  // User Profile Authentication Handlers with Tokenized Session & RBAC
  const handleLogin = async (
    name: string,
    email: string,
    phone: string,
    isPhoneVerified?: boolean,
    authProvider?: 'google' | 'phone' | 'email',
    avatar?: string,
    uid?: string
  ) => {
    // Lookup stored account in registered accounts
    const accounts = (() => {
      try {
        const stored = localStorage.getItem('zeropicbd_registered_accounts') || localStorage.getItem('primevault_registered_accounts');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    })();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const matched = accounts.find((a: any) => 
      (cleanPhone && a.phone === cleanPhone) || 
      (email && a.email?.toLowerCase() === email?.toLowerCase())
    );

    const verified = isPhoneVerified ?? matched?.isPhoneVerified ?? true;
    const history: WalletTransaction[] = matched?.walletHistory || user.walletHistory || [];

    // Sync/retrieve Firestore user document in users/{uid}
    const targetUid = uid || auth?.currentUser?.uid || matched?.uid || '';
    let synced = {
      role: (email?.toLowerCase() === 'wapp7272@gmail.com' ? 'super_admin' : 'customer') as UserRole,
      walletBalance: 0,
      hasClaimedYouTubeBonus: false,
      displayName: name || matched?.name || 'Kroyghor Member',
      photoURL: avatar || matched?.avatar || '',
      email: email || '',
    };

    if (targetUid) {
      synced = await syncUserDocumentInFirestore({
        uid: targetUid,
        email,
        displayName: name || matched?.name,
        photoURL: avatar || matched?.avatar,
      });
    }

    const isEmailAdmin = (email || '').toLowerCase() === 'wapp7272@gmail.com';
    const isUserSeller = sellers.some(
      (s) => (email && s.email.toLowerCase() === email.toLowerCase()) || (cleanPhone && s.phone === cleanPhone)
    );
    const role: UserRole = matched?.role || synced.role || (isEmailAdmin ? 'super_admin' : isUserSeller ? 'seller' : 'customer');
    const balance = typeof synced.walletBalance === 'number' && synced.walletBalance >= 0 ? synced.walletBalance : (matched?.walletBalance ?? user.walletBalance ?? 0);

    // Issue Bearer token session
    const session = createSession(email, cleanPhone, role);
    setStoredSession(session);

    const updatedUser: UserProfile & { uid?: string } = {
      uid: targetUid,
      isLoggedIn: true,
      name: name || synced.displayName || matched?.name || 'Kroyghor Member',
      email: email || synced.email || matched?.email || '',
      phone: cleanPhone || matched?.phone || '',
      role,
      session,
      walletBalance: balance,
      hasReceivedBonus: false,
      hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus,
      isPhoneVerified: verified,
      authProvider: authProvider || matched?.authProvider || 'google',
      avatar: avatar || synced.photoURL || matched?.avatar,
      walletHistory: history,
      address: matched?.address ? { ...matched.address } : user.address
    };

    setUser(updatedUser);
    setIsAuthOpen(false);
    showToast(`✓ Welcome, ${updatedUser.name}!`);
  };

  const handleSignup = async (
    name: string,
    email: string,
    phone: string,
    address: Address,
    isPhoneVerified?: boolean,
    authProvider?: 'google' | 'phone' | 'email',
    avatar?: string,
    uid?: string
  ) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    const targetUid = uid || auth?.currentUser?.uid || '';
    let synced = {
      role: (email?.toLowerCase() === 'wapp7272@gmail.com' ? 'super_admin' : 'customer') as UserRole,
      walletBalance: 0,
      hasClaimedYouTubeBonus: false,
      displayName: name || 'Kroyghor Member',
      photoURL: avatar || '',
      email: email || '',
    };

    if (targetUid) {
      synced = await syncUserDocumentInFirestore({
        uid: targetUid,
        email,
        displayName: name,
        photoURL: avatar,
      });
    }

    const isEmailAdmin = (email || '').toLowerCase() === 'wapp7272@gmail.com';
    const role: UserRole = synced.role || (isEmailAdmin ? 'super_admin' : 'customer');
    const session = createSession(email, cleanPhone, role);
    setStoredSession(session);

    const newUser: UserProfile & { uid?: string } = {
      uid: targetUid,
      isLoggedIn: true,
      name: name || synced.displayName || 'Kroyghor Member',
      email: email || synced.email || '',
      phone: cleanPhone,
      role,
      session,
      walletBalance: synced.walletBalance || 0,
      hasReceivedBonus: false,
      hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus,
      isPhoneVerified: isPhoneVerified ?? true,
      authProvider: authProvider || 'google',
      avatar: avatar || synced.photoURL,
      walletHistory: [],
      address: address || {
        fullName: name,
        phone: cleanPhone,
        cityDivision: 'Inside Dhaka',
        fullAddress: ''
      }
    };

    // Also persist to registered accounts
    try {
      const accounts = (() => {
        const stored = localStorage.getItem('zeropicbd_registered_accounts') || localStorage.getItem('primevault_registered_accounts');
        return stored ? JSON.parse(stored) : [];
      })();
      const idx = accounts.findIndex((a: any) => 
        (cleanPhone && a.phone === cleanPhone) || 
        (email && a.email?.toLowerCase() === email?.toLowerCase())
      );
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...newUser };
      } else {
        accounts.push(newUser);
      }
      localStorage.setItem('zeropicbd_registered_accounts', JSON.stringify(accounts));
      localStorage.setItem('primevault_registered_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }

    setUser(newUser);
    setIsAuthOpen(false);
    showToast(`🎉 Welcome ${name || 'Member'}! ৳20 Welcome Bonus credited to your wallet!`);
  };

  const handleVerifyPhoneSuccess = (verifiedPhone: string) => {
    const cleanPhone = (verifiedPhone || '').replace(/[^0-9]/g, '');
    setUser((prev) => {
      const hasBonus = prev.hasReceivedBonus && prev.walletBalance >= 20;
      const newBalance = hasBonus ? prev.walletBalance : prev.walletBalance + 20;
      const newHistory = prev.walletHistory ? [...prev.walletHistory] : [];
      if (!hasBonus) {
        newHistory.push({
          id: `tx-verify-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: 20,
          type: 'credit',
          description: 'Phone Verification Bonus'
        });
      }
      const updated: UserProfile = {
        ...prev,
        isLoggedIn: true,
        phone: cleanPhone,
        isPhoneVerified: true,
        hasReceivedBonus: true,
        walletBalance: newBalance,
        walletHistory: newHistory
      };

      // Update registered accounts
      try {
        const accounts = (() => {
          const stored = localStorage.getItem('zeropicbd_registered_accounts') || localStorage.getItem('primevault_registered_accounts');
          return stored ? JSON.parse(stored) : [];
        })();
        const idx = accounts.findIndex((a: any) => 
          (cleanPhone && a.phone === cleanPhone) || 
          (prev.email && a.email?.toLowerCase() === prev.email?.toLowerCase())
        );
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], ...updated };
        } else {
          accounts.push(updated);
        }
        localStorage.setItem('zeropicbd_registered_accounts', JSON.stringify(accounts));
        localStorage.setItem('primevault_registered_accounts', JSON.stringify(accounts));
      } catch (e) {
        console.error(e);
      }

      return updated;
    });
    showToast(`📱 Mobile ${cleanPhone} verified! ৳20 Wallet Bonus active!`);
  };

  const handleUpdateAddress = (newAddress: Address) => {
    setUser((prev) => ({
      ...prev,
      address: newAddress,
    }));
    showToast('✓ Delivery address saved successfully');
  };

  const handleLogout = () => {
    firebaseSignOut().catch(() => {});
    api.auth.logout().catch(() => {});
    clearStoredSession();
    setUser({
      isLoggedIn: false,
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      walletBalance: 0,
      hasReceivedBonus: false,
      isPhoneVerified: false,
      authProvider: 'google',
      walletHistory: [],
      address: {
        fullName: '',
        phone: '',
        cityDivision: 'Inside Dhaka',
        fullAddress: '',
      }
    });
    setIsAuthOpen(false);
    showToast('You have been logged out.');
  };

  const handleCreateOrder = async (order: Order) => {
    const currentUid = (user as any).uid || auth?.currentUser?.uid || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest');
    const orderWithUser: Order = {
      ...order,
      userId: user.isLoggedIn ? currentUid : 'guest',
      customerName: order.customerName || order.address.fullName,
      customerEmail: order.customerEmail || user.email || '',
      customerPhone: order.customerPhone || order.address.phone || user.phone || '',
    };

    setOrders((prev) => [orderWithUser, ...prev.filter((o) => o.id !== orderWithUser.id)]);
    setCart([]);
    // Keep checkout open so user sees instant Order Confirmed screen with Order ID

    try {
      const saved = await saveOrderToFirestore(orderWithUser, user.isLoggedIn ? currentUid : 'guest');
      setOrders((prev) => [saved, ...prev.filter((o) => o.id !== saved.id)]);
    } catch {
      api.orders.create(orderWithUser).catch(() => {});
    }

    api.cart.clear().catch(() => {});

    // If logged in and didn't have phone/address yet, save the checkout phone/address to profile
    if (user.isLoggedIn) {
      const checkoutPhone = order.customerPhone || order.address.phone || '';
      setUser((prev) => {
        const needsPhoneUpdate = !prev.phone && checkoutPhone;
        const needsAddressUpdate = !prev.address?.fullAddress && order.address?.fullAddress;
        if (needsPhoneUpdate || needsAddressUpdate) {
          const updated: UserProfile = {
            ...prev,
            phone: prev.phone || checkoutPhone,
            address: prev.address?.fullAddress ? prev.address : order.address,
          };
          const targetUid = prev.email ? prev.email.replace(/[^a-zA-Z0-9]/g, '_') : (prev.phone || 'user');
          if (db && targetUid) {
            try {
              const userRef = doc(db, 'users', targetUid);
              updateDoc(userRef, {
                phone: updated.phone,
                address: updated.address,
                updatedAt: new Date().toISOString()
              }).catch(() => {});
            } catch {}
          }
          return updated;
        }
        return prev;
      });
    }

    if (order.walletDeducted > 0) {
      // Deduct from Firestore users/{uid} and log DEBIT in wallet_transactions
      if (user.isLoggedIn) {
        const targetUid = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : (user.phone || 'user');
        deductUserWalletInFirestore(targetUid, order.walletDeducted, order.id, user.email).catch((e) => console.error(e));
      }

      setUser((prev) => {
        const remaining = Math.max(0, prev.walletBalance - order.walletDeducted);
        const debitTx: WalletTransaction = {
          id: `tx-order-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: order.walletDeducted,
          type: 'debit',
          description: `Applied to Order ${order.id}`
        };
        const updatedHistory = prev.walletHistory ? [debitTx, ...prev.walletHistory] : [debitTx];
        const updatedUser: UserProfile = {
          ...prev,
          walletBalance: remaining,
          walletHistory: updatedHistory,
        };

        // Update stored registered accounts
        try {
          const accounts = (() => {
            const stored = localStorage.getItem('zeropicbd_registered_accounts') || localStorage.getItem('primevault_registered_accounts');
            return stored ? JSON.parse(stored) : [];
          })();
          const idx = accounts.findIndex((a: any) => 
            (prev.phone && a.phone === prev.phone) || 
            (prev.email && a.email?.toLowerCase() === prev.email?.toLowerCase())
          );
          if (idx >= 0) {
            accounts[idx] = { ...accounts[idx], walletBalance: remaining, walletHistory: updatedHistory };
            localStorage.setItem('zeropicbd_registered_accounts', JSON.stringify(accounts));
            localStorage.setItem('primevault_registered_accounts', JSON.stringify(accounts));
          }
        } catch (e) {
          console.error(e);
        }

        return updatedUser;
      });
    }

    // Trigger automated SMS & Email dispatch simulation
    try {
      triggerOrderNotifications(order, 'placed');
      showToast(`🎉 Order Placed! 📱 SMS dispatched to ${order.address.phone}`);
    } catch {
      showToast(`🎉 Order Placed Successfully! ID: ${order.id}`);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status: newStatus };
          // Trigger automated notification for key events
          try {
            if (newStatus === 'Confirmed') triggerOrderNotifications(updated, 'confirmed');
            else if (newStatus === 'Shipped') triggerOrderNotifications(updated, 'shipped');
            else if (newStatus === 'Delivered') triggerOrderNotifications(updated, 'delivered');
          } catch {}
          return updated;
        }
        return o;
      })
    );
    api.orders.updateStatus(orderId, newStatus).catch(() => {});
    showToast(`✓ Order #${orderId} status updated: ${newStatus}`);
  };

  const handleUpdateOrderPaymentStatus = (orderId: string, newPaymentStatus: Order['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
    );
    api.orders.updatePaymentStatus(orderId, newPaymentStatus).catch(() => {});
    showToast(`✓ Order #${orderId} payment status set to: ${newPaymentStatus}`);
  };

  const handleUpdateOrderTracking = (orderId: string, courierName: string, trackingNumber: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, courierName, trackingNumber, status: 'Shipped' as const };
          try {
            triggerOrderNotifications(updated, 'shipped');
          } catch {}
          return updated;
        }
        return o;
      })
    );
    api.orders.updateTracking(orderId, courierName, trackingNumber).catch(() => {});
    showToast(`✓ Tracking assigned & Dispatch SMS sent for #${orderId}: ${courierName} (${trackingNumber})`);
  };

  // Download Standalone Single-File HTML
  const handleDownloadStandaloneHtml = () => {
    fetch('/primevault-standalone.html')
      .then((res) => (res.ok ? res.text() : fetch('/zestflick-standalone.html').then((r) => r.text())))
      .then((htmlContent) => {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'zeropicbd-store.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✓ Standalone HTML downloaded!');
      })
      .catch((err) => {
        console.error('Error downloading HTML:', err);
      });
  };

  // Filtered and Sorted Products based on Phase 4 Advanced System
  const filteredProducts = useMemo(() => {
    const matched = products.filter((product) => {
      // 1. Multi-Department Category Filtering
      let matchesCategory = true;
      if (catalogFilters.categories.length > 0) {
        matchesCategory = catalogFilters.categories.some((catName) => {
          const option = DEPARTMENT_OPTIONS.find((d) => d.name === catName);
          if (option) {
            return option.matches(product.category || '');
          }
          if (catName === 'Perfumes & Attars' || catName === 'Perfume & Fragrances' || catName === 'Perfume') {
            return product.category === 'Perfume' || product.category === 'Attar Perfumes' || product.category === 'Perfume & Fragrances';
          }
          if (catName === 'Electronics & Tech' || catName === 'Electronics & Gadgets') {
            return product.category === 'Electronics & Gadgets' || product.category === 'Glow Lights';
          }
          if (catName === 'Fashion & Lifestyle') {
            return product.category === 'Fashion & Lifestyle';
          }
          if (catName === 'Watches & Accessories') {
            return product.category === 'Watches & Accessories';
          }
          if (catName === 'Beauty & Skincare' || catName === 'Beauty & Personal Care') {
            return product.category === 'Beauty & Personal Care';
          }
          if (catName === 'Home Living' || catName === 'Home & Living') {
            return product.category === 'Home & Living';
          }
          if (catName === 'Luxury Gifts' || catName === 'Premium Gifts') {
            return product.category === 'Premium Gifts' || product.category === 'Notebooks' || product.category === 'Bricks Toys';
          }
          return (product.category || '').toLowerCase() === catName.toLowerCase();
        });
      } else if (selectedCategory !== 'All') {
        const option = DEPARTMENT_OPTIONS.find((d) => d.name === selectedCategory);
        if (option) {
          matchesCategory = option.matches(product.category || '');
        } else if (selectedCategory === 'Perfume & Fragrances') {
          matchesCategory = product.category === 'Perfume' || product.category === 'Attar Perfumes' || product.category === 'Perfume & Fragrances';
        } else if (selectedCategory === 'Fashion & Lifestyle') {
          matchesCategory = product.category === 'Fashion & Lifestyle';
        } else if (selectedCategory === 'Electronics & Gadgets') {
          matchesCategory = product.category === 'Electronics & Gadgets' || product.category === 'Glow Lights';
        } else if (selectedCategory === 'Beauty & Personal Care') {
          matchesCategory = product.category === 'Beauty & Personal Care';
        } else if (selectedCategory === 'Home & Living') {
          matchesCategory = product.category === 'Home & Living';
        } else if (selectedCategory === 'Watches & Accessories') {
          matchesCategory = product.category === 'Watches & Accessories';
        } else if (selectedCategory === 'Premium Gifts') {
          matchesCategory = product.category === 'Premium Gifts' || product.category === 'Notebooks' || product.category === 'Bricks Toys';
        } else {
          matchesCategory = product.category.toLowerCase() === selectedCategory.toLowerCase();
        }
      }

      // 2. Search Query Matching
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        (product.name && product.name.toLowerCase().includes(q)) ||
        (product.category && product.category.toLowerCase().includes(q)) ||
        (product.description && product.description.toLowerCase().includes(q)) ||
        (product.features && product.features.some((f) => f.toLowerCase().includes(q))) ||
        (product.tag && product.tag.toLowerCase().includes(q)) ||
        (product.storeName && product.storeName.toLowerCase().includes(q));

      // 3. Price Range Slider / Manual Text Inputs
      const matchesPrice =
        product.price >= catalogFilters.minPrice &&
        product.price <= catalogFilters.maxPrice;

      // 4. Stock Availability Toggle
      const matchesStock = !catalogFilters.inStockOnly || product.inStock;

      // 5. Minimum Discount Percentage Filter
      let matchesDiscount = true;
      if (catalogFilters.minDiscount > 0) {
        const discPct =
          product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : (product.discount ? parseInt(product.discount) || 0 : 0);
        matchesDiscount = discPct >= catalogFilters.minDiscount;
      }

      // 6. Customer Rating Filter
      const matchesRating =
        catalogFilters.minRating === 0 || (product.rating && product.rating >= catalogFilters.minRating);

      // 7. Brands Filter
      let matchesBrand = true;
      if (catalogFilters.selectedBrands.length > 0) {
        matchesBrand = catalogFilters.selectedBrands.some(
          (brand) =>
            product.title.toLowerCase().includes(brand.toLowerCase()) ||
            (product.name && product.name.toLowerCase().includes(brand.toLowerCase())) ||
            (product.description && product.description.toLowerCase().includes(brand.toLowerCase())) ||
            (product.storeName && product.storeName.toLowerCase().includes(brand.toLowerCase())) ||
            (product.sellerName && product.sellerName.toLowerCase().includes(brand.toLowerCase()))
        );
      }

      // 8. Tags / Sub-Category Badges Filter
      let matchesTag = true;
      if (catalogFilters.selectedTags.length > 0) {
        matchesTag = catalogFilters.selectedTags.some(
          (tag) =>
            (product.tag && product.tag.toLowerCase().includes(tag.toLowerCase())) ||
            (product.features && product.features.some((f) => f.toLowerCase().includes(tag.toLowerCase())))
        );
      }

      // 9. Secondary Nav Tab Quick Filter ('All' | 'Flash Sale' | 'Best Deals' | 'New Arrivals')
      let matchesTab = true;
      if (activeFilterTab === 'Flash Sale') {
        matchesTab = Boolean(
          (product.originalPrice && product.originalPrice > product.price) ||
          (product.discount && product.discount.length > 0) ||
          (product.tag && (product.tag.includes('OFF') || product.tag.includes('Sale') || product.tag.includes('Hot')))
        );
      } else if (activeFilterTab === 'Best Deals') {
        matchesTab = Boolean(
          (product.rating && product.rating >= 4.8) ||
          (product.tag && (product.tag.includes('Best') || product.tag.includes('Popular') || product.tag.includes('Top') || product.tag.includes('Signature')))
        );
      } else if (activeFilterTab === 'New Arrivals') {
        matchesTab = Boolean(
          product.id.startsWith('fash') ||
          product.id.startsWith('wtch') ||
          product.id.startsWith('bty') ||
          product.id.startsWith('home') ||
          product.id.startsWith('brick') ||
          (product.tag && (product.tag.includes('Exclusive') || product.tag.includes('Trending') || product.tag.includes('New')))
        );
      }

      return (
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesStock &&
        matchesDiscount &&
        matchesRating &&
        matchesBrand &&
        matchesTag &&
        matchesTab
      );
    });

    // Dynamic Sorting Engine
    return matched.sort((a, b) => {
      switch (catalogFilters.sortBy) {
        case 'popularity': {
          const scoreA = (a.soldCount || 0) * 10 + (a.reviewsCount || 0) + (a.tag?.includes('Best') ? 50 : 0);
          const scoreB = (b.soldCount || 0) * 10 + (b.reviewsCount || 0) + (b.tag?.includes('Best') ? 50 : 0);
          return scoreB - scoreA;
        }
        case 'newest': {
          const isNewA = a.id.startsWith('fash') || a.id.startsWith('wtch') || a.id.startsWith('bty') || a.id.startsWith('home') || a.tag?.includes('New');
          const isNewB = b.id.startsWith('fash') || b.id.startsWith('wtch') || b.id.startsWith('bty') || b.id.startsWith('home') || b.tag?.includes('New');
          if (isNewA && !isNewB) return -1;
          if (!isNewA && isNewB) return 1;
          return 0;
        }
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }, [products, searchQuery, selectedCategory, activeFilterTab, catalogFilters]);

  // Top 5 Popular Perfumes
  const popularPerfumes = useMemo(() => {
    const targetIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const found = targetIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));

    if (found.length === 5) return found;
    const rest = products.filter((p) => !found.some((f) => f.id === p.id));
    return [...found, ...rest].slice(0, 5);
  }, [products]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const featuredProduct = useMemo(() => {
    return products.find((p) => p.isFeatured) || products.find((p) => p.id === 'p1') || products[0];
  }, [products]);

  // Dedicated Full-Page /admin Route with AdminRoute Protection & Redirect
  if (activePage === 'Admin') {
    return (
      <AuthProvider userState={user} onUpdateUser={setUser}>
        <Suspense fallback={<ModalSuspenseFallback />}>
          <AdminRoute
            user={user}
            isOpen={true}
            onClose={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
              setActivePage('Home');
              showToast('Access Denied: Admin or Super Admin privileges required.');
            }}
            onOpenAuth={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
              setActivePage('Home');
              setIsAuthOpen(true);
            }}
          >
            <AdminDashboard
              user={user}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrderPaymentStatus={handleUpdateOrderPaymentStatus}
              onUpdateOrderTracking={handleUpdateOrderTracking}
              onUpdateOrderNotes={handleUpdateOrderNotes}
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDeleteProducts={handleBulkDeleteProducts}
              onResetDemoProducts={handleResetDemoProducts}
              coupons={coupons}
              onAddCoupon={handleAddCoupon}
              onUpdateCoupon={handleUpdateCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              sellers={sellers}
              onUpdateSellerStatus={handleUpdateSellerStatus}
              commissionRate={commissionRate}
              onUpdateCommissionRate={handleUpdateCommissionRate}
              bannerSettings={bannerSettings}
              onUpdateBannerSettings={handleUpdateBannerSettings}
              payoutRequests={payoutRequests}
              onApprovePayout={handleApprovePayout}
              onRejectPayout={handleRejectPayout}
              showToast={showToast}
              onViewPublicStore={(slug) => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/');
                }
                handleOpenSellerStore(slug);
              }}
              onGoShop={handleExitAdmin}
              onGoOrders={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/');
                }
                handleOpenOrders();
              }}
              onLogout={() => {
                handleLogout();
                handleExitAdmin();
              }}
              onClose={handleExitAdmin}
            />
          </AdminRoute>
        </Suspense>
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-xs shadow-2xl animate-slideUp flex items-center gap-2">
            <span>{toastMsg}</span>
          </div>
        )}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider userState={user} onUpdateUser={setUser}>
      <div className="min-h-screen bg-[#F9FAFB] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white relative pb-24 md:pb-0">
      {/* Header Navbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        ordersCount={orders.length}
        wishlistCount={wishlist.length}
        products={products}
        selectedCategory={selectedCategory}
        onSelectProduct={handleSelectProductDetail}
        isMobileCategoriesOpen={isMobileCategoriesOpen}
        onToggleMobileCategories={setIsMobileCategoriesOpen}
        isMobileSearchActive={isMobileSearchActive}
        onToggleMobileSearch={setIsMobileSearchActive}
        onOpenWishlist={() => {
          showToast(`❤️ You have ${wishlist.length} items saved in your Wishlist`);
        }}
        onOpenOrders={handleOpenOrders}
        onOpenUserProfile={handleOpenUserProfile}
        onOpenSellerCenter={handleOpenSellerCenter}
        onOpenSellerStore={handleOpenSellerStore}
        onOpenAuth={() => setIsAuthOpen(true)}
        onDownloadHtml={handleDownloadStandaloneHtml}
        onOpenAdmin={handleOpenAdmin}
        onGoHome={handleGoHome}
        onSelectCategory={handleSelectCategoryFromNav}
        onSelectFilterTab={(tab) => {
          setActiveFilterTab(tab);
          setActivePage('Home');
          if (tab !== 'All') {
            const el = document.getElementById('explore');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        activeFilterTab={activeFilterTab}
        activeNav={activePage}
        bannerSettings={bannerSettings}
        onOpenTrackOrder={handleOpenTrackOrder}
        onOpenYouTubeBonusModal={handleOpenBonusClaim}
      />

      {/* Active Page Routing Router */}
      <Suspense fallback={<ModalSuspenseFallback />}>
        {activePage === 'Checkout' ? (
          <CheckoutPage
            items={cart}
            user={user}
            subtotal={cartSubtotal}
            couponDiscount={couponDiscount}
            couponCode={couponCode}
            isCouponApplied={isCouponApplied}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onPlaceOrder={handleCreateOrder}
            onClearCart={() => setCart([])}
            onGoHome={handleGoHome}
            onViewOrders={handleOpenOrders}
            onTrackOrder={handleOpenTrackOrder}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
            showToast={showToast}
            onUpdateUserWallet={(newBalance) => {
              setUser((prev) => ({
                ...prev,
                walletBalance: newBalance,
              }));
            }}
          />
        ) : activePage === 'UserProfile' || activePage === 'MyOrders' ? (
          <CustomerProfileView
            user={user}
            orders={orders}
            products={products}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProductDetail}
            onReorder={handleReorder}
            onUpdateAddress={handleUpdateAddress}
            onUpdateProfile={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
            onUpdateSavedAddresses={(addresses: Address[]) => {
              setUser((prev) => ({ ...prev, savedAddresses: addresses }));
            }}
            onLogout={handleLogout}
            onBackToShop={handleGoHome}
            onOpenAuth={() => setIsAuthOpen(true)}
            initialTab={userProfileInitialTab}
            onSubmitReturnRequest={handleSubmitReturnRequest}
            onOpenReturnPolicy={() => setIsFaqOpen(true)}
            onTrackOrder={handleOpenTrackOrder}
            onOpenAdmin={handleOpenAdmin}
            onOpenYouTubeBonusModal={handleOpenBonusClaim}
            cartItems={cart}
            onOpenCart={() => setIsCartOpen(true)}
            onProceedToCheckout={handleOpenCheckout}
          />
        ) : activePage === 'TrackOrder' ? (
          <OrderTrackingPortal
            orders={orders}
            user={user}
            initialOrderId={trackedOrderId}
            onBackToShop={handleGoHome}
            onViewProduct={handleSelectProductDetail}
            onOpenSupport={() => setIsFaqOpen(true)}
            onOpenOrders={handleOpenOrders}
          />
        ) : activePage === 'SellerCenter' ? (
          <SellerCenterView
            onBackToShop={handleGoHome}
            products={products}
            orders={orders}
            sellers={sellers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRegisterSeller={handleRegisterSeller}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateOrderTracking={handleUpdateOrderTracking}
            currentSellerId={currentSellerId}
            onSwitchSeller={setCurrentSellerId}
            commissionRate={commissionRate}
            onViewPublicStore={handleOpenSellerStore}
          />
        ) : activePage === 'Store' ? (
          <PublicSellerStoreView
            sellerSlug={selectedStoreSlug}
            sellers={sellers}
            products={products}
            orders={orders}
            onBackToShop={handleGoHome}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => handleSelectProductDetail(p)}
            onBuyNow={handleBuyNow}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onOpenSellerCenter={handleOpenSellerCenter}
            onSwitchStore={(slug) => setSelectedStoreSlug(slug)}
            showToast={showToast}
          />
        ) : activePage === 'ProductDetail' && selectedProductDetail ? (
          <ProductDetailView
            product={selectedProductDetail}
            products={products}
            user={user}
            onBackToShop={handleGoHome}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProductDetail}
            isWishlisted={wishlist.includes(selectedProductDetail.id)}
            onToggleWishlist={handleToggleWishlist}
            onOpenSellerStore={handleOpenSellerStore}
            onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
            showToast={showToast}
          />
        ) : (
          <>
            {/* ==================== 1. DYNAMIC PROMO BANNER SLIDER ==================== */}
            <HeroBannerSlider
              banners={sliderBanners}
              onSelectCategory={handleSelectCategoryFromNav}
              onSelectProduct={(pid) => {
                const matched = products.find((p) => p.id === pid);
                if (matched) handleSelectProductDetail(matched);
              }}
            />

            {/* ==================== 2. SHOP BY CATEGORY CIRCLES ==================== */}
            <CategoryNavGrid
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategoryFromNav}
            />

          {/* ==================== 3. CLEAN PRODUCT GRID ==================== */}
          <main id="explore" className="py-6 sm:py-10 bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              
              {/* Clean Control Bar with Count, Sort & Mobile Filters */}
              <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {selectedCategory && selectedCategory !== 'All' ? `${selectedCategory} Products` : 'All Products'} ({filteredProducts.length})
                </span>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Filter Trigger Button (lg:hidden) */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterDrawerOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-orange-700 transition-colors cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    <span>Filters</span>
                    {countActiveFilters(catalogFilters, searchQuery) > 0 && (
                      <span className="bg-white text-orange-600 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {countActiveFilters(catalogFilters, searchQuery)}
                      </span>
                    )}
                  </button>

                  {/* Smooth Inline Sorting Dropdown Menu Directly Underneath */}
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
                        isSortDropdownOpen
                          ? 'bg-orange-50 text-orange-600 border border-orange-300'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800'
                      }`}
                      aria-expanded={isSortDropdownOpen}
                      aria-label="Select Sorting Option"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
                      <span>{SORT_OPTIONS.find((s) => s.id === catalogFilters.sortBy)?.label || 'Sort'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180 text-orange-600' : ''}`} />
                    </button>

                    {isSortDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-40 animate-fadeIn divide-y divide-slate-100">
                        <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Sort Products By
                        </div>
                        <div className="py-1">
                          {SORT_OPTIONS.map((option) => {
                            const isSelected = catalogFilters.sortBy === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setCatalogFilters((prev) => ({ ...prev, sortBy: option.id }));
                                  setIsSortDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-orange-50/80 text-orange-600 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{option.iconLabel}</span>
                                  <span>{option.label}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filter Chips & Clear Action */}
              <ActiveFilterChips
                filters={catalogFilters}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onChange={setCatalogFilters}
                onResetAll={handleResetAllFilters}
                totalFilteredCount={filteredProducts.length}
              />

              {/* Two-Column Responsive Layout: Sticky Sidebar (Desktop) + Product Catalog */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Desktop Filter Sidebar */}
                <aside className="hidden lg:block w-64 xl:w-72 shrink-0 self-start sticky top-24">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <FilterSidebarContent
                      filters={catalogFilters}
                      onChange={setCatalogFilters}
                      products={products}
                      onReset={handleResetAllFilters}
                      maxCatalogPrice={maxCatalogPrice}
                    />
                  </div>
                </aside>

                {/* Slide-out Mobile Filter Drawer */}
                <MobileFilterDrawer
                  isOpen={isMobileFilterDrawerOpen}
                  onClose={() => setIsMobileFilterDrawerOpen(false)}
                  filters={catalogFilters}
                  onChange={setCatalogFilters}
                  products={products}
                  totalMatchesCount={filteredProducts.length}
                  onReset={handleResetAllFilters}
                  maxCatalogPrice={maxCatalogPrice}
                />

                {/* Product Catalog Grid Column */}
                <div className="flex-1 min-w-0 w-full">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="w-14 h-14 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-7 h-7 text-[#4F46E5]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] mb-1">কোনো পণ্য খুঁজে পাওয়া যায়নি</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                        No products match your selected combination of filters, price range, or search criteria.
                      </p>
                      <button
                        onClick={handleResetAllFilters}
                        className="px-5 py-2.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset / Clear All Filters</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onQuickView={handleSelectProductDetail}
                          onBuyNow={handleBuyNow}
                          isWishlisted={wishlist.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onOpenSellerStore={handleOpenSellerStore}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>

          {/* ==================== 5. YOUTUBE SUBSCRIPTION ৳20 BONUS PROMO ==================== */}
          <Suspense fallback={<SectionSkeleton />}>
            <YouTubeBonusBanner
              user={user}
              onClaimBonus={handleOpenBonusClaim}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </Suspense>

          {/* ==================== 6. BRAND TRUST BADGES & VALUE PROPOSITION ==================== */}
          <Suspense fallback={null}>
            <TrustValueProposition />
          </Suspense>
        </>
      )}
      </Suspense>

      {/* Multi-Column Localized Footer */}
      <Suspense fallback={null}>
        <Footer
          onGoHome={handleGoHome}
          onOpenOrders={handleOpenOrders}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSellerCenter={handleOpenSellerCenter}
          onOpenSellerStore={handleOpenSellerStore}
          onOpenAdmin={handleOpenAdmin}
          onDownloadHtml={handleDownloadStandaloneHtml}
          onOpenFaq={() => setIsFaqOpen(true)}
          onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
        />
      </Suspense>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2.5 animate-toastEnter">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            user={user}
            couponCode={couponCode}
            isCouponApplied={isCouponApplied}
            appliedCoupon={appliedCoupon}
            couponDiscount={couponDiscount}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            applyWalletBonus={applyWalletBonus}
            onToggleWalletBonus={setApplyWalletBonus}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              handleOpenCheckout();
            }}
            onViewOrders={handleOpenOrders}
            onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
          />
        </Suspense>
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <ProductDetailsModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </Suspense>
      )}

      {/* Auth & Wallet Modal */}
      {isAuthOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            user={user}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onVerifyPhoneSuccess={handleVerifyPhoneSuccess}
            onUpdateAddress={handleUpdateAddress}
            onLogout={handleLogout}
            onOpenCustomerPortal={handleOpenUserProfile}
          />
        </Suspense>
      )}

      {/* Code-Split Checkout Modal */}
      {isCheckoutOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            items={cart}
            user={user}
            subtotal={cartSubtotal}
            couponDiscount={couponDiscount}
            walletDeducted={applyWalletBonus && cartSubtotal > 0 ? Math.min(user.walletBalance, 20) : 0}
            couponCode={couponCode}
            isCouponApplied={isCouponApplied}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onPlaceOrder={handleCreateOrder}
            onClearCart={() => setCart([])}
            onViewOrders={handleOpenOrders}
            onVerifyPhoneSuccess={handleVerifyPhoneSuccess}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
          />
        </Suspense>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (Home, Categories, Search, Cart, Account) */}
      <MobileBottomNav
        activeNav={activePage}
        activeFilterTab={activeFilterTab}
        selectedCategory={selectedCategory}
        cartCount={totalCartCount}
        user={user}
        onGoHome={handleGoHome}
        onOpenCategories={() => {
          handleGoHome();
          setTimeout(() => {
            document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenSearch={() => setIsMobileSearchActive(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={user.isLoggedIn ? handleOpenUserProfile : () => setIsAuthOpen(true)}
        isSearchOpen={isMobileSearchActive}
        isCategoriesDrawerOpen={false}
      />

      {/* Floating Customer Support Widget */}
      <Suspense fallback={null}>
        <CustomerSupport
          onOpenFaq={() => setIsFaqOpen(true)}
          onOpenReturnPolicy={() => setIsFaqOpen(true)}
        />
      </Suspense>

      {/* Code-Split Interactive FAQ & Help Center Modal */}
      {isFaqOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <FaqModal
            isOpen={isFaqOpen}
            onClose={() => setIsFaqOpen(false)}
          />
        </Suspense>
      )}

      {/* YouTube Subscription Bonus Verification Modal */}
      {isYouTubeBonusModalOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <YouTubeBonusModal
            isOpen={isYouTubeBonusModalOpen}
            onClose={() => setIsYouTubeBonusModalOpen(false)}
            user={user}
            onUpdateUserWallet={(newBalance, newHistory) => {
              setUser((prev) => ({
                ...prev,
                walletBalance: newBalance,
                walletHistory: newHistory,
                hasClaimedYouTubeBonus: true,
              }));
            }}
            showToast={showToast}
          />
        </Suspense>
      )}

      {/* PWA Install Banner & Network Connection Ribbon */}
      <Suspense fallback={null}>
        <PwaInstallBanner showToast={showToast} />
      </Suspense>
      </div>
    </AuthProvider>
  );
}
