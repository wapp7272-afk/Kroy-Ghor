import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  shortName: string;
  image: string;
  itemCount: string;
  badge?: string;
}

export const HOME_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-all',
    name: 'All Categories',
    shortName: 'All',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
    itemCount: '1000+ Items',
    badge: 'Explore',
  },
  {
    id: 'cat-perfume',
    name: 'Perfumes & Attar',
    shortName: 'Perfumes',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80',
    itemCount: '240+ Items',
    badge: 'Popular',
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Lifestyle',
    shortName: 'Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80',
    itemCount: '180+ Items',
    badge: 'Trending',
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & Gadgets',
    shortName: 'Gadgets',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=80',
    itemCount: '120+ Items',
    badge: 'Hot Deal',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Skincare',
    shortName: 'Beauty',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
    itemCount: '150+ Items',
    badge: 'Verified',
  },
  {
    id: 'cat-home',
    name: 'Home & Living',
    shortName: 'Home',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
    itemCount: '110+ Items',
    badge: 'Curated',
  },
  {
    id: 'cat-watches',
    name: 'Watches & Accessories',
    shortName: 'Watches',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=300&q=80',
    itemCount: '90+ Items',
    badge: 'Luxury',
  },
  {
    id: 'cat-gifts',
    name: 'Premium Gifts',
    shortName: 'Gifts',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80',
    itemCount: '70+ Items',
    badge: 'Exclusive',
  },
];

export interface CategorySliderProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  title?: string;
  subtitle?: string;
}

export const CategorySlider: React.FC<CategorySliderProps> = React.memo(({
  selectedCategory,
  onSelectCategory,
  title = "Shop By Category",
  subtitle = "Discover our handpicked collection across top categories"
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100" id="categories-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                EXPLORE KROYGHOR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll Left"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll Right"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Circular Horizontal Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-start gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {HOME_CATEGORIES.map((cat) => {
            const isSelected =
              selectedCategory === cat.name ||
              (cat.name === 'All Categories' && (selectedCategory === 'All' || selectedCategory === '')) ||
              (selectedCategory === 'Perfume' && cat.name.includes('Perfume')) ||
              (selectedCategory === 'Attar Perfumes' && cat.name.includes('Perfume'));

            const categoryKey = cat.name === 'All Categories' ? 'All' : cat.name;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(categoryKey)}
                className="group flex flex-col items-center cursor-pointer shrink-0 transition-transform active:scale-95 focus:outline-none"
              >
                {/* Circular Image Container */}
                <div className="relative mb-2.5">
                  <div
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 ring-4 ring-orange-500/20 shadow-lg scale-105'
                        : 'bg-white border-2 border-slate-200 group-hover:border-orange-400 group-hover:ring-4 group-hover:ring-orange-100 group-hover:shadow-md'
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        width={96}
                        height={96}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                      />
                      {/* Active Overlay Check */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-600/20 backdrop-blur-[1px] flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  {cat.badge && (
                    <span
                      className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-xs z-10 transition-transform group-hover:scale-105 ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-900 text-white border border-white'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label Centered Below */}
                <div className="text-center max-w-[96px] sm:max-w-[108px]">
                  <h3
                    className={`text-xs sm:text-sm font-semibold leading-tight line-clamp-1 transition-colors ${
                      isSelected
                        ? 'text-orange-600 font-bold'
                        : 'text-slate-800 group-hover:text-orange-600'
                    }`}
                  >
                    {cat.shortName || cat.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {cat.itemCount}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default CategorySlider;
