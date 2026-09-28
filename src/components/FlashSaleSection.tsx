import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Flame, 
  Star, 
  ShoppingCart, 
  Eye, 
  Sparkles,
  Tag,
  Clock
} from 'lucide-react';
import { Product } from '../types';

interface FlashSaleSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onViewMoreDeals: () => void;
  onSelectCategory: (category: string) => void;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onViewMoreDeals,
  onSelectCategory,
}) => {
  // Live ticking countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>(() => {
    // End of current 8-hour block
    const now = new Date();
    const hoursRemaining = 7 - (now.getHours() % 8);
    const minutesRemaining = 59 - now.getMinutes();
    const secondsRemaining = 59 - now.getSeconds();
    return {
      hours: Math.max(0, hoursRemaining),
      minutes: Math.max(0, minutesRemaining),
      seconds: Math.max(0, secondsRemaining),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to next cycle
          return { hours: 7, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter flash sale products (with originalPrice or discount or tag)
  const flashProducts = React.useMemo(() => {
    const withDiscount = products.filter(
      (p) => (p.originalPrice && p.originalPrice > p.price) || (p.discount && p.discount.length > 0)
    );
    return withDiscount.length >= 6 ? withDiscount.slice(0, 10) : products.slice(0, 8);
  }, [products]);

  // Horizontal scroll container reference
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Helper to format two digits
  const format2 = (num: number) => num.toString().padStart(2, '0');

  // Deterministic mock stock progress based on product ID
  const getStockData = (productId: string) => {
    const charCodeSum = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const total = 25 + (charCodeSum % 25); // 25 to 50
    const sold = 12 + (charCodeSum % 12); // 12 to 24
    const percentage = Math.min(92, Math.round((sold / total) * 100));
    return { sold, total, percentage };
  };

  return (
    <section className="py-8 lg:py-12 bg-[#F9FAFB] border-b border-slate-200" id="flash-sale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ================= 1. FLASH SALE HEADER & TICKING COUNTDOWN TIMER ================= */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F172A] text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          {/* Left: Flash Title & Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-[#F59E0B] flex items-center justify-center border border-slate-700">
              <Zap className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Flash Sale
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-rose-300 bg-rose-950/80 border border-rose-800 text-[10px] font-bold uppercase tracking-wider">
                  <Flame className="w-3 h-3 fill-rose-400" />
                  Limited Stock
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                বিশেষ মূল্যে সীমিত সময়ের সেরা ডিলসমূহ — স্টক শেষ হওয়ার আগেই অর্ডার করুন!
              </p>
            </div>
          </div>

          {/* Center/Right: Live Ticking Countdown Box & View All Link */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-4">
            {/* Live Ticking Countdown Timer */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs text-slate-300 hidden sm:inline font-medium">Ending in:</span>
              
              <div className="flex items-center gap-1 font-mono text-xs font-bold">
                {/* Hours Box */}
                <div className="bg-slate-900 text-[#F59E0B] px-1.5 py-0.5 rounded min-w-[24px] text-center border border-slate-700">
                  {format2(timeLeft.hours)}
                </div>
                <span className="text-slate-500 font-bold">:</span>
                
                {/* Minutes Box */}
                <div className="bg-slate-900 text-[#F59E0B] px-1.5 py-0.5 rounded min-w-[24px] text-center border border-slate-700">
                  {format2(timeLeft.minutes)}
                </div>
                <span className="text-slate-500 font-bold">:</span>
                
                {/* Seconds Box */}
                <div className="bg-slate-900 text-[#F59E0B] px-1.5 py-0.5 rounded min-w-[24px] text-center border border-slate-700 animate-pulse">
                  {format2(timeLeft.seconds)}
                </div>
              </div>
            </div>

            {/* Shop More Deals Link */}
            <button
              onClick={onViewMoreDeals}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3.5 py-2 rounded-lg transition-colors cursor-pointer group"
            >
              <span>Shop More Deals</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ================= 2. FLASH SALE PRODUCT CAROUSEL / GRID ================= */}
        <div className="relative">
          {/* Navigation Arrows (Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 absolute -top-12 right-0 z-10">
            <button
              onClick={() => handleScroll('left')}
              className="w-7 h-7 rounded-md bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous Flash Products"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-7 h-7 rounded-md bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next Flash Products"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Horizontal Scrollable Flash Products Carousel */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-none"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {flashProducts.map((product) => {
              const { sold, total, percentage } = getStockData(product.id);
              const discountPercent = (product.originalPrice && product.originalPrice > product.price)
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : null;

              return (
                <div
                  key={product.id}
                  className="w-[220px] sm:w-[240px] shrink-0 bg-white rounded-lg border border-slate-200 hover:border-slate-300 p-3 flex flex-col justify-between transition-colors shadow-2xs group relative"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Top Image Container with Discount Badge */}
                  <div>
                    <div className="relative w-full aspect-square rounded-md overflow-hidden bg-slate-50 border border-slate-100 mb-2.5">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Computed Discount Badge */}
                      {discountPercent !== null && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                            <Flame className="w-3 h-3 fill-white" />
                            -{discountPercent}%
                          </span>
                        </div>
                      )}

                      {/* Quick View Button on Image */}
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-white/95 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200 shadow-xs cursor-pointer"
                        title="Quick View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Category & Rating */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider truncate max-w-[110px] text-[10px]">
                        {product.category}
                      </span>
                      <div className="flex items-center text-[#F59E0B] font-semibold gap-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-slate-700 text-xs">{product.rating || 4.8}</span>
                      </div>
                    </div>

                    {/* Product Title */}
                    <h3 
                      onClick={() => onSelectProduct(product)}
                      className="text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#4F46E5] line-clamp-2 leading-snug cursor-pointer transition-colors mb-2 min-h-[34px]"
                    >
                      {product.title}
                    </h3>

                    {/* Price Display */}
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-sm sm:text-base font-bold text-[#0F172A] font-mono tabular-nums">
                        ৳{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          ৳{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Limit Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold text-rose-600 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 fill-rose-600" />
                        {percentage}% Claimed
                      </span>
                      <span className="text-slate-400 tabular-nums">{sold}/{total} Sold</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-[#4F46E5] rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Action Buttons: Add to Cart & Buy Now */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => onAddToCart(product)}
                        className="py-1.5 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="truncate">Cart</span>
                      </button>

                      <button
                        onClick={() => onBuyNow(product)}
                        className="py-1.5 px-2 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                        title="Buy Now"
                      >
                        <Zap className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                        <span className="truncate">Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 3. PROMOTIONAL GRID BANNERS (3 COLUMNS) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
          {/* Banner 1: Perfume Vault Collection */}
          <div 
            onClick={() => onSelectCategory('Perfume & Fragrances')}
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex flex-col justify-between h-[190px] cursor-pointer border border-slate-800 hover:border-slate-700 transition-colors shadow-2xs"
          >
            {/* Background Decorative Graphic */}
            <div className="absolute right-0 bottom-0 w-32 h-32 opacity-25 group-hover:scale-105 group-hover:opacity-35 transition-all duration-300 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=400"
                alt="Perfume Deco"
                className="w-full h-full object-cover mix-blend-screen"
              />
            </div>

            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                <Sparkles className="w-3 h-3" />
                Royal Luxury Notes
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Perfume Vault Collection
              </h3>
              <p className="text-xs text-slate-300">
                Original Imports & Artisanal Fragrances
              </p>
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3 py-1.5 rounded-md transition-colors">
                Shop Scents <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Banner 2: Trending Gadgets & Tech */}
          <div 
            onClick={() => onSelectCategory('Electronics & Gadgets')}
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 flex flex-col justify-between h-[190px] cursor-pointer border border-slate-800 hover:border-slate-700 transition-colors shadow-2xs"
          >
            {/* Background Decorative Graphic */}
            <div className="absolute right-0 bottom-0 w-32 h-32 opacity-25 group-hover:scale-105 group-hover:opacity-35 transition-all duration-300 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=400"
                alt="Gadgets Deco"
                className="w-full h-full object-cover mix-blend-screen"
              />
            </div>

            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                <Zap className="w-3 h-3 fill-current" />
                Smart Lifestyle
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Trending Gadgets & Tech
              </h3>
              <p className="text-xs text-slate-300">
                Free Delivery Inside Dhaka on tech orders
              </p>
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3 py-1.5 rounded-md transition-colors">
                Explore Tech <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Banner 3: New Arrivals in Fashion */}
          <div 
            onClick={() => onSelectCategory('Fashion & Lifestyle')}
            className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-slate-900 to-[#0F172A] text-white p-5 sm:p-6 flex flex-col justify-between h-[190px] cursor-pointer border border-slate-800 hover:border-slate-700 transition-colors shadow-2xs"
          >
            {/* Background Decorative Graphic */}
            <div className="absolute right-0 bottom-0 w-32 h-32 opacity-25 group-hover:scale-105 group-hover:opacity-35 transition-all duration-300 pointer-events-none">
              <img
                src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400"
                alt="Fashion Deco"
                className="w-full h-full object-cover mix-blend-screen"
              />
            </div>

            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                <Tag className="w-3 h-3" />
                Wardrobe Essentials
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                New Arrivals in Fashion
              </h3>
              <p className="text-xs text-slate-300">
                Selected Seasonal Outfits & Accessories
              </p>
            </div>

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] px-3 py-1.5 rounded-md transition-colors">
                Claim Offer <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
