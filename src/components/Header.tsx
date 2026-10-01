import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Sparkles, 
  Wallet, 
  X,
  Code2,
  CheckCircle,
  ShieldCheck,
  Package,
  Heart,
  Store,
  HelpCircle,
  PhoneCall,
  Menu,
  ChevronDown,
  Zap,
  Tag,
  Flame,
  Layers,
  Watch,
  Smartphone,
  Gift,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
  Check,
  Truck
} from 'lucide-react';
import { UserProfile, SystemBannerSettings, Product } from '../types';
import { VaultLogo } from './VaultLogo';
import { checkIsAdmin, checkIsSuperAdmin } from '../services/authService';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: UserProfile;
  ordersCount?: number;
  wishlistCount?: number;
  onOpenAuth: () => void;
  onOpenOrders?: () => void;
  onOpenWishlist?: () => void;
  onOpenSellerCenter?: () => void;
  onOpenSellerStore?: (slug: string) => void;
  onDownloadHtml: () => void;
  onOpenAdmin: () => void;
  onGoHome?: () => void;
  onSelectCategory?: (category: string) => void;
  onSelectFilterTab?: (tab: 'All' | 'Flash Sale' | 'Best Deals' | 'New Arrivals') => void;
  activeFilterTab?: string;
  activeNav?: string;
  bannerSettings?: SystemBannerSettings;
  // Enhanced search & discovery props
  products?: Product[];
  selectedCategory?: string;
  onSelectProduct?: (product: Product) => void;
  isMobileCategoriesOpen?: boolean;
  onToggleMobileCategories?: (open: boolean) => void;
  isMobileSearchActive?: boolean;
  onToggleMobileSearch?: (open: boolean) => void;
  onOpenUserProfile?: () => void;
  onOpenTrackOrder?: () => void;
}

export const CATEGORY_DROPDOWN_ITEMS = [
  { name: 'Perfume & Fragrances', icon: '✨', count: '240+ Items', badge: 'Popular', desc: 'Luxury French EDPs & Pure Attars' },
  { name: 'Beauty & Personal Care', icon: '💄', count: '150+ Items', badge: 'Verified', desc: 'Grooming kits & organic skincare' },
  { name: 'Electronics & Gadgets', icon: '📱', count: '95+ Items', badge: 'Hot Deal', desc: 'Ambient glow lamps & tech accessories' },
  { name: 'Fashion & Lifestyle', icon: '👔', count: '180+ Items', badge: 'Trending', desc: 'Premium shirts & leather goods' },
  { name: 'Home & Living', icon: '🏠', count: '110+ Items', badge: 'Curated', desc: 'Aroma diffusers & home decor' },
  { name: 'Watches & Accessories', icon: '⌚', count: '80+ Items', badge: 'Luxury', desc: 'Chronograph watches & sunglasses' },
  { name: 'Premium Gifts', icon: '🎁', count: '70+ Items', badge: 'Exclusive', desc: 'Brick toys & luxury gift hampers' },
];

export const POPULAR_SEARCH_TAGS = [
  'Cool Water',
  'Bleu De Chanel',
  'Sauvage Dior',
  'Tom Ford Black Orchid',
  'Attar Mukhallat',
  'Ambient Glow Lamp',
  'Sandalwood Beard Care',
  'Ultrasonic Aroma Diffuser',
  'Chronograph Watch',
  'Flash Sale Deals'
];

export const SEARCH_CATEGORY_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  { value: 'Perfume & Fragrances', label: 'Perfumes & Attars' },
  { value: 'Beauty & Personal Care', label: 'Beauty & Grooming' },
  { value: 'Electronics & Gadgets', label: 'Electronics & Gadgets' },
  { value: 'Fashion & Lifestyle', label: 'Fashion & Lifestyle' },
  { value: 'Home & Living', label: 'Home & Living' },
  { value: 'Watches & Accessories', label: 'Watches & Accessories' },
  { value: 'Premium Gifts', label: 'Premium Gifts' },
];

