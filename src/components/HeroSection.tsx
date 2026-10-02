import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Star,
  ChevronLeft, 
  ChevronRight,
  Flame,
  CheckCircle,
  ShoppingBag,
  Tag,
  Copy,
  Layers,
  Gift,
  Youtube
} from 'lucide-react';
import { Product, PromoBanner, SystemBannerSettings } from '../types';
import { INITIAL_PROMO_BANNERS } from '../data/banners';

interface HeroSectionProps {
  banners?: PromoBanner[];
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectCategory: (category: string) => void;
  onSelectFilterTab: (tab: 'All' | 'Flash Sale' | 'Best Deals' | 'New Arrivals') => void;
  onClaimBonus?: () => void;
  bannerSettings?: SystemBannerSettings;
  showToast?: (msg: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  banners,
  products = [],
  onSelectProduct,
  onBuyNow,
  onAddToCart,
  onSelectCategory,
  onSelectFilterTab,
  onClaimBonus,
  bannerSettings,
  showToast,
}) => {
  const activeBanners = (banners && banners.length > 0)
    ? banners.filter((b) => b.isActive !== false)
    : INITIAL_PROMO_BANNERS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  // Find linked product for current banner
  const linkedProduct = React.useMemo(() => {
    if (!products || products.length === 0) return null;
    if (currentBanner.linkedProductId) {
      const found = products.find((p) => p.id === currentBanner.linkedProductId);
      if (found) return found;
    }
    // Fallback to category matching product
    const catProduct = products.find((p) => 
      p.category.toLowerCase().includes(currentBanner.category.toLowerCase()) ||
      currentBanner.category.toLowerCase().includes(p.category.toLowerCase())
    );
    return catProduct || products[0];
  }, [currentBanner, products]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handlePrimaryCta = () => {
    if (currentBanner.primaryCtaTarget) {
      if (['Flash Sale', 'Best Deals', 'New Arrivals'].includes(currentBanner.primaryCtaTarget)) {
        onSelectFilterTab(currentBanner.primaryCtaTarget as any);
        onSelectCategory('All');
      } else {
        onSelectCategory(currentBanner.primaryCtaTarget);
        onSelectFilterTab('All');
      }
    } else {
      onSelectCategory(currentBanner.category);
    }
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSecondaryCta = () => {
    if (currentBanner.secondaryCtaTarget) {
      if (['Flash Sale', 'Best Deals', 'New Arrivals'].includes(currentBanner.secondaryCtaTarget)) {
        onSelectFilterTab(currentBanner.secondaryCtaTarget as any);
        onSelectCategory('All');
      } else {
        onSelectCategory(currentBanner.secondaryCtaTarget);
        onSelectFilterTab('All');
      }
    } else {
      onSelectFilterTab('Flash Sale');
      onSelectCategory('All');
    }
    const el = document.getElementById('explore');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    if (showToast) {
      showToast(`🎟️ Coupon "${code}" copied to clipboard!`);
    }
  };

  return (
    <section 
      id="hero-banner-carousel"
      className="relative overflow-hidden bg-[#F9FAFB] border-b border-slate-200 pt-3 pb-6 sm:pt-5 sm:pb-8 lg:pt-6 lg:pb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Market Bar Indicator */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-[#4F46E5] text-[11px] sm:text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="truncate">BANGLADESH&apos;S PREMIER MULTI-CATEGORY MARKETPLACE</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Genuine Verified
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <Truck className="w-4 h-4 text-[#4F46E5]" />
              Express 64 Districts Delivery
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              Cash On Delivery
            </span>
          </div>
        </div>

        {/* ================= HERO CAROUSEL CONTAINER ================= */}
        <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm min-h-[380px] sm:min-h-[430px] lg:min-h-[470px] flex flex-col justify-between">
          
          {/* Main Slide Content Split Grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-5 sm:p-7 lg:p-9 flex-1">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5 sm:space-y-4 text-left">
              
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F46E5] text-white text-xs font-bold shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>{currentBanner.badge}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold">
                  {currentBanner.discountText}
                </span>

                {currentBanner.codeText && (
                  <button
                    onClick={() => handleCopyCode(currentBanner.codeText!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                    title="Click to copy voucher code"
                  >
                    <Tag className="w-3 h-3 text-[#4F46E5]" />
                    <span>CODE: {currentBanner.codeText}</span>
                    <Copy className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight transition-all duration-300">
                  {currentBanner.title}
                </h1>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl transition-all duration-300">
                  {currentBanner.subtitle}
                </p>
              </div>

              {/* Multi-Category Department Indicators */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
                {[
                  { name: 'Perfume & Fragrances', label: 'Perfumes', icon: '✨' },
                  { name: 'Electronics & Gadgets', label: 'Gadgets', icon: '📱' },
                  { name: 'Fashion & Lifestyle', label: 'Fashion', icon: '👔' },
                  { name: 'Watches & Accessories', label: 'Watches', icon: '⌚' },
                  { name: 'Home & Living', label: 'Home Living', icon: '🏠' },
                ].map((dep) => {
                  const isCurrent = currentBanner.category === dep.name;
                  return (
                    <button
                      key={dep.name}
                      onClick={() => {
                        onSelectCategory(dep.name);
                        const el = document.getElementById('explore');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-100 text-[#4F46E5] font-semibold border border-indigo-200 shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{dep.icon}</span>
                      <span>{dep.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  id="hero-primary-cta-btn"
                  onClick={handlePrimaryCta}
                  className="px-5 py-3 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 group"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>{currentBanner.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {onClaimBonus && (
                  <button
                    id="hero-claim-bonus-btn"
                    onClick={onClaimBonus}
                    className="px-4 py-3 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm text-amber-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    <Gift className="w-4 h-4 text-amber-950" />
                    <span>Claim ৳20 Bonus</span>
                  </button>
                )}

                <button
                  id="hero-secondary-cta-btn"
                  onClick={handleSecondaryCta}
                  className="px-4 py-3 min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{currentBanner.secondaryCtaText || 'Explore Flash Sale'}</span>
                </button>
              </div>

              {/* Trust Guarantees */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Authenticity Verified
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Fast Dispatch
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Hassle-Free Returns
                </span>
              </div>

            </div>

            {/* Right Featured Imagery & Spotlight Card Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              {/* Main Banner Hero Photography */}
              <div className="relative w-full aspect-16/10 sm:aspect-16/9 lg:aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md group">
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Top Corner Pill */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold border border-white/20 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#F59E0B]" />
                    <span>{currentBanner.category}</span>
                  </span>
                </div>

                {/* Bottom Corner Linked Product Mini Card (Instant Conversion) */}
                {linkedProduct && (
                  <div 
                    onClick={() => onSelectProduct(linkedProduct)}
                    className="absolute bottom-2.5 inset-x-2.5 p-2 sm:p-2.5 rounded-lg bg-white/95 backdrop-blur-md border border-white/40 shadow-lg cursor-pointer hover:bg-white transition-all flex items-center justify-between gap-2 z-10"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img 
                        src={linkedProduct.image} 
                        alt={linkedProduct.title}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-50"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{linkedProduct.rating || 4.9}</span>
                          <span className="text-slate-400 font-normal">({linkedProduct.reviewsCount || 120})</span>
                        </div>
                        <p className="text-xs font-bold text-[#0F172A] truncate">
                          {linkedProduct.title}
                        </p>
                        <p className="text-xs font-mono font-bold text-[#4F46E5]">
                          ৳{linkedProduct.price.toLocaleString()}
                          {linkedProduct.originalPrice && linkedProduct.originalPrice > linkedProduct.price && (
                            <span className="text-[10px] text-slate-400 line-through ml-1 font-normal">
                              ৳{linkedProduct.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBuyNow(linkedProduct);
                      }}
                      className="px-2.5 py-1.5 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                      <span>Buy</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ================= BOTTOM CAROUSEL CONTROLS BAR ================= */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            
            {/* Slide Dots Indicator with comfortable touch target */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {activeBanners.map((banner, index) => (
                <button
                  key={banner.id}
                  onClick={() => setCurrentIndex(index)}
                  className="p-2 min-h-[40px] min-w-[32px] flex items-center justify-center cursor-pointer"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-300 block ${
                      currentIndex === index
                        ? 'w-7 sm:w-8 bg-[#4F46E5]'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Slide Counter & Category Tag */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-mono text-slate-700 font-bold">0{currentIndex + 1} / 0{activeBanners.length}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#4F46E5] font-semibold">{currentBanner.category}</span>
            </div>

            {/* Next / Prev Navigation Buttons (Min 44px Hitboxes) */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Previous Banner"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                aria-label="Next Banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
});
