import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  Tag, 
  Pause, 
  Play 
} from 'lucide-react';
import { PromoSlideBanner } from '../services/bannerService';

export interface HeroBannerSliderProps {
  banners: PromoSlideBanner[];
  onSelectCategory?: (categoryName: string) => void;
  onSelectProduct?: (productId: string) => void;
  autoPlayInterval?: number;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = React.memo(({
  banners,
  onSelectCategory,
  onSelectProduct,
  autoPlayInterval = 5000,
}) => {
  // Filter active banners and sort by order
  const activeBanners = React.useMemo(() => {
    const list = banners.filter((b) => b.isActive !== false);
    return list.length > 0 ? list : banners;
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch Swipe State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = activeBanners.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused, autoPlayInterval, handleNext]);

  // Reset index if banners change and index out of bounds
  useEffect(() => {
    if (currentIndex >= totalSlides) {
      setCurrentIndex(0);
    }
  }, [totalSlides, currentIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Banner Action Click
  const handleBannerClick = (banner: PromoSlideBanner) => {
    if (banner.linkTarget) {
      if (banner.linkType === 'external' || banner.linkTarget.startsWith('http')) {
        window.open(banner.linkTarget, '_blank');
      } else if (banner.linkType === 'product') {
        if (onSelectProduct) onSelectProduct(banner.linkTarget);
      } else {
        if (onSelectCategory) onSelectCategory(banner.linkTarget);
      }
    } else if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        window.open(banner.linkUrl, '_blank');
      } else if (onSelectCategory) {
        onSelectCategory(banner.linkUrl);
      }
    }
  };

  if (totalSlides === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  return (
    <section 
      className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Viewport Container */}
      <div 
        className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Container with Smooth Slide Transition */}
        <div 
          className="w-full h-full flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeBanners.map((banner, index) => (
            <div
              key={banner.id || index}
              className="w-full h-full shrink-0 relative flex items-center"
            >
              {/* Responsive Background Image */}
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Promotional Banner'}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />

              {/* Dark Gradient Overlay for Maximum Text Contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent sm:via-slate-950/40" />

              {/* Banner Content Card Overlay with mobile horizontal padding */}
              <div className="relative z-10 p-5 px-6 sm:p-10 md:p-12 md:px-12 max-w-xl sm:max-w-2xl text-white space-y-2 sm:space-y-3.5">
                {/* Badge */}
                {banner.badge && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                    <span>{banner.badge}</span>
                  </div>
                )}

                {/* Banner Main Title */}
                {banner.title && (
                  <h2 className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md line-clamp-2">
                    {banner.title}
                  </h2>
                )}

                {/* Subtitle */}
                {banner.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-lg font-medium">
                    {banner.subtitle}
                  </p>
                )}

                {/* CTA Action Button */}
                <div className="pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => handleBannerClick(banner)}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-orange-500/30 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 group/btn"
                  >
                    <span>{banner.linkType === 'external' ? 'Visit Channel' : 'Explore Offer'}</span>
                    {banner.linkType === 'external' ? (
                      <ExternalLink className="w-4 h-4 text-white group-hover/btn:translate-x-0.5 transition-transform" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-0.5 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Side Navigation Arrows (Left / Right) - Visible on hover or touch */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-xs hidden md:flex items-center justify-center border border-white/20 shadow-lg transition-all cursor-pointer active:scale-90 hover:scale-105 z-20"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-xs hidden md:flex items-center justify-center border border-white/20 shadow-lg transition-all cursor-pointer active:scale-90 hover:scale-105 z-20"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Bottom Pagination Dots Indicator */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/50 backdrop-blur-xs border border-white/10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-2 bg-orange-500'
                    : 'w-2 h-2 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default HeroBannerSlider;