export const MOBILE_QUICK_CATEGORIES = [
  { name: 'All', label: 'All', icon: '⚡' },
  { name: 'Perfume & Fragrances', label: 'Perfumes', icon: '✨' },
  { name: 'Beauty & Personal Care', label: 'Beauty', icon: '💄' },
  { name: 'Electronics & Gadgets', label: 'Gadgets', icon: '📱' },
  { name: 'Fashion & Lifestyle', label: 'Fashion', icon: '👔' },
  { name: 'Home & Living', label: 'Home', icon: '🏠' },
  { name: 'Watches & Accessories', label: 'Watches', icon: '⌚' },
  { name: 'Premium Gifts', label: 'Gifts', icon: '🎁' },
];

export const Header: React.FC<HeaderProps> = React.memo(({
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  user,
  ordersCount = 0,
  wishlistCount = 0,
  onOpenAuth,
  onOpenOrders,
  onOpenWishlist,
  onOpenSellerCenter,
  onOpenSellerStore,
  onDownloadHtml,
  onOpenAdmin,
  onGoHome,
  onSelectCategory,
  onSelectFilterTab,
  activeFilterTab = 'All',
  activeNav = 'Home',
  bannerSettings,
  products = [],
  selectedCategory = 'All',
  onSelectProduct,
  isMobileCategoriesOpen = false,
  onToggleMobileCategories,
  isMobileSearchActive = false,
  onToggleMobileSearch,
  onOpenUserProfile,
  onOpenTrackOrder,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  
  const isUserAdmin = checkIsAdmin(user);
  const isUserSuperAdmin = checkIsSuperAdmin(user);

  // Multi-Category Search states
  const [searchCategory, setSearchCategory] = useState<string>(selectedCategory || 'All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [internalCategorySheetOpen, setInternalCategorySheetOpen] = useState(false);
  const [internalSearchModalOpen, setInternalSearchModalOpen] = useState(false);

  // Sync searchCategory when selectedCategory changes externally
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      setSearchCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Synchronize category sheet and search overlay with props
  const isCategorySheetOpen = isMobileCategoriesOpen || internalCategorySheetOpen;
  const isSearchOverlayOpen = isMobileSearchActive || internalSearchModalOpen;

  const handleCloseCategorySheet = () => {
    setInternalCategorySheetOpen(false);
    if (onToggleMobileCategories) onToggleMobileCategories(false);
  };

  const handleCloseSearchOverlay = () => {
    setInternalSearchModalOpen(false);
    if (onToggleMobileSearch) onToggleMobileSearch(false);
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Recent Search History with LocalStorage persistence
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zeropicbd_recent_searches') || localStorage.getItem('primevault_recent_searches');
      return saved ? JSON.parse(saved) : ['Cool Water', 'Bleu De Chanel', 'Attar Mukhallat'];
    } catch {
      return ['Cool Water', 'Bleu De Chanel', 'Attar Mukhallat'];
    }
  });

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('zeropicbd_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== item);
      try {
        localStorage.setItem('zeropicbd_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('zeropicbd_recent_searches');
      localStorage.removeItem('primevault_recent_searches');
    } catch {}
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus mobile input when search overlay opens
  useEffect(() => {
    if (isSearchOverlayOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOverlayOpen]);

  // Real-time matching products calculation
  const matchingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // 1. Filter by selected category in search dropdown
      if (searchCategory !== 'All') {
        let matchesCat = false;
        if (searchCategory === 'Perfume & Fragrances' || searchCategory === 'Perfume') {
          matchesCat = p.category === 'Perfume' || p.category === 'Attar Perfumes' || p.category === 'Perfume & Fragrances';
        } else if (searchCategory === 'Electronics & Gadgets') {
          matchesCat = p.category === 'Electronics & Gadgets' || p.category === 'Glow Lights';
        } else if (searchCategory === 'Beauty & Personal Care') {
          matchesCat = p.category === 'Beauty & Personal Care';
        } else if (searchCategory === 'Fashion & Lifestyle') {
          matchesCat = p.category === 'Fashion & Lifestyle';
        } else if (searchCategory === 'Home & Living') {
          matchesCat = p.category === 'Home & Living';
        } else if (searchCategory === 'Watches & Accessories') {
          matchesCat = p.category === 'Watches & Accessories';
        } else if (searchCategory === 'Premium Gifts') {
          matchesCat = p.category === 'Premium Gifts' || p.category === 'Notebooks' || p.category === 'Bricks Toys';
        } else {
          matchesCat = p.category.toLowerCase().includes(searchCategory.toLowerCase());
        }
        if (!matchesCat) return false;
      }

      // 2. Filter by search query
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.features && p.features.some((f) => f.toLowerCase().includes(q))) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }).slice(0, 5);
  }, [products, searchQuery, searchCategory]);

  // Real-time matching category chips
  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return CATEGORY_DROPDOWN_ITEMS.filter((c) =>
      c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleDownloadClick = () => {
    onDownloadHtml();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleLogoOrHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onGoHome) onGoHome();
    if (onSelectFilterTab) onSelectFilterTab('All');
    if (onSelectCategory) onSelectCategory('All');
    setIsSearchFocused(false);
    handleCloseSearchOverlay();
    handleCloseCategorySheet();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSuggestedProduct = (product: Product) => {
    saveSearchQuery(product.title);
    setIsSearchFocused(false);
    handleCloseSearchOverlay();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onSearchChange(product.title);
    }
  };

  const handleSelectSearchTag = (tag: string) => {
    onSearchChange(tag);
    saveSearchQuery(tag);
    setIsSearchFocused(false);
    handleCloseSearchOverlay();
    if (onGoHome) onGoHome();
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryPillClick = (catName: string) => {
    setSearchCategory(catName);
    if (onSelectCategory) onSelectCategory(catName);
    if (onGoHome) onGoHome();
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery);
    }
    setIsSearchFocused(false);
    handleCloseSearchOverlay();
    if (onGoHome) onGoHome();
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 transition-all shadow-2xs">
        {/* ================= 1. SLIM ANNOUNCEMENT TOPBAR ================= */}
        <div className="bg-[#0F172A] text-slate-300 px-3 sm:px-4 py-1.5 text-xs font-medium border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none min-w-0">
              <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold text-[#F59E0B] shrink-0">
                {bannerSettings?.announcementBadge || '⚡ Flash Offer'}
              </span>
              <span className="text-slate-200 text-[11px] sm:text-xs truncate">
                {bannerSettings?.announcementText || 'Free Express Delivery in Dhaka | 🇧🇩 100% Genuine Guaranteed'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
              {onOpenTrackOrder && (
                <button
                  onClick={onOpenTrackOrder}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold text-slate-200 cursor-pointer"
                  title="Track parcel delivery live"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Track Order</span>
                </button>
              )}
              {onOpenSellerCenter && (
                <button 
                  onClick={onOpenSellerCenter}
                  className="hover:text-white transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Seller Center</span>
                </button>
              )}
              <button
                id="topbar-admin-portal-link"
                onClick={onOpenAdmin}
                className="hover:text-[#F59E0B] transition-colors flex items-center gap-1 font-medium cursor-pointer"
                title="Open Secure Admin Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Portal</span>
              </button>
              <a href="tel:01883418309" className="hover:text-white transition-colors flex items-center gap-1">
                <PhoneCall className="w-3 h-3" />
                <span>Helpline: {bannerSettings?.helplineNumber || '01883-418309'}</span>
              </a>
              <span className="text-slate-600">|</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[#00C6FF] font-mono text-[11px] font-semibold">
                Code: ZEROPIC10
              </span>
            </div>
          </div>
        </div>

        {/* ================= 2. MAIN BRAND & SEARCH BAR ================= */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-18 flex items-center justify-between gap-2 sm:gap-4 md:gap-6 bg-white">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button 
              onClick={handleLogoOrHomeClick}
              className="flex items-center text-left focus:outline-none cursor-pointer shrink-0"
              aria-label="ZeropicBD Home"
            >
              <VaultLogo size="md" />
            </button>
          </div>

          {/* Desktop Multi-Category Search & Discovery Bar */}
          <div className="flex-1 max-w-2xl hidden md:block relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              {/* Category Selector Dropdown Prefix */}
              <div className="relative shrink-0">
                <select
                  id="desktop-search-category-select"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-10 pl-3 pr-7 bg-slate-100 hover:bg-slate-200/80 border-y border-l border-slate-200 rounded-l-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] appearance-none cursor-pointer transition-colors"
                >
                  {SEARCH_CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Text Input */}
              <div className="relative flex-1">
                <input
                  id="header-search-input-desktop"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={
                    searchCategory !== 'All'
                      ? `Search in ${searchCategory}...`
                      : 'Search perfumes, lifestyle, brands & categories...'
                  }
                  className="w-full h-10 pl-3 pr-10 bg-slate-50 border-y border-slate-200 text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#4F46E5] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="h-10 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-r-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Desktop Real-time Search & Discovery Dropdown Panel */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
                {/* Header status */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>
                    {searchQuery ? `Instant matches for "${searchQuery}"` : 'Smart Catalog Discovery'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {searchCategory !== 'All' ? `Filtering: ${searchCategory}` : 'All Categories'}
                  </span>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3.5">
                  {/* Matching Categories if typing */}
                  {matchingCategories.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <Layers className="w-3 h-3 text-[#4F46E5]" />
                        <span>Matching Categories</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingCategories.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => {
                              handleCategoryPillClick(c.name);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>{c.icon}</span>
                            <span>{c.name}</span>
                            <span className="text-[10px] text-indigo-400 ml-1">({c.count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Products Live Preview */}
                  {matchingProducts.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-[#4F46E5]" />
                          <span>Suggested Products ({matchingProducts.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Click to quick view</span>
                      </div>
                      <div className="space-y-1">
                        {matchingProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectSuggestedProduct(p)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#0F172A] group-hover:text-[#4F46E5] truncate transition-colors">
                                  {p.title}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium">
                                    {p.category}
                                  </span>
                                  {p.tag && (
                                    <span className="text-amber-700 font-medium">
                                      • {p.tag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs font-bold font-mono text-[#0F172A]">
                                ৳{p.price.toLocaleString()}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No exact product titles matching &quot;{searchQuery}&quot;. Try popular search tags below.
                    </div>
                  ) : null}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Recent Searches</span>
                        </span>
                        <button
                          onClick={handleClearAllRecentSearches}
                          className="text-[10px] text-slate-400 hover:text-rose-600 lowercase cursor-pointer"
                        >
                          Clear history
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((item) => (
                          <div
                            key={item}
                            onClick={() => handleSelectSearchTag(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 text-xs text-slate-700 cursor-pointer transition-colors"
                          >
                            <span>{item}</span>
                            <button
                              onClick={(e) => handleRemoveRecentSearch(e, item)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Remove"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Search Tags */}
                  <div className="border-t border-slate-100 pt-2.5">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Flame className="w-3 h-3 text-[#F59E0B]" />
                      <span>Popular Trending Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleSelectSearchTag(tag)}
                          className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 text-xs text-slate-700 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter ↵</kbd> to view all matching results
                  </span>
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs font-semibold text-[#4F46E5] hover:underline cursor-pointer"
                  >
                    View All Results →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons Cluster (Desktop & Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Trigger Icon (opens Search Overlay) */}
            <button
              onClick={() => {
                if (onToggleMobileSearch) {
                  onToggleMobileSearch(true);
                } else {
                  setInternalSearchModalOpen(true);
                }
              }}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Open Search"
              aria-label="Open Search"
            >
              <Search className="w-4.5 h-4.5 text-slate-700" />
            </button>

            {/* Wishlist Button (Desktop) */}
            {onOpenWishlist && (
              <button
                id="header-wishlist-btn"
                onClick={onOpenWishlist}
                className="hidden md:flex relative p-2 rounded-lg text-slate-600 hover:text-[#4F46E5] hover:bg-slate-50 transition-colors cursor-pointer"
                title="Saved Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[17px] h-4 px-1 bg-[#4F46E5] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* User Wallet Badge (Responsive) */}
            <button
              id="header-wallet-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-[#F3F7FF] hover:bg-blue-50 border border-blue-200/80 text-[#007BFF] text-xs font-semibold transition-colors cursor-pointer active:scale-98 shrink-0"
              title="ZeropicBD Wallet Balance"
            >
              <Wallet className="w-3.5 h-3.5 text-[#007BFF] shrink-0" />
              <span className="font-mono text-xs font-bold">৳{user.walletBalance}</span>
            </button>

            {/* Orders Tracking Button (Desktop) */}
            {onOpenOrders && (
              <button
                id="header-orders-btn"
                onClick={onOpenOrders}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#007BFF] hover:bg-[#F3F7FF] border border-transparent text-xs font-medium transition-colors cursor-pointer"
                title="My Orders & Live Tracking"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>Orders</span>
                {ordersCount > 0 && (
                  <span className="min-w-[18px] h-4.5 px-1.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono font-bold flex items-center justify-center">
                    {ordersCount}
                  </span>
                )}
              </button>
            )}

            {/* Super Admin Dashboard Button (Dynamic & Prominent for Owner/Admin) */}
            {isUserAdmin && onOpenAdmin && (
              <button
                id="header-super-admin-btn"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#7A3BFF] to-[#007BFF] hover:opacity-95 text-white text-xs font-black shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer shrink-0"
                title={isUserSuperAdmin ? "Super Admin & Owner Control Panel (wapp7272@gmail.com)" : "Admin Dashboard"}
              >
                <ShieldCheck className="w-4 h-4 text-amber-200" />
                <span className="hidden md:inline">
                  {isUserSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
                </span>
                <span className="md:hidden">Admin</span>
                {isUserSuperAdmin && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-mono font-bold">
                    OWNER
                  </span>
                )}
              </button>
            )}

            {/* User Account Button (Desktop) */}
            <button
              id="header-profile-btn"
              onClick={user.isLoggedIn && onOpenUserProfile ? onOpenUserProfile : onOpenAuth}
              className="hidden sm:flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[#0A1B3D] hover:bg-[#F3F7FF] border border-slate-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
              title="Account & Profile Settings"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#007BFF] text-white flex items-center justify-center text-xs font-bold">
                {user.isLoggedIn ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] text-slate-400 leading-none">
                  {user.isLoggedIn ? 'Hello,' : 'Sign in'}
                </span>
                <span className="font-semibold text-xs text-[#0A1B3D] truncate max-w-[85px] leading-tight">
                  {user.isLoggedIn ? user.name : 'Account'}
                </span>
              </div>
            </button>

            {/* Shopping Cart Button with Live Badge (Matches HEADER PREVIEW) */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="relative px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
              aria-label={`Shopping Cart (${cartCount} items)`}
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              {cartCount > 0 && (
                <span 
                  id="header-cart-badge-count"
                  className="min-w-[18px] h-4.5 px-1 bg-[#00C6FF] text-[#0A1B3D] text-[10px] font-black rounded-full flex items-center justify-center shadow-xs"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* ================= 3. MOBILE STICKY SEARCH ROW ================= */}
        <div className="md:hidden px-3 pt-1.5 pb-2.5 bg-white border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            {/* Mobile Category Dropdown Selector */}
            <div className="relative shrink-0">
              <select
                id="mobile-search-category-select"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="h-10 min-h-[40px] pl-2.5 pr-6 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] appearance-none max-w-[110px] truncate"
              >
                {SEARCH_CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <input
                id="header-search-input-mobile"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => {
                  if (onToggleMobileSearch) {
                    onToggleMobileSearch(true);
                  } else {
                    setInternalSearchModalOpen(true);
                  }
                }}
                placeholder={
                  searchCategory !== 'All'
                    ? `Search in ${searchCategory}...`
                    : 'Search products, brands...'
                }
                className="w-full h-10 min-h-[40px] pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Action Button */}
            <button
              type="submit"
              className="h-10 min-h-[40px] px-3 bg-[#007BFF] hover:bg-[#0056B3] text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95 cursor-pointer shadow-xs"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Carousel for Mobile with Smooth Touch Momentum */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pt-2 pb-0.5">
            {MOBILE_QUICK_CATEGORIES.map((cat) => {
              const isActive = (selectedCategory || 'All') === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryPillClick(cat.name)}
                  className={`px-3 py-1.5 min-h-[38px] rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-[#007BFF] text-white font-semibold shadow-xs'
                      : 'bg-[#F3F7FF] hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= 4. SECONDARY DESKTOP NAVIGATION BAR ================= */}
        <div className="border-t border-slate-100 bg-white hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
              {/* Home */}
              <button
                id="nav-link-home"
                onClick={handleLogoOrHomeClick}
                className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeNav === 'Home' && activeFilterTab === 'All' && selectedCategory === 'All'
                    ? 'text-[#007BFF] font-semibold bg-[#F3F7FF]'
                    : 'hover:text-[#0A1B3D] hover:bg-[#F3F7FF]'
                }`}
              >
                <span>Home</span>
              </button>

              {/* All Categories Dropdown Trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="nav-link-categories-dropdown"
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    categoriesDropdownOpen || (selectedCategory && selectedCategory !== 'All')
                      ? 'text-[#007BFF] font-semibold bg-[#F3F7FF]'
                      : 'hover:text-[#0A1B3D] hover:bg-[#F3F7FF]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {selectedCategory && selectedCategory !== 'All' ? selectedCategory : 'All Categories'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180 text-[#007BFF]' : 'text-slate-400'}`} />
                </button>

                {/* Categories Dropdown Menu */}
                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span>Marketplace Categories</span>
                      <span className="text-[10px] text-[#4F46E5] font-semibold">8 Departments</span>
                    </div>
                    {CATEGORY_DROPDOWN_ITEMS.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          if (onGoHome) onGoHome();
                          if (onSelectCategory) onSelectCategory(item.name);
                          setSearchCategory(item.name);
                          setCategoriesDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-xs transition-colors cursor-pointer ${
                          selectedCategory === item.name
                            ? 'bg-indigo-50 text-[#4F46E5] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{item.icon}</span>
                          <div className="truncate">
                            <span className="font-medium block leading-tight">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">{item.count}</span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1.5">
                      <button
                        onClick={() => {
                          if (onGoHome) onGoHome();
                          if (onSelectCategory) onSelectCategory('All');
                          setSearchCategory('All');
                          setCategoriesDropdownOpen(false);
                        }}
                        className="w-full text-center py-1 text-[11px] font-semibold text-[#4F46E5] hover:underline cursor-pointer"
                      >
                        View All Categories (Reset)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Flash Sale */}
              <button
                id="nav-link-flash-sale"
                onClick={() => {
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('Flash Sale');
                }}
                className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeFilterTab === 'Flash Sale'
                    ? 'text-[#4F46E5] font-semibold bg-indigo-50/80'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Flash Sale</span>
                <span className="text-[#F59E0B]">⚡</span>
              </button>

              {/* Best Deals */}
              <button
                id="nav-link-best-deals"
                onClick={() => {
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('Best Deals');
                }}
                className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeFilterTab === 'Best Deals'
                    ? 'text-[#4F46E5] font-semibold bg-indigo-50/80'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Best Deals</span>
                <span>🏷️</span>
              </button>

              {/* New Arrivals */}
              <button
                id="nav-link-new-arrivals"
                onClick={() => {
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('New Arrivals');
                }}
                className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeFilterTab === 'New Arrivals'
                    ? 'text-[#4F46E5] font-semibold bg-indigo-50/80'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>New Arrivals</span>
                <span>✨</span>
              </button>

              {/* Brand Store */}
              {onOpenSellerStore && (
                <button
                  id="nav-link-brand-store"
                  onClick={() => onOpenSellerStore('perfume-vault-bd')}
                  className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-medium ${
                    activeNav === 'Store'
                      ? 'text-white bg-[#4F46E5]'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                  title="Browse Verified Brand Storefronts"
                >
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>Brand Store</span>
                </button>
              )}

              {/* Track Order */}
              {onOpenTrackOrder && (
                <button
                  id="nav-link-track-order"
                  onClick={onOpenTrackOrder}
                  className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-medium ${
                    activeNav === 'TrackOrder'
                      ? 'text-white bg-[#4F46E5]'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                  title="Track any parcel live by Order ID or Phone"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Track Order</span>
                </button>
              )}

              {/* Become a Seller */}
              {onOpenSellerCenter && (
                <button
                  id="nav-link-become-seller"
                  onClick={onOpenSellerCenter}
                  className={`relative px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-medium ${
                    activeNav === 'SellerCenter'
                      ? 'text-white bg-[#4F46E5]'
                      : 'text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller Center</span>
                </button>
              )}
            </div>

            {/* Standalone HTML Export */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleDownloadClick}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                title="Download Standalone Single-File HTML"
              >
                <Code2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{downloadSuccess ? 'HTML Saved!' : 'Export HTML'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= 5. RESPONSIVE MOBILE DRAWER MENU ================= */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white shadow-lg max-h-[80vh] overflow-y-auto animate-fadeIn">
            {/* User & Wallet Summary Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-sm">
                    {user.isLoggedIn ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">
                      {user.isLoggedIn ? user.name : 'Welcome to ZeropicBD'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {user.isLoggedIn ? (user.phone || user.email) : 'Sign in to unlock ৳20 bonus'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#4F46E5] text-white text-[11px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer"
                >
                  {user.isLoggedIn ? 'Profile' : 'Sign In'}
                </button>
              </div>

              {/* Wallet Bonus Card */}
              <div 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50 text-[#4F46E5]">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                      ZeropicBD Wallet
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold font-mono text-[#0F172A]">
                        ৳{user.walletBalance}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {user.isPhoneVerified ? '✓ Phone Verified' : '+৳20 on Verification'}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#4F46E5] font-semibold">View →</span>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="p-3 space-y-1 text-xs font-medium text-slate-700">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('All');
                  if (onSelectCategory) onSelectCategory('All');
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <span>Home (প্রধান পাতা)</span>
                <span>🏠</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onToggleMobileCategories) {
                    onToggleMobileCategories(true);
                  } else {
                    setInternalCategorySheetOpen(true);
                  }
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left text-[#4F46E5] font-semibold"
              >
                <span>Explore All Categories (ক্যাটাগরি)</span>
                <span>📂</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('Flash Sale');
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left text-amber-700 font-semibold"
              >
                <span>Flash Sale ⚡ (ফ্ল্যাশ সেল)</span>
                <span>⚡</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('Best Deals');
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <span>Best Deals 🏷️ (সেরা অফার)</span>
                <span>🏷️</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onGoHome) onGoHome();
                  if (onSelectFilterTab) onSelectFilterTab('New Arrivals');
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <span>New Arrivals ✨ (নতুন কালেকশন)</span>
                <span>✨</span>
              </button>

              {onOpenSellerStore && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSellerStore('perfume-vault-bd');
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left text-slate-800"
                >
                  <span>Brand Stores 🏬 (ব্র্যান্ড স্টোর)</span>
                  <span>🏬</span>
                </button>
              )}

              {onOpenOrders && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOrders();
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left"
                >
                  <span>My Orders & Tracking 📦 (আমার অর্ডার)</span>
                  {ordersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {ordersCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenWishlist && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenWishlist();
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-50 transition-colors text-left"
                >
                  <span>Saved Wishlist ❤️ (পছন্দের তালিকা)</span>
                  {wishlistCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              )}

              {onOpenTrackOrder && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTrackOrder();
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-left font-semibold"
                >
                  <span>Track Order 🚚 (লাইভ পার্সেল ট্র্যাকিং)</span>
                  <span>🚚</span>
                </button>
              )}

              {onOpenSellerCenter && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSellerCenter();
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-md bg-indigo-50/70 text-[#4F46E5] hover:bg-indigo-100 transition-colors text-left font-semibold"
                >
                  <span>Seller Center 🏪 (মার্চেন্ট পোর্টাল)</span>
                  <span>🏪</span>
                </button>
              )}

              {onOpenAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all text-left font-bold ${
                    isUserAdmin
                      ? 'bg-gradient-to-r from-amber-500 via-[#7A3BFF] to-[#007BFF] text-white shadow-md'
                      : 'bg-slate-900 text-amber-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isUserAdmin ? 'text-amber-200' : 'text-amber-400'}`} />
                    <span>{isUserSuperAdmin ? 'Super Admin Panel (মালিক প্যানেল)' : 'Admin Portal 🛡️ (এডমিন ড্যাশবোর্ড)'}</span>
                  </span>
                  {isUserSuperAdmin && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-mono font-black">
                      OWNER
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================= 6. MOBILE MULTI-CATEGORY SEARCH MODAL / OVERLAY ================= */}
      {isSearchOverlayOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-start animate-fadeIn">
          <div className="bg-white border-b border-slate-200 p-3 shadow-xl">
            {/* Search Input Bar */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200 focus-within:border-[#4F46E5] focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Search in ${searchCategory !== 'All' ? searchCategory : 'all categories'}...`}
                  className="w-full pl-2 pr-1 text-xs text-[#0F172A] bg-transparent placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              <button
                onClick={handleCloseSearchOverlay}
                className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Category Filter Chips inside Search Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pt-2.5">
              {SEARCH_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSearchCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                    searchCategory === cat.value
                      ? 'bg-[#4F46E5] text-white font-semibold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results & Suggestions Scrollable Body */}
          <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
            {/* Matching Products */}
            {matchingProducts.length > 0 ? (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Matching Products ({matchingProducts.length})
                </p>
                <div className="space-y-2">
                  {matchingProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectSuggestedProduct(p)}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-200 active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-11 h-11 object-cover rounded-md border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] truncate">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-medium">
                              {p.category}
                            </span>
                            {p.tag && <span className="text-amber-700">• {p.tag}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-bold font-mono text-[#0F172A] block">
                          ৳{p.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#4F46E5] font-semibold">
                          View →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No exact match found for &quot;{searchQuery}&quot;. Try selecting another category or check popular tags below.
              </div>
            ) : null}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    onClick={handleClearAllRecentSearches}
                    className="text-[10px] text-slate-400 hover:text-rose-600 lowercase"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((item) => (
                    <div
                      key={item}
                      onClick={() => handleSelectSearchTag(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 active:bg-slate-200 text-xs text-slate-700"
                    >
                      <span>{item}</span>
                      <button
                        onClick={(e) => handleRemoveRecentSearch(e, item)}
                        className="text-slate-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Search Tags */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#F59E0B]" />
                <span>Trending Searches</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSelectSearchTag(tag)}
                    className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 active:bg-amber-50 active:border-amber-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. MOBILE CATEGORIES BOTTOM SHEET DRAWER ================= */}
      {isCategorySheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Dismiss Trigger */}
          <div className="flex-1" onClick={handleCloseCategorySheet} />

          {/* Slide-Up Sheet Container */}
          <div className="bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slideUp">
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4F46E5] text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Explore Categories</h3>
                  <p className="text-[11px] text-slate-500">8 curated lifestyle & luxury departments</p>
                </div>
              </div>
              <button
                onClick={handleCloseCategorySheet}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Reset to All */}
              <button
                onClick={() => {
                  handleCategoryPillClick('All');
                  handleCloseCategorySheet();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-indigo-50 border-[#4F46E5] text-[#4F46E5]'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <div>
                    <span className="text-xs font-bold block">All Departments (সমস্ত পণ্য)</span>
                    <span className="text-[10px] text-slate-500">View complete catalog across all items</span>
                  </div>
                </div>
                {selectedCategory === 'All' && <Check className="w-4 h-4 text-[#4F46E5]" />}
              </button>

              {CATEGORY_DROPDOWN_ITEMS.map((item) => {
                const isSelected = selectedCategory === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleCategoryPillClick(item.name);
                      handleCloseCategorySheet();
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-[#4F46E5] text-[#4F46E5]'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate block">{item.name}</span>
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-bold rounded">
                            {item.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-slate-400">{item.count}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#4F46E5]" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Dismiss Button */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={handleCloseCategorySheet}
                className="w-full py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close & Browse Products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
