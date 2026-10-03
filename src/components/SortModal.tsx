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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      {/* Glassmorphic Bottom Sheet Container */}
      <div 
        className="w-full sm:max-w-md bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border border-white/30 dark:border-slate-800/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white transition-all animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 opacity-80" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sort Products
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose how you want products arranged
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close sort modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Radio Button Options List */}
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => {
            const isSelected = currentSort === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option.id)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/50 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'bg-white/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/70'
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
                      ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Updates catalog immediately without page reload
          </p>
        </div>
      </div>
    </div>
  );
};

export default SortModal;
