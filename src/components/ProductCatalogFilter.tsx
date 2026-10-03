import React, { useState, useId } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  Tag,
  DollarSign,
  PackageCheck,
  Percent,
  Layers,
  Sparkles,
  Smartphone,
  Shirt,
  Watch,
  Heart,
  Home,
  Gift
} from 'lucide-react';
import { Product, CatalogFilterState, SortOption } from '../types';

export const DEPARTMENT_OPTIONS = [
  {
    id: 'perfumes',
    name: 'Perfumes & Attars',
    icon: Sparkles,
    matches: (cat: string) => cat.includes('Perfume') || cat === 'Attar Perfumes' || cat === 'Perfume & Fragrances'
  },
  {
    id: 'electronics',
    name: 'Electronics & Tech',
    icon: Smartphone,
    matches: (cat: string) => cat.includes('Electronics') || cat === 'Glow Lights' || cat.includes('Gadgets')
  },
  {
    id: 'fashion',
    name: 'Fashion & Lifestyle',
    icon: Shirt,
    matches: (cat: string) => cat.includes('Fashion')
  },
  {
    id: 'watches',
    name: 'Watches & Accessories',
    icon: Watch,
    matches: (cat: string) => cat.includes('Watches')
  },
  {
    id: 'beauty',
    name: 'Beauty & Skincare',
    icon: Heart,
    matches: (cat: string) => cat.includes('Beauty')
  },
  {
    id: 'home',
    name: 'Home Living',
    icon: Home,
    matches: (cat: string) => cat.includes('Home')
  },
  {
    id: 'gifts',
    name: 'Luxury Gifts & Bricks',
    icon: Gift,
    matches: (cat: string) => cat.includes('Gifts') || cat === 'Notebooks' || cat === 'Bricks Toys'
  }
];

export const CURATED_TAGS = [
  'Best Seller',
  'Trending',
  'Hot Deal',
  'Luxury',
  'Top Rated',
  'Exclusive',
  '100% Organic',
  'Classic'
];

export const CURATED_BRANDS = [
  'Davidoff',
  'Chanel',
  'Gucci',
  'Calvin Klein',
  'AeroChronos',
  'ZeropicBD Atelier',
  'Cyberpunk Lab',
  'Royal Oudh'
];

export const SORT_OPTIONS: { id: SortOption; label: string; iconLabel: string }[] = [
  { id: 'popularity', label: 'Best Selling & Popular', iconLabel: '🔥' },
  { id: 'newest', label: 'Newest Arrivals', iconLabel: '✨' },
  { id: 'price-asc', label: 'Price: Low to High', iconLabel: '৳▲' },
  { id: 'price-desc', label: 'Price: High to Low', iconLabel: '৳▼' },
  { id: 'rating', label: 'Highest Rated', iconLabel: '★' },
];

export const DISCOUNT_TIERS = [
  { label: 'All Discounts', value: 0 },
  { label: '10%+ OFF', value: 10 },
  { label: '20%+ OFF', value: 20 },
  { label: '30%+ OFF', value: 30 },
  { label: '50%+ OFF', value: 50 },
];

export const PRICE_PRESETS = [
  { label: 'Under ৳1,000', min: 0, max: 1000 },
  { label: '৳1,000 - ৳3,000', min: 1000, max: 3000 },
  { label: '৳3,000 - ৳7,000', min: 3000, max: 7000 },
  { label: 'Above ৳7,000', min: 7000, max: 20000 },
];

export const INITIAL_FILTER_STATE: CatalogFilterState = {
  categories: [],
  minPrice: 0,
  maxPrice: 20000,
  inStockOnly: false,
  minDiscount: 0,
  minRating: 0,
  selectedTags: [],
  selectedBrands: [],
  sortBy: 'popularity',
};

