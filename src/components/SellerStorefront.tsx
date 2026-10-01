import React, { useState, useMemo } from 'react';
import {
  Store,
  ShieldCheck,
  Star,
  CheckCircle2,
  Share2,
  MessageCircle,
  Heart,
  Search,
  ArrowLeft,
  ShoppingBag,
  Clock,
  Sparkles,
  Phone,
  Mail,
  X,
  Send,
  ExternalLink,
  Award,
  Truck,
  RotateCcw,
  Check,
  Eye,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  UserCheck,
  BadgeCheck,
  MessageSquare
} from 'lucide-react';
import { Product, Seller, Order } from '../types';

export interface SellerStorefrontProps {
  seller?: Seller;
  sellerSlug?: string;
  sellers?: Seller[];
  products: Product[];
  orders?: Order[];
  onBackToShop: () => void;
  onAddToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onOpenSellerCenter?: () => void;
  onSwitchStore?: (slug: string) => void;
  showToast?: (msg: string) => void;
}

export const SellerStorefront: React.FC<SellerStorefrontProps> = ({
  seller: propSeller,
  sellerSlug,
  sellers = [],
  products,
  orders = [],
  onBackToShop,
  onAddToCart,
  onQuickView,
  onBuyNow,
  wishlist,
  onToggleWishlist,
  onOpenSellerCenter,
  onSwitchStore,
  showToast = () => {},
}) => {
  // Resolve active seller from propSeller or sellerSlug + sellers
  const seller: Seller = useMemo(() => {
    if (propSeller) return propSeller;
    if (sellers.length > 0) {
      if (sellerSlug) {
        const clean = sellerSlug.toLowerCase().trim();
        const found = sellers.find(
          (s) =>
            s.slug.toLowerCase() === clean ||
            s.storeName.toLowerCase() === clean ||
            s.storeName.toLowerCase().replace(/\s+/g, '-').includes(clean)
        );
        if (found) return found;
      }
      return sellers[0];
    }
    return {
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
      description: 'Authorized importer of niche French and Arabian perfumes in Bangladesh.',
      rating: 4.9,
      reviewsCount: 342,
      totalSales: 1540,
      responseRate: '99.2%',
      followersCount: 1820,
      joinedDate: 'Sep 2026',
      verified: true
    };
  }, [propSeller, sellerSlug, sellers]);

  // Store follow state with persistence in localStorage
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`primevault_follow_${seller.id}`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [followerCount, setFollowerCount] = useState<number>(seller.followersCount || 1820);

  const handleToggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    const nextCount = nextState ? followerCount + 1 : Math.max(0, followerCount - 1);
    setFollowerCount(nextCount);
    try {
      localStorage.setItem(`primevault_follow_${seller.id}`, String(nextState));
    } catch {}
    showToast(nextState ? `✓ You are now following ${seller.storeName}!` : `Unfollowed ${seller.storeName}`);
  };

  // In-store search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'popular'>('featured');

  // Contact seller modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Added-to-cart feedback per product
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Extract products specifically belonging to this seller
  const sellerProducts = useMemo(() => {
    return products.filter((p) => {
      const pStore = (p.storeName || p.sellerName || '').toLowerCase().trim();
      const sStore = (seller.storeName || '').toLowerCase().trim();
      const sSlug = (seller.slug || '').toLowerCase().trim();

      if (pStore && (pStore === sStore || pStore.includes(sStore) || sStore.includes(pStore))) {
        return true;
      }

      if (seller.id === 'seller-1' || sSlug === 'perfume-vault-bd') {
        return (
          pStore.includes('perfume') ||
          pStore.includes('vault') ||
          p.category.includes('Perfume') ||
          p.category === 'Attar Perfumes'
        );
      }

      if (seller.id === 'seller-2' || sSlug === 'apex-tech-bd') {
        return (
          pStore.includes('apex') ||
          pStore.includes('tech') ||
          p.category.includes('Gadgets') ||
          p.category.includes('Lights')
        );
      }

      return false;
    });
  }, [products, seller]);

  // Unique categories within this store
  const storeCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    sellerProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [sellerProducts]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let list = [...sellerProducts];

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort options
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return list;
  }, [sellerProducts, selectedCategory, searchQuery, sortBy]);

  const handleAddToCartWithFeedback = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    showToast(`✓ Added "${product.title}" to cart`);
    setTimeout(() => setAddedProductId(null), 1800);
  };

  const handleShareStore = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('✓ Storefront link copied to clipboard!');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSent(true);
    showToast(`✓ Message sent directly to ${seller.storeName}!`);
    setTimeout(() => {
      setContactSent(false);
      setIsContactModalOpen(false);
      setContactSubject('');
      setContactMessage('');
    }, 1500);
  };

  // Derive Banner style / image based on store category
  const bannerBg = useMemo(() => {
    if (seller.bannerImage) return seller.bannerImage;
    if (seller.category.includes('Perfume') || seller.storeName.includes('Perfume')) {
      return 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=1600';
    }
    if (seller.category.includes('Tech') || seller.category.includes('Gadgets') || seller.storeName.includes('Tech')) {
      return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600';
    }
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600';
  }, [seller]);

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      {/* ================= 1. STORE HEADER & HERO BANNER ================= */}
      <div className="relative bg-slate-900 text-white">
        {/* Banner Image with Luxury Gradient Overlay */}
        <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
          <img
            src={bannerBg}
            alt={seller.storeName}
            className="w-full h-full object-cover object-center opacity-40 scale-105 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
        </div>

        {/* Store Top Navigation Bar */}
        <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between z-10">
          <button
            onClick={onBackToShop}
            className="px-3.5 py-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 transition-all border border-white/10 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Marketplace</span>
          </button>

          <div className="flex items-center gap-2">
            {sellers.length > 1 && onSwitchStore && (
              <div className="hidden sm:flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <Store className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-gray-300 text-[11px]">Stores:</span>
                <select
                  value={seller.slug}
                  onChange={(e) => onSwitchStore(e.target.value)}
                  className="bg-transparent text-purple-200 font-bold focus:outline-none cursor-pointer"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.slug} className="bg-slate-900 text-white">
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleShareStore}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/10 transition-colors cursor-pointer"
              title="Share Storefront Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {onOpenSellerCenter && (
              <button
                onClick={onOpenSellerCenter}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Seller Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Store Profile Card (Overlapping Banner) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20 pb-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E5E7EB] shadow-xl text-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left: Avatar + Store Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#5B21B6] to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white shrink-0 overflow-hidden">
                {seller.logoImage ? (
                  <img src={seller.logoImage} alt={seller.storeName} className="w-full h-full object-cover" />
                ) : (
                  <span>{seller.storeName.charAt(0)}</span>
                )}
                <div 
                  className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white shadow-xs"
                  title="ZeropicBD Certified Merchant"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#171717]">{seller.storeName}</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Official Store
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5B21B6]">
                    {seller.category}
                  </span>
                </div>

                <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                  {seller.description || 'Exclusive official lifestyle merchant certified by ZeropicBD Bangladesh.'}
                </p>

                {/* Rating & Response Metrics Badges */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{seller.rating ? seller.rating.toFixed(1) : '4.9'}</span>
                    <span className="text-gray-400 font-normal">({seller.reviewsCount || 340}+ ratings)</span>
                  </span>

                  <span className="text-gray-300">•</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    98.6% Positive Store Rating
                  </span>

                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-[#5B21B6]" />
                    <span>Response Rate: <strong className="text-gray-900 font-bold">{seller.responseRate || '99.2%'}</strong> (within 1 hr)</span>
                  </span>

                  <span className="text-gray-300">•</span>
                  <span className="font-mono text-gray-600">
                    {followerCount.toLocaleString()} Followers
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Follow & Contact Actions */}
            <div className="flex sm:flex-row md:flex-col lg:flex-row items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                  isFollowing
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-purple-200'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Following Store ({followerCount})</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>+ Follow Store</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:border-[#5B21B6] bg-white text-gray-800 hover:text-[#5B21B6] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-4 h-4 text-[#5B21B6]" />
                <span>Contact Merchant</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ================= 2. STORE SEARCH & DEPARTMENT FILTER BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {storeCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#5B21B6] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2.5">
            {/* In-Store Search Box */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search in ${seller.storeName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs text-gray-800 focus:outline-none focus:border-[#5B21B6]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-[#5B21B6] cursor-pointer"
            >
              <option value="featured">Featured Catalog</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Customer Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Product Catalog Stats Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> items in <strong>{seller.storeName}</strong>
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="text-[#5B21B6] hover:underline font-bold"
            >
              Clear category filter
            </button>
          )}
        </div>

        {/* ================= 3. STORE PRODUCT CATALOG GRID ================= */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5B21B6] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm text-[#171717]">কোনো পণ্য পাওয়া যায়নি</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              "{searchQuery}" এর সাথে সম্পর্কিত কোনো পণ্য এই স্টোরে পাওয়া যায়নি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-[#5B21B6] text-white font-bold text-xs hover:bg-[#4C1D95] transition-colors cursor-pointer"
            >
              সব পণ্য দেখুন (Reset Filters)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              const isAdded = addedProductId === product.id;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-[#E5E7EB] hover:border-purple-300 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Discount or tag badge */}
                    {product.discount && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow-xs">
                        {product.discount}
                      </span>
                    )}

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-rose-600 shadow-sm transition-colors cursor-pointer"
                      title="Add to wishlist"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isWishlisted ? 'fill-rose-600 text-rose-600' : ''
                        }`}
                      />
                    </button>

                    {/* Quick View Hover Trigger */}
                    <button
                      type="button"
                      onClick={() => onQuickView(product)}
                      className="absolute bottom-2 inset-x-2 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Quick View</span>
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#5B21B6] uppercase tracking-wider">
                        {product.category}
                      </span>
                      <h3
                        onClick={() => onQuickView(product)}
                        className="font-bold text-xs text-[#171717] line-clamp-2 hover:text-[#5B21B6] transition-colors cursor-pointer mt-0.5"
                      >
                        {product.title}
                      </h3>
                    </div>

                    <div className="pt-1 border-t border-gray-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-sm font-black text-[#5B21B6] font-mono">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] text-gray-400 line-through font-mono ml-1.5">
                              ৳{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {product.rating && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{product.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>

                      {/* Buy & Cart Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onBuyNow(product)}
                          className="py-1.5 px-2 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Buy Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCartWithFeedback(product)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                            isAdded
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-purple-50 hover:bg-purple-100 text-[#5B21B6] border-purple-200'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
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

      {/* ================= 4. DIRECT CONTACT MERCHANT CHAT MODAL ================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-[#5B21B6]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#171717]">
                    Message {seller.storeName}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Typically responds within 1 hour
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSent ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">বার্তা সফলভাবে পাঠানো হয়েছে!</h4>
                <p className="text-xs text-gray-500">
                  {seller.storeName} আপনার বার্তার উত্তর অতিদ্রুত ইনবক্সে পাঠিয়ে দেবে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    বিষয় (Inquiry Subject)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: স্টক বা ডেলিভারি সম্পর্কিত তথ্য"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    আপনার বার্তা (Message)*
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="পণ্য বা অর্ডার সম্পর্কে আপনার প্রশ্নটি বিস্তারিত লিখুন..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6] resize-none"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 text-[11px] text-[#5B21B6] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Your buyer inquiry is protected under ZeropicBD Guarantee.</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
