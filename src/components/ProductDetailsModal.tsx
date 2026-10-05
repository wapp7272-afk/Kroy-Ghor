import React, { useState } from 'react';
import { X, Star, ShoppingCart, Check, ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product, quantity);
      onClose();
    } else {
      handleAddToCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="product-details-modal"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-slate-200 p-5 sm:p-7 shadow-xl animate-modalEnter"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Product Image */}
          <div className="relative rounded-lg overflow-hidden aspect-square bg-slate-50 border border-slate-100">
            <img
              src={product.image}
              alt={product.title}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            {product.tag && (
              <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded bg-[#0F172A] text-white shadow-2xs">
                {product.tag}
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#4F46E5] mb-1">
              {product.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2 leading-snug">
              {product.title}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B]" />
                ))}
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">{product.rating}</span>
              <span className="text-xs text-slate-400">({product.reviewsCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-mono tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% (Save ৳{(product.originalPrice - product.price).toLocaleString()})
                </span>
              )}
            </div>

            {/* Stock Status Indicator */}
            <div className="mb-3.5">
              {product.inStock ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  In Stock • Ready to Dispatch
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  Out of Stock • সাময়িকভাবে স্টক শেষ
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {product.description}
            </p>

            {/* Features Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Zap className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Quantity Selector & Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3.5 border-t border-slate-100">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-xs text-slate-500 font-medium sm:hidden">পরিমাণ:</span>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded flex items-center justify-center text-slate-600 hover:text-[#0F172A] hover:bg-slate-200 text-base font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-9 text-center text-sm font-bold font-mono text-[#0F172A]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded flex items-center justify-center text-slate-600 hover:text-[#0F172A] hover:bg-slate-200 text-base font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    !product.inStock
                      ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-98'
                  }`}
                >
                  {!product.inStock ? (
                    <span>Out of Stock (স্টক শেষ)</span>
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span className="truncate">Add to Cart • ৳{(product.price * quantity).toLocaleString()}</span>
                    </>
                  )}
                </button>

                {product.inStock && (
                  <button
                    id="modal-buy-now-btn"
                    onClick={handleBuyNow}
                    className="py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer shrink-0"
                  >
                    <Zap className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                    <span>Buy Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Original</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
