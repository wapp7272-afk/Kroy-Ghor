import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative flex flex-col justify-between h-full rounded-2xl overflow-hidden bg-white border border-slate-200/80 p-0 shadow-xs"
        >
          {/* Top: Image Skeleton */}
          <div className="relative w-full aspect-square bg-slate-200/80 skeleton-shimmer" />

          {/* Body */}
          <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
            <div className="space-y-2">
              {/* Category & Store Skeleton */}
              <div className="flex items-center justify-between gap-2">
                <div className="h-3 w-16 bg-slate-200 rounded-md skeleton-shimmer" />
                <div className="h-3 w-20 bg-slate-200 rounded-md skeleton-shimmer" />
              </div>

              {/* Title Skeleton (2 lines) */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full bg-slate-200 rounded-md skeleton-shimmer" />
                <div className="h-3.5 w-3/4 bg-slate-200 rounded-md skeleton-shimmer" />
              </div>

              {/* Rating & Sold Skeleton */}
              <div className="flex items-center justify-between pt-1">
                <div className="h-3 w-12 bg-slate-200 rounded skeleton-shimmer" />
                <div className="h-3 w-10 bg-slate-200 rounded skeleton-shimmer" />
              </div>
            </div>

            {/* Bottom: Price & Button Skeletons */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <div className="h-5 w-20 bg-slate-200 rounded-md skeleton-shimmer" />
                <div className="h-4 w-12 bg-slate-200 rounded skeleton-shimmer" />
              </div>

              {/* Dual Buttons Skeleton */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <div className="h-10 bg-slate-200 rounded-xl skeleton-shimmer" />
                <div className="h-10 bg-slate-200 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
