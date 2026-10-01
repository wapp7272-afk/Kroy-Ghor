import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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
  SlidersHorizontal
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
import { LoadingScreen } from './components/LoadingScreen';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ProductDetailView } from './components/ProductDetailView';
import { UserProfile as CustomerProfileView } from './components/UserProfile';
import { MyOrdersView } from './components/MyOrdersView';
import { SellerCenterView } from './components/SellerCenterView';
import { PublicSellerStoreView } from './components/PublicSellerStoreView';
import { HeroSection } from './components/HeroSection';
import { CategoryNavGrid } from './components/CategoryNavGrid';
import { FlashSaleSection } from './components/FlashSaleSection';
import { CinematicVideoShowcase } from './components/CinematicVideoShowcase';
import { TrustValueProposition } from './components/TrustValueProposition';
import { FeaturedYouTubeSection } from './components/FeaturedYouTubeSection';
import { INITIAL_PROMO_BANNERS } from './data/banners';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { CustomerSupport } from './components/CustomerSupport';
import { OrderTrackingPortal } from './components/OrderTrackingPortal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
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
} from './lib/firebaseAuth';
import { UserRole } from './types';

// Code-split heavy secondary view modals and admin components with React.lazy
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then((m) => ({ default: m.CheckoutModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const ReturnPolicyModal = lazy(() => import('./components/ReturnPolicyModal').then((m) => ({ default: m.ReturnPolicyModal })));
const FaqModal = lazy(() => import('./components/FaqModal').then((m) => ({ default: m.FaqModal })));

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

export default function App() {
  // State: Active Navigation Routing
  const [activePage, setActivePage] = useState<ActivePage>('Home');
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>('perfume-vault-bd');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

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

  // State: Vendor Payout Requests & Settlements
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    try {
      const saved = localStorage.getItem('primevault_payout_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'PAY-1082',
        sellerId: 'seller-1',
        sellerName: 'Perfume Vault BD',
        amount: 3200,
        method: 'bkash',
        account: '01883-418309',
        requestedAt: '2026-09-21 16:30',
        status: 'Completed',
        trxId: 'TRX-9BKASH291'
      },
      {
        id: 'PAY-1094',
        sellerId: 'seller-2',
        sellerName: 'Glow Lights Studio',
        amount: 1450,
        method: 'nagad',
        account: '01712-345678',
        requestedAt: '2026-09-23 11:15',
        status: 'Pending'
      },
      {
        id: 'PAY-1102',
        sellerId: 'seller-3',
        sellerName: 'Oudh & Attar Heritage',
        amount: 2800,
        method: 'bank',
        account: '102.120.9841',
        bankName: 'City Bank Ltd',
        requestedAt: '2026-09-23 14:40',
        status: 'Pending'
      }
    ];
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
    if (activePage === 'Store') {
      document.title = 'Brand Storefront | ZeropicBD';
    } else if (activePage === 'SellerCenter') {
      document.title = 'Merchant Seller Center | ZeropicBD';
    } else if (activePage === 'MyOrders' || activePage === 'UserProfile') {
      document.title = 'Customer Portal & Order History | ZeropicBD';
    } else if (activePage === 'TrackOrder') {
      document.title = 'Live Parcel Tracker & Courier Status | ZeropicBD';
    } else {
      document.title = 'ZeropicBD - Premium Marketplace & Lifestyle BD';
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

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveFilterTab('All');
    setCatalogFilters(INITIAL_FILTER_STATE);
    showToast('✓ All filters cleared');
  };

  const handleSelectCategoryFromNav = (cat: string) => {
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
  };

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

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : '❤️ Added to your Wishlist!');
      return updated;
    });
  };

  // State: Dynamic Products with LocalStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_products') || localStorage.getItem('primevault_products') || localStorage.getItem('zestflick_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return PRODUCTS;
  });

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // State: Orders with LocalStorage persistence
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('primevault_orders') || localStorage.getItem('zestflick_orders');
      if (saved) return JSON.parse(saved);
    } catch {
      return [];
    }
    return [
      {
        id: 'PVZ-91823',
        date: '2026-09-24 18:32',
        items: [
          { product: PRODUCTS[0], quantity: 1, selectedSize: '100ml' },
          { product: PRODUCTS[2], quantity: 2, selectedSize: 'Standard' }
        ],
        subtotal: 1850,
        discount: 185,
        walletDeducted: 20,
        deliveryFee: 60,
        total: 1705,
        paymentMethod: 'bkash',
        trxId: 'BKS90812391',
        address: {
          fullName: 'Tanvir Hossain',
          phone: '01712345678',
          cityDivision: 'Inside Dhaka',
          fullAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
          notes: 'Call before delivery'
        },
        status: 'Delivered',
        courierName: 'Pathao Express',
        trackingNumber: 'PT-91823BD'
      },
      {
        id: 'PVZ-82914',
        date: '2026-09-22 14:15',
        items: [
          { product: PRODUCTS[1], quantity: 1, selectedSize: '100ml' }
        ],
        subtotal: 890,
        discount: 0,
        walletDeducted: 0,
        deliveryFee: 120,
        total: 1010,
        paymentMethod: 'cod',
        address: {
          fullName: 'Rahim Ahmed',
          phone: '01898765432',
          cityDivision: 'Outside Dhaka',
          fullAddress: 'Agrabad C/A, Chattogram'
        },
        status: 'Processing',
        courierName: 'Steadfast Courier',
        trackingNumber: 'ST-82914BD'
      }
    ];
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
    return [
      {
        id: 'seller-1',
        storeName: 'PerfumeVault BD',
        slug: 'perfume-vault-bd',
        ownerName: 'Tanvir Ahmed',
        phone: '01883418309',
        email: 'tanvir@perfumevault.com',
        category: 'Luxury Perfumes',
        nidOrTradeLicense: '19942691234567890',
        payoutMethod: 'bkash',
        payoutAccount: '01883418309',
        status: 'Approved',
        createdAt: '2026-09-01 10:30',
        description: 'Authorized importer of niche French and Arabian perfumes in Bangladesh.'
      },
      {
        id: 'seller-2',
        storeName: 'Apex Tech BD',
        slug: 'apex-tech-bd',
        ownerName: 'Farhan Kabir',
        phone: '01711223344',
        email: 'farhan@apextech.bd',
        category: 'Electronic Gadgets',
        nidOrTradeLicense: 'TR-DH-892147',
        payoutMethod: 'bank',
        payoutAccount: '2050123456789',
        bankName: 'BRAC Bank Ltd',
        status: 'Approved',
        createdAt: '2026-09-10 14:00',
        description: 'Original RGB neon lamps, smart accessories, and aesthetic desk setups.'
      }
    ];
  });

  const [currentSellerId, setCurrentSellerId] = useState<string>('seller-1');

  // State: Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Seed permanent Super Admin / Owner account
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Product Management (Admin Handlers)
  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: `pvz-prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    api.products.create(newProductData).catch(() => {});
    showToast(`✓ Product "${newProduct.title}" added to store!`);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
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
    api.products.update(updatedProduct).catch(() => {});
    showToast(`✓ Product "${updatedProduct.title}" updated!`);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (quickViewProduct?.id === productId) {
      setQuickViewProduct(null);
    }
    if (selectedProductDetail?.id === productId) {
      setSelectedProductDetail(null);
      setActivePage('Home');
    }
    api.products.delete(productId).catch(() => {});
    showToast('✓ Product deleted from store.');
  };

  const handleBulkDeleteProducts = (productIds: string[]) => {
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
  const handleAddToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    if (product.inStock === false) {
      showToast(`⚠️ Sorry, "${product.title}" is out of stock!`);
      return;
    }

    const derivedStoreName = product.storeName || product.sellerName || (() => {
      const cat = product.category || '';
      if (cat.includes('Perfume') || cat === 'Attar Perfumes') return 'PerfumeVault BD';
      if (cat.includes('Gadgets') || cat === 'Glow Lights') return 'Apex Tech BD';
      if (cat.includes('Fashion')) return 'ZeropicBD Atelier';
      if (cat.includes('Watches')) return 'Chronos Official';
      if (cat.includes('Beauty')) return 'Glow & Glam BD';
      if (cat.includes('Home')) return 'Nordic Living';
      return 'ZeropicBD Official';
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
  };

  // Instant Buy Now trigger
  const handleBuyNow = (product: Product, quantity = 1, selectedSize?: string) => {
    handleAddToCart(product, quantity, selectedSize);
    setIsCheckoutOpen(true);
  };

  // Navigation Handlers memoized with useCallback to prevent re-renders
  const handleGoHome = useCallback(() => {
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
    setSelectedProductDetail(null);
    setActivePage('UserProfile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenUserProfile = useCallback(() => {
    setSelectedProductDetail(null);
    setActivePage('UserProfile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenSellerCenter = useCallback(() => {
    // RBAC Security Guard: Require authenticated user session for merchant center
    if (!user.isLoggedIn) {
      setIsAuthOpen(true);
      showToast('🔒 Please sign in to access the Merchant Seller Center.');
      return;
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
    setSelectedProductDetail(null);
    setActivePage('Store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [sellers]);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminOpen(true);
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
  const handleLogin = (
    name: string,
    email: string,
    phone: string,
    isPhoneVerified?: boolean,
    authProvider?: 'google' | 'phone' | 'email',
    avatar?: string
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

    const balance = matched?.walletBalance ?? (user.walletBalance > 0 ? user.walletBalance : 20);
    const verified = isPhoneVerified ?? matched?.isPhoneVerified ?? true;
    const history: WalletTransaction[] = matched?.walletHistory || user.walletHistory || [
      {
        id: `tx-welcome-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: 20,
        type: 'credit',
        description: 'Welcome Sign-up & Phone Verification Bonus'
      }
    ];

    // RBAC: Determine role
    const isEmailAdmin = (email || '').toLowerCase() === 'wapp7272@gmail.com';
    const isUserSeller = sellers.some(
      (s) => (email && s.email.toLowerCase() === email.toLowerCase()) || (cleanPhone && s.phone === cleanPhone)
    );
    const role: UserRole = isEmailAdmin ? 'admin' : isUserSeller ? 'seller' : 'customer';

    // Issue Bearer token session
    const session = createSession(email, cleanPhone, role);
    setStoredSession(session);

    const updatedUser: UserProfile = {
      isLoggedIn: true,
      name: name || matched?.name || 'ZeropicBD Member',
      email: email || matched?.email || '',
      phone: cleanPhone || matched?.phone || '',
      role,
      session,
      walletBalance: balance,
      hasReceivedBonus: true,
      isPhoneVerified: verified,
      authProvider: authProvider || matched?.authProvider || 'google',
      avatar: avatar || matched?.avatar,
      walletHistory: history,
      address: matched?.address ? { ...matched.address } : user.address
    };

    setUser(updatedUser);
    setIsAuthOpen(false);
    showToast(`✓ Welcome back, ${updatedUser.name}! (Role: ${role.toUpperCase()})`);
  };

  const handleSignup = (
    name: string,
    email: string,
    phone: string,
    address: Address,
    isPhoneVerified?: boolean,
    authProvider?: 'google' | 'phone' | 'email',
    avatar?: string
  ) => {
    const bonus = 20;
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const welcomeTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: bonus,
      type: 'credit',
      description: 'Welcome Sign-up & Phone Verification Bonus'
    };

    const isEmailAdmin = (email || '').toLowerCase() === 'wapp7272@gmail.com';
    const role: UserRole = isEmailAdmin ? 'admin' : 'customer';
    const session = createSession(email, cleanPhone, role);
    setStoredSession(session);

    const newUser: UserProfile = {
      isLoggedIn: true,
      name: name || 'ZeropicBD Member',
      email: email || '',
      phone: cleanPhone,
      role,
      session,
      walletBalance: bonus,
      hasReceivedBonus: true,
      isPhoneVerified: isPhoneVerified ?? true,
      authProvider: authProvider || 'google',
      avatar: avatar,
      walletHistory: [welcomeTx],
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

  const handleCreateOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);

    // Asynchronous API client layer call with automatic fallback
    api.orders.create(order).catch(() => {});
    api.cart.clear().catch(() => {});

    if (order.walletDeducted > 0) {
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white relative pb-24 md:pb-0">
      {/* Animated Loading Screen */}
      <LoadingScreen />

      {/* Header with High-Converting Announcement Bar & Secondary Navbar */}
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
      />

      {/* Active Page Routing Router */}
      {activePage === 'UserProfile' || activePage === 'MyOrders' ? (
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
          onUpdateSavedAddresses={(addresses: Address[]) => {
            setUser((prev) => ({ ...prev, savedAddresses: addresses }));
          }}
          onLogout={handleLogout}
          onBackToShop={handleGoHome}
          onOpenAuth={() => setIsAuthOpen(true)}
          initialTab={activePage === 'MyOrders' ? 'orders' : 'overview'}
          onSubmitReturnRequest={handleSubmitReturnRequest}
          onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
          onTrackOrder={handleOpenTrackOrder}
          onOpenAdmin={() => setIsAdminOpen(true)}
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
          {/* ==================== 1. HERO PROMO BANNER CAROUSEL ==================== */}
          <HeroSection
            banners={bannerSettings.promoBanners || INITIAL_PROMO_BANNERS}
            products={products}
            onSelectProduct={handleSelectProductDetail}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
            onSelectCategory={handleSelectCategoryFromNav}
            onSelectFilterTab={(tab) => {
              setActiveFilterTab(tab);
              if (tab !== 'All') {
                const el = document.getElementById('explore');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            bannerSettings={bannerSettings}
            showToast={showToast}
          />

          {/* ==================== 2. POPULAR CATEGORIES GRID ==================== */}
          <CategoryNavGrid
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategoryFromNav}
          />

          {/* ==================== 3. FLASH SALES & SPECIAL DEALS ==================== */}
          <FlashSaleSection
            products={products}
            onSelectProduct={handleSelectProductDetail}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onViewMoreDeals={() => {
              setActiveFilterTab('Flash Sale');
              setSelectedCategory('All');
              const el = document.getElementById('explore');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectCategory={handleSelectCategoryFromNav}
          />

          {/* ==================== 4. FEATURED MULTI-CATEGORY PRODUCTS (PHASE 4 FILTER ENGINE) ==================== */}
          <main id="explore" className="py-10 lg:py-16 bg-[#F9FAFB] border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              
              {/* Section Header with Dynamic Sorting & Mobile Filter Trigger */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#4F46E5] font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>CURATED MULTI-CATEGORY MARKETPLACE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    Featured Marketplace Products
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Explore authentic fragrances, smart electronics, designer fashion, luxury watches & home wellness.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                  {/* Results Count Badge */}
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                    Showing {filteredProducts.length} items
                  </span>

                  {/* Mobile Filter Trigger Button (lg:hidden) */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterDrawerOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#4338CA] transition-colors cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    <span>Filters</span>
                    {countActiveFilters(catalogFilters, searchQuery) > 0 && (
                      <span className="bg-white text-[#4F46E5] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {countActiveFilters(catalogFilters, searchQuery)}
                      </span>
                    )}
                  </button>

                  {/* Dynamic Sorting Engine Dropdown */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label htmlFor="catalog-sort-select" className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</label>
                    <div className="relative">
                      <select
                        id="catalog-sort-select"
                        value={catalogFilters.sortBy}
                        onChange={(e) => setCatalogFilters((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))}
                        className="text-xs font-bold bg-white border border-slate-300 rounded-lg pl-3 pr-7 py-1.5 text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer shadow-2xs appearance-none"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.iconLabel} {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Sorting Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B]" /> Instant Sort:
                </span>
                {SORT_OPTIONS.map((opt) => {
                  const isActive = catalogFilters.sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCatalogFilters((prev) => ({ ...prev, sortBy: opt.id }))}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#0F172A] text-white font-bold shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span>{opt.iconLabel}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Department Quick Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
                {[
                  { id: 'all', label: 'All Curated', icon: '🌟', cat: 'All' },
                  { id: 'perfumes', label: 'Perfumes & Attars', icon: '✨', cat: 'Perfumes & Attars' },
                  { id: 'gadgets', label: 'Electronics & Tech', icon: '📱', cat: 'Electronics & Tech' },
                  { id: 'fashion', label: 'Fashion & Lifestyle', icon: '👔', cat: 'Fashion & Lifestyle' },
                  { id: 'watches', label: 'Watches & Accessories', icon: '⌚', cat: 'Watches & Accessories' },
                  { id: 'beauty', label: 'Beauty & Skincare', icon: '💄', cat: 'Beauty & Skincare' },
                  { id: 'home', label: 'Home Living', icon: '🏠', cat: 'Home Living' },
                  { id: 'gifts', label: 'Luxury Gifts', icon: '🎁', cat: 'Luxury Gifts & Bricks' },
                ].map((tab) => {
                  const isAll = tab.cat === 'All';
                  const isActive = isAll 
                    ? catalogFilters.categories.length === 0 && selectedCategory === 'All'
                    : catalogFilters.categories.includes(tab.cat);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (isAll) {
                          setSelectedCategory('All');
                          setCatalogFilters((prev) => ({ ...prev, categories: [] }));
                        } else {
                          setSelectedCategory(tab.cat);
                          setCatalogFilters((prev) => ({ ...prev, categories: [tab.cat] }));
                        }
                      }}
                      className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#4F46E5] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
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
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Or browse popular departments:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            'Perfumes & Attars',
                            'Electronics & Tech',
                            'Fashion & Lifestyle',
                            'Watches & Accessories',
                            'Beauty & Skincare'
                          ].map((dept) => (
                            <button
                              key={dept}
                              onClick={() => {
                                setCatalogFilters({
                                  ...INITIAL_FILTER_STATE,
                                  categories: [dept],
                                });
                                setSearchQuery('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onQuickView={(p) => handleSelectProductDetail(p)}
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

          {/* ==================== 5. AI CINEMATIC VIDEO SHOWCASE ==================== */}
          <CinematicVideoShowcase
            featuredProduct={featuredProduct}
            onSelectProduct={handleSelectProductDetail}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
            bannerSettings={bannerSettings}
            onOpenAdmin={handleOpenAdmin}
          />

          {/* ==================== 6. TRUST BADGES & VALUE PROPOSITION ==================== */}
          <TrustValueProposition />

          {/* Value Proposition Highlights */}
          <section className="py-10 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-lg bg-[#F9FAFB] border border-slate-200 transition-colors shadow-2xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-md bg-indigo-50 text-[#4F46E5] border border-indigo-100 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A] mb-1">১০০% অথেনটিক কোয়ালিটি</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    অরিজিনাল ব্র্যান্ডের পারফিউম, গ্যাজেটস ও বিশ্বস্ত ভেরিফাইড সেলারদের পণ্য নিশ্চয়তা।
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[#F9FAFB] border border-slate-200 transition-colors shadow-2xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-md bg-indigo-50 text-[#4F46E5] border border-indigo-100 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A] mb-1">সারা বাংলাদেশে ফাস্ট হোম ডেলিভারি</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ঢাকার ভিতরে মাত্র ৳৬০ এবং বাইরে ৳১২০ তে ক্যাশ অন ডেলিভারিতে সরাসরি পৌঁছানো হয়।
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-[#F9FAFB] border border-slate-200 transition-colors shadow-2xs flex items-start gap-3.5">
                <div className="p-2.5 rounded-md bg-indigo-50 text-[#4F46E5] border border-indigo-100 shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A] mb-1">ইনস্ট্যান্ট ওয়ালেট বোনাস ও ছাড়</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    সাইনআপ করলেই ওয়ালেটে ৳২০ বোনাস এবং <strong className="text-[#4F46E5]">VAULT10</strong> কোডে ১০% ছাড়।
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Multi-Column Localized Footer */}
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

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-4 z-50 px-4 py-3 rounded-xl bg-[#171717] text-white text-xs font-bold shadow-xl flex items-center gap-2.5 animate-slideLeft">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Shopping Cart Drawer */}
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
          setIsCheckoutOpen(true);
        }}
        onViewOrders={handleOpenOrders}
        onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
      />

      {/* Product Quick View Modal */}
      <ProductDetailsModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Auth & Wallet Modal */}
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

      {/* Code-Split Admin Dashboard */}
      {isAdminOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <AdminDashboard
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
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
              setIsAdminOpen(false);
              handleOpenSellerStore(slug);
            }}
            onGoShop={handleGoHome}
            onGoOrders={handleOpenOrders}
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
        onOpenCategories={() => setIsMobileCategoriesOpen(true)}
        onOpenSearch={() => setIsMobileSearchActive(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={user.isLoggedIn ? handleOpenUserProfile : () => setIsAuthOpen(true)}
        isSearchOpen={isMobileSearchActive}
        isCategoriesDrawerOpen={isMobileCategoriesOpen}
      />

      {/* Floating Customer Support Widget */}
      <CustomerSupport
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenReturnPolicy={() => setIsReturnPolicyOpen(true)}
      />

      {/* Code-Split 7-Day Hassle-Free Replacement & Return Policy Modal */}
      {isReturnPolicyOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <ReturnPolicyModal
            isOpen={isReturnPolicyOpen}
            onClose={() => setIsReturnPolicyOpen(false)}
            onOpenOrders={handleOpenOrders}
          />
        </Suspense>
      )}

      {/* Code-Split Interactive FAQ & Help Center Modal */}
      {isFaqOpen && (
        <Suspense fallback={<ModalSuspenseFallback />}>
          <FaqModal
            isOpen={isFaqOpen}
            onClose={() => setIsFaqOpen(false)}
            onOpenReturnPolicy={() => {
              setIsFaqOpen(false);
              setIsReturnPolicyOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* PWA Install Banner & Network Connection Ribbon */}
      <PwaInstallBanner showToast={showToast} />
    </div>
  );
}