// Check if any filter is active compared to initial state
export const countActiveFilters = (filter: CatalogFilterState, searchQuery?: string): number => {
  let count = 0;
  if (filter.categories.length > 0) count += filter.categories.length;
  if (filter.minPrice > 0 || filter.maxPrice < 20000) count += 1;
  if (filter.inStockOnly) count += 1;
  if (filter.minDiscount > 0) count += 1;
  if (filter.minRating > 0) count += 1;
  if (filter.selectedTags.length > 0) count += filter.selectedTags.length;
  if (filter.selectedBrands.length > 0) count += filter.selectedBrands.length;
  if (searchQuery && searchQuery.trim().length > 0) count += 1;
  return count;
};

interface FilterContentProps {
  filters: CatalogFilterState;
  onChange: (updater: (prev: CatalogFilterState) => CatalogFilterState) => void;
  products: Product[];
  onReset: () => void;
  maxCatalogPrice: number;
}

export const FilterSidebarContent: React.FC<FilterContentProps> = ({
  filters,
  onChange,
  products,
  onReset,
  maxCatalogPrice
}) => {
  const minPriceInputId = useId();
  const maxPriceInputId = useId();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    categories: false,
    price: false,
    availability: false,
    discount: false,
    rating: false,
    tags: false,
    brands: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCategoryToggle = (deptName: string) => {
    onChange((prev) => {
      const exists = prev.categories.includes(deptName);
      const next = exists
        ? prev.categories.filter((c) => c !== deptName)
        : [...prev.categories, deptName];
      return { ...prev, categories: next };
    });
  };

  const handleTagToggle = (tag: string) => {
    onChange((prev) => {
      const exists = prev.selectedTags.includes(tag);
      const next = exists
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag];
      return { ...prev, selectedTags: next };
    });
  };

  const handleBrandToggle = (brand: string) => {
    onChange((prev) => {
      const exists = prev.selectedBrands.includes(brand);
      const next = exists
        ? prev.selectedBrands.filter((b) => b !== brand)
        : [...prev.selectedBrands, brand];
      return { ...prev, selectedBrands: next };
    });
  };

  // Helper counts per department
  const getDeptCount = (matchesFn: (cat: string) => boolean) => {
    return products.filter((p) => matchesFn(p.category || '')).length;
  };

  return (
    <div className="space-y-5 text-sm text-[#0F172A]">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="font-bold text-base text-[#0F172A] tracking-tight">Filter Products</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* 1. Multi-Department Category Selection */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
            Departments ({filters.categories.length > 0 ? filters.categories.length : 'All'})
          </span>
          {collapsedSections.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.categories && (
          <div className="mt-3 space-y-1.5">
            {DEPARTMENT_OPTIONS.map((dept) => {
              const Icon = dept.icon;
              const isSelected = filters.categories.includes(dept.name);
              const count = getDeptCount(dept.matches);

              return (
                <label
                  key={dept.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 text-[#4F46E5] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Filter by category: ${dept.name}`}
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(dept.name)}
                      className="w-4 h-4 rounded text-[#4F46E5] border-slate-300 focus:ring-[#4F46E5] cursor-pointer accent-[#4F46E5]"
                    />
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#4F46E5]' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{dept.name}</span>
                  </div>
                  <span className={`text-[11px] shrink-0 font-medium px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-100 text-[#4F46E5]' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Price Range Slider & Manual Text Inputs */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#4F46E5]" />
            Price Range (৳ BDT)
          </span>
          {collapsedSections.price ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.price && (
          <div className="mt-3 space-y-3">
            {/* Quick Price Range Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              {PRICE_PRESETS.map((preset, idx) => {
                const isActive = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        minPrice: preset.min,
                        maxPrice: preset.max,
                      }))
                    }
                    className={`py-1 px-2 text-[11px] font-medium rounded-md border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Slider Control for Maximum Price */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Max Ceiling:</span>
                <span className="font-bold text-[#0F172A]">৳{filters.maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                aria-label="Maximum price slider"
                min={0}
                max={Math.max(20000, maxCatalogPrice)}
                step={100}
                value={filters.maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange((prev) => ({
                    ...prev,
                    maxPrice: Math.max(val, prev.minPrice + 100),
                  }));
                }}
                className="w-full accent-[#4F46E5] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
            </div>

            {/* Manual Numeric Input Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={minPriceInputId} className="block text-[11px] font-medium text-slate-500 mb-0.5">Min ৳</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">৳</span>
                  <input
                    id={minPriceInputId}
                    type="number"
                    min={0}
                    max={filters.maxPrice}
                    step={50}
                    value={filters.minPrice || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                      onChange((prev) => ({ ...prev, minPrice: val }));
                    }}
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={maxPriceInputId} className="block text-[11px] font-medium text-slate-500 mb-0.5">Max ৳</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">৳</span>
                  <input
                    id={maxPriceInputId}
                    type="number"
                    min={filters.minPrice}
                    max={50000}
                    step={100}
                    value={filters.maxPrice || ''}
                    placeholder="20000"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 20000 : Number(e.target.value);
                      onChange((prev) => ({ ...prev, maxPrice: val }));
                    }}
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Stock Availability Toggle */}
      <div className="border-b border-slate-100 pb-4">
        <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">In Stock Only</span>
              <span className="text-[11px] text-slate-500">Hide sold out inventory</span>
            </div>
          </div>
          <input
            type="checkbox"
            aria-label="Filter in stock products only"
            checked={filters.inStockOnly}
            onChange={(e) => onChange((prev) => ({ ...prev, inStockOnly: e.target.checked }))}
            className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          />
        </label>
      </div>

      {/* 4. Minimum Discount Percentage Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('discount')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#4F46E5]" />
            Minimum Discount
          </span>
          {collapsedSections.discount ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.discount && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DISCOUNT_TIERS.map((tier) => {
              const isSelected = filters.minDiscount === tier.value;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, minDiscount: tier.value }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {tier.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Customer Rating Filter */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Customer Rating
          </span>
          {collapsedSections.rating ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.rating && (
          <div className="mt-3 space-y-1.5">
            {[
              { min: 4, label: '4.0★ & above' },
              { min: 3, label: '3.0★ & above' },
              { min: 0, label: 'All Customer Ratings' },
            ].map((ratingItem) => {
              const isSelected = filters.minRating === ratingItem.min;
              return (
                <button
                  key={ratingItem.min}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, minRating: ratingItem.min }))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {ratingItem.min > 0 ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < ratingItem.min ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Show all products</span>
                    )}
                    <span className="text-xs ml-1">{ratingItem.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Brand / Label Tag Selection */}
      <div className="border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={() => toggleSection('brands')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#4F46E5]" />
            Featured Brands & Makers ({filters.selectedBrands.length > 0 ? filters.selectedBrands.length : 'All'})
          </span>
          {collapsedSections.brands ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.brands && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CURATED_BRANDS.map((brand) => {
              const isSelected = filters.selectedBrands.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandToggle(brand)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{brand}</span>
                  {isSelected && <X className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Product Badges & Tags */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('tags')}
          className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-[#4F46E5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            Collection Badges ({filters.selectedTags.length > 0 ? filters.selectedTags.length : 'All'})
          </span>
          {collapsedSections.tags ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CURATED_TAGS.map((tag) => {
              const isSelected = filters.selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{tag}</span>
                  {isSelected && <X className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ================= Mobile Slide-Out Filter Drawer =================
interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CatalogFilterState;
  onChange: (updater: (prev: CatalogFilterState) => CatalogFilterState) => void;
  products: Product[];
  totalMatchesCount: number;
  onReset: () => void;
  maxCatalogPrice: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  products,
  totalMatchesCount,
  onReset,
  maxCatalogPrice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" aria-modal="true" role="dialog" aria-labelledby="filter-drawer-title">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-2 sm:pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#4F46E5]" />
              <h2 id="filter-drawer-title" className="text-sm sm:text-base font-bold text-[#0F172A]">Filters & Sorting</h2>
              {countActiveFilters(filters) > 0 && (
                <span className="bg-[#4F46E5] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {countActiveFilters(filters)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Scroll */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
            <FilterSidebarContent
              filters={filters}
              onChange={onChange}
              products={products}
              onReset={onReset}
              maxCatalogPrice={maxCatalogPrice}
            />
          </div>

          {/* Sticky Drawer Footer with Action Buttons (Min 44px Thumb Targets) */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-2 shadow-xs">
            <button
              onClick={() => {
                onReset();
              }}
              className="min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-center cursor-pointer flex items-center justify-center active:scale-98"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-bold rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span>View {totalMatchesCount} Items</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================= Active Filter Chips Bar =================
interface ActiveFilterChipsProps {
  filters: CatalogFilterState;
  searchQuery?: string;
  onClearSearch?: () => void;
  onChange: (updater: (prev: CatalogFilterState) => CatalogFilterState) => void;
  onResetAll: () => void;
  totalFilteredCount: number;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  searchQuery,
  onClearSearch,
  onChange,
  onResetAll,
  totalFilteredCount
}) => {
  const activeCount = countActiveFilters(filters, searchQuery);

  if (activeCount === 0) return null;

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#4F46E5]" />
          Active Filters ({activeCount}):
        </span>

        {/* Search Query Chip */}
        {searchQuery && searchQuery.trim().length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-medium shadow-2xs">
            <span>Search: &quot;{searchQuery}&quot;</span>
            <button
              onClick={onClearSearch}
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title="Remove keyword filter"
              aria-label="Remove keyword filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Categories Chips */}
        {filters.categories.map((cat) => (
          <span
            key={cat}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-[#4F46E5] font-semibold shadow-2xs"
          >
            <span>{cat}</span>
            <button
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  categories: prev.categories.filter((c) => c !== cat),
                }))
              }
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title={`Remove ${cat}`}
              aria-label={`Remove category filter ${cat}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Price Chip */}
        {(filters.minPrice > 0 || filters.maxPrice < 20000) && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-800 font-medium shadow-2xs">
            <span>৳{filters.minPrice.toLocaleString()} - ৳{filters.maxPrice.toLocaleString()}</span>
            <button
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  minPrice: 0,
                  maxPrice: 20000,
                }))
              }
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title="Reset price filter"
              aria-label="Reset price filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* In Stock Only Chip */}
        {filters.inStockOnly && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold shadow-2xs">
            <span>In Stock Only</span>
            <button
              onClick={() => onChange((prev) => ({ ...prev, inStockOnly: false }))}
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title="Remove stock filter"
              aria-label="Remove stock filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Min Discount Chip */}
        {filters.minDiscount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-semibold shadow-2xs">
            <span>{filters.minDiscount}%+ Discount</span>
            <button
              onClick={() => onChange((prev) => ({ ...prev, minDiscount: 0 }))}
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title="Remove discount filter"
              aria-label="Remove discount filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Min Rating Chip */}
        {filters.minRating > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold shadow-2xs">
            <span>{filters.minRating}.0★ & above</span>
            <button
              onClick={() => onChange((prev) => ({ ...prev, minRating: 0 }))}
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title="Remove rating filter"
              aria-label="Remove rating filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Brands Chips */}
        {filters.selectedBrands.map((brand) => (
          <span
            key={brand}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-white font-medium shadow-2xs"
          >
            <span>{brand}</span>
            <button
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  selectedBrands: prev.selectedBrands.filter((b) => b !== brand),
                }))
              }
              className="hover:text-amber-300 cursor-pointer p-0.5"
              title={`Remove ${brand}`}
              aria-label={`Remove brand filter ${brand}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Tags Chips */}
        {filters.selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 font-medium shadow-2xs"
          >
            <span>{tag}</span>
            <button
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  selectedTags: prev.selectedTags.filter((t) => t !== tag),
                }))
              }
              className="hover:text-rose-600 cursor-pointer p-0.5"
              title={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Clear All Action */}
      <button
        onClick={onResetAll}
        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer shrink-0 ml-auto"
      >
        Clear All ({totalFilteredCount} items)
      </button>
    </div>
  );
};
