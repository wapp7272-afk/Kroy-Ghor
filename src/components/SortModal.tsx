import React from 'react';
import { X, Check, ArrowUpDown, Sparkles, Flame, Star, TrendingUp, DollarSign } from 'lucide-react';
import { SortOption } from '../types';
import { SORT_OPTIONS } from './ProductCatalogFilter';

export interface SortModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onSelectSort: (sortOption: SortOption) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
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
    >
      {/* iOS Glassmorphic Bottom Sheet Container */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 backdrop-blur-xl bg-slate-900/85 text-white border-t border-white/20 rounded-t-3xl p-6 shadow-2xl animate-slideUp overflow-hidden max-w-lg mx-auto"
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
              <h3 className="text-sm font-black text-white tracking-tight">
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

        {/* Radio Button Options List */}
        <div className="space-y-2.5">
          {SORT_OPTIONS.map((option) => {
            const isSelected = currentSort === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option.id)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-orange-500/20 border-orange-500/50 text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{option.iconLabel}</span>
                  <span className="text-xs sm:text-sm font-bold tracking-tight">
                    {option.label}
                  </span>
                </div>

                {/* Radio Indicator */}
                <div 
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Updates catalog immediately without page reload
          </p>
        </div>
      </div>
    </div>
  );
};

export default SortModal;
