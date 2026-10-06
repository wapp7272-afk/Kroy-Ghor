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
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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

  // Touch handlers for mobile swipe with vertical scroll disambiguation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = (touchStartY.current !== null && touchEndY.current !== null) 
      ? Math.abs(touchStartY.current - touchEndY.current) 
      : 0;

    // Only swipe if horizontal intent was significantly greater than vertical scroll
    if (Math.abs(diffX) > diffY && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
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

  if (totalSlides === 0) {
    return (
      <section className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-4 select-none">
        <div className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 animate-pulse flex items-center p-6 sm:p-12">
          <div className="space-y-3 max-w-md">
            <div className="h-5 w-24 bg-orange-500/40 rounded-full" />
            <div className="h-8 w-64 bg-slate-700 rounded-xl" />
            <div className="h-4 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = activeBanners[currentIndex];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <section 
      className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-4 select-none focus:outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Showcase"
      aria-live="polite"
    >
      {/* Slider Viewport Container with Hardware Acceleration */}
      <div 
        className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900 group transform-gpu focus-within:ring-2 focus-within:ring-[#4F46E5]"
        style={{
          touchAction: 'pan-y',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Container with Smooth Slide & Cross-Fade Transition */}
        <div 
          className="w-full h-full flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%) translateZ(0)`,
            willChange: 'transform',
          }}
        >
          {activeBanners.map((banner, index) => {
            const isSlideActive = currentIndex === index;
            return (
              <div
                key={banner.id || index}
                className={`w-full h-full shrink-0 relative flex items-center transition-opacity duration-500 ease-out ${
                  isSlideActive ? 'opacity-100' : 'opacity-40'
                }`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${totalSlides}: ${banner.title || 'Slide'}`}
                aria-hidden={!isSlideActive}
              >
                {/* Responsive Background Image with Priority LCP Loading & Smooth Scale on Active */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Promotional Banner'}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                    isSlideActive ? 'scale-100' : 'scale-105'
                  }`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  // @ts-ignore - React 19 / Modern DOM fetchPriority support
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  decoding="async"
                  width={1280}
                  height={420}
                />

                {/* Dark Gradient Overlay for Maximum Text Contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent sm:via-slate-950/40" />

                {/* Banner Content Card Overlay with Subtle Coordinated Entrance */}
                <div 
                  className={`relative z-10 p-5 px-6 sm:p-10 md:p-12 md:px-12 max-w-xl sm:max-w-2xl text-white space-y-2 sm:space-y-3.5 transition-all duration-500 ease-out ${
                    isSlideActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
                  }`}
                >
                  {/* Badge */}
                  {banner.badge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/95 backdrop-blur-xs text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm transition-transform duration-300 hover:scale-105">
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
                      className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 group/btn"
                    >
                      <span>{banner.linkType === 'external' ? 'Visit Channel' : 'Explore Offer'}</span>
                      {banner.linkType === 'external' ? (
                        <ExternalLink className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform duration-200" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform duration-200" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Navigation Arrows (Left / Right) - Visible on hover or touch */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white backdrop-blur-xs hidden md:flex items-center justify-center border border-white/20 shadow-md transition-all duration-150 cursor-pointer active:scale-95 z-20"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-900/60 hover:bg-slate-900/85 text-white backdrop-blur-xs hidden md:flex items-center justify-center border border-white/20 shadow-md transition-all duration-150 cursor-pointer active:scale-95 z-20"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Bottom Pagination Dots & Play/Pause Controls Bar */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-xs border border-white/10">
            {/* Play/Pause Button for WCAG 2.2.2 */}
            <button
              type="button"
              onClick={() => setIsPaused(prev => !prev)}
              aria-label={isPaused ? "Resume banner autoplay" : "Pause banner autoplay"}
              className="p-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3 h-3 text-amber-300" /> : <Pause className="w-3 h-3 text-white/80" />}
            </button>

            <span className="w-px h-3 bg-white/20" aria-hidden="true" />

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
