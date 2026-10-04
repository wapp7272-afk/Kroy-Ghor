import React from 'react';
import { X, Check, ArrowUpDown, Sparkles, Flame, Star, TrendingUp, DollarSign } from 'lucide-react';
import { SortOption } from '../types';
import { SORT_OPTIONS } from './ProductCatalogFilter';

export interface SortProductsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onSelectSort: (sortOption: SortOption) => void;
}

export const SortProducts: React.FC<SortProductsProps> = React.memo(({
  isOpen,
  onClose,
  currentSort,
  onSelectSort,
}) => {
  if (!isOpen) return null;

  const handleOptionClick = (optionId: SortOption) => {
    onSelectSort(optionId);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sort-products-title"
    >
      {/* iOS Glassmorphic Bottom Sheet Container with Hardware Acceleration */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 backdrop-blur-xl bg-slate-900/85 text-white border-t border-white/20 rounded-t-3xl p-6 shadow-2xl animate-slideUp overflow-hidden max-w-lg mx-auto transform-gpu"
        style={{
          touchAction: 'pan-y',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag Handle */}
        <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-4" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 id="sort-products-title" className="text-sm font-black text-white tracking-tight">
                Sort Products
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose how you want products arranged
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close sort modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Options Grid */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {SORT_OPTIONS.map((option) => {
            const isSelected = currentSort === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.15)] text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {option.id === 'popularity' && <Flame className="w-4 h-4" />}
                    {option.id === 'price-asc' && <DollarSign className="w-4 h-4" />}
                    {option.id === 'price-desc' && <DollarSign className="w-4 h-4" />}
                    {option.id === 'rating' && <Star className="w-4 h-4" />}
                    {option.id === 'newest' && <Sparkles className="w-4 h-4" />}
                  </div>

                  <div>
                    <span className="text-xs font-bold block">{option.label}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {option.id === 'popularity' && 'Top trending & best selling products'}
                      {option.id === 'price-asc' && 'Lowest price to highest price'}
                      {option.id === 'price-desc' && 'Highest price to lowest price'}
                      {option.id === 'rating' && 'Highest customer satisfaction reviews'}
                      {option.id === 'newest' && 'Recently added arrivals'}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-scaleIn">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/20 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const SortModal = SortProducts;
export default SortProducts;
