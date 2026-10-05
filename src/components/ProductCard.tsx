import React, { useState } from 'react';
import { Star, ShoppingCart, Check, Eye, Zap, Heart, ShieldCheck, RotateCcw, Truck, Sparkles } from 'lucide-react';
import { Product } from '../types';

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onOpenSellerStore?: (storeNameOrSlug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onAddToCart,
  onQuickView,
  onBuyNow,
  isWishlisted = false,
  onToggleWishlist,
  onOpenSellerStore,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      onAddToCart(product);
      onQuickView(product);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  // Derive merchant store name consistently
  const storeName = product.storeName || product.sellerName || (() => {
    if (product.category.includes('Perfume') || product.category === 'Attar Perfumes') return 'PerfumeVault BD';
    if (product.category.includes('Gadgets') || product.category === 'Glow Lights') return 'Apex Tech BD';
    if (product.category.includes('Fashion')) return 'Kroyghor Atelier';
    if (product.category.includes('Watches')) return 'Chronos Official';
    if (product.category.includes('Beauty')) return 'Glow & Glam BD';
    if (product.category.includes('Home')) return 'Nordic Living';
    return 'Kroyghor Official';
  })();

  // Optimized responsive image source
  const optimizedSrc = React.useMemo(() => {
    if (!product.image) return '/placeholder.png';
    if (product.image.includes('unsplash.com')) {
      return `${product.image.split('?')[0]}?auto=format&fit=crop&w=400&q=80`;
    }
    return product.image;
  }, [product.image]);

  const optimizedSrcSet = React.useMemo(() => {
    if (product.image && product.image.includes('unsplash.com')) {
      const base = product.image.split('?')[0];
      return `${base}?auto=format&fit=crop&w=260&q=75 260w, ${base}?auto=format&fit=crop&w=400&q=80 400w, ${base}?auto=format&fit=crop&w=600&q=80 600w`;
    }
    return undefined;
  }, [product.image]);

  // Discount is calculated only when an explicit Original Price is present and greater than Sale Price
  const hasValidDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasValidDiscount
    ? `-${Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%`
    : product.discount || null;

  const savingsAmount = hasValidDiscount ? product.originalPrice! - product.price : 0;

  // Calculate or retrieve sold count
  const soldCount = product.soldCount || (() => {
    const charCodeSum = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 80 + (charCodeSum % 420);
  })();

  return (
    <div
      id={`product-card-${product.id}`}
      role="article"
      aria-label={`${product.title}, ৳${product.price}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onQuickView(product);
        }
      }}
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col justify-between h-full rounded-xl overflow-hidden bg-white border border-slate-200/90 hover:border-[#4F46E5]/40 transition-[border-color,box-shadow] duration-200 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none"
    >
      {/* ================= Top: Product Image Container with Zero-CLS Skeleton ================= */}
      <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
        <img
          src={optimizedSrc}
          srcSet={optimizedSrcSet}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          alt={product.title}
          width={400}
          height={400}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-out transform-gpu ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Top-Left: Discount Badge (% OFF) & Stock Status */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent && (
            <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase rounded-md bg-rose-600 text-white tracking-tight shadow-xs">
              {discountPercent} OFF
            </span>
          )}

          {product.inStock === false && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-900/90 text-white shadow-xs">
              Stock Out
            </span>
          )}

          {product.tag && !discountPercent && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#4F46E5] text-white shadow-xs">
              {product.tag}
            </span>
          )}
        </div>

        {/* Top-Right: Quick Wishlist Heart Toggle (Min 40px Hitbox) */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-9 h-9 min-h-[40px] min-w-[40px] rounded-full bg-white/95 backdrop-blur-xs border shadow-xs transition-all duration-150 z-10 flex items-center justify-center cursor-pointer active:scale-90 ${
            isWishlisted
              ? 'text-rose-500 border-rose-200 bg-rose-50/90'
              : 'text-slate-400 hover:text-rose-500 hover:border-rose-200 border-slate-200'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 transition-transform duration-150 ${isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'hover:scale-110'}`} />
        </button>

        {/* Floating Quick View Overlay on Desktop Hover */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden sm:flex items-center justify-center pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-bold shadow-md flex items-center gap-1.5 transform translate-y-1.5 group-hover:translate-y-0 transition-transform duration-150">
            <Eye className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Quick View</span>
          </div>
        </div>
      </div>

      {/* ================= Middle: Information Hierarchy ================= */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Category Badge & Store Info */}
          <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
            <span className="truncate uppercase tracking-wider text-[10px] font-bold text-[#4F46E5] bg-indigo-50/80 px-1.5 py-0.5 rounded">
              {product.category}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSellerStore) {
                  onOpenSellerStore(storeName);
                }
              }}
              className="text-slate-400 hover:text-[#4F46E5] truncate max-w-[110px] transition-colors cursor-pointer text-right text-[10px] font-medium"
              title={`Visit ${storeName} Storefront`}
            >
              {storeName}
            </button>
          </div>

          {/* Product Title (Line-Clamped with fixed min-height for uniform alignment) */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#4F46E5] transition-colors min-h-[2.5rem] sm:min-h-[2.75rem]">
            {product.title}
          </h3>

          {/* Rating Star Indicator with Review Count & Sold Metric */}
          <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-bold text-xs">{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewsCount || 124})</span>
            </div>

            <span className="text-slate-400 text-[10px] tabular-nums font-medium">
              {soldCount} sold
            </span>
          </div>
        </div>

        {/* ================= Bottom: Price Area & Dual CTAs ================= */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          {/* Price Area: Bold Current Price + Old Strikethrough + Savings Badge */}
          <div className="flex flex-wrap items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-slate-400 line-through tabular-nums font-mono">
                  ৳{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {savingsAmount > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                Save ৳{savingsAmount.toLocaleString()}
              </span>
            )}
          </div>

          {/* Micro Trust Badges Row (Optimized for 360px-430px viewports without awkward wrapping) */}
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 pt-0.5 border-t border-slate-100 gap-1">
            <span className="flex items-center gap-0.5 font-semibold text-emerald-700 truncate" title="100% Authentic Quality Guaranteed">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Genuine</span>
            </span>
            <span className="flex items-center gap-0.5 font-medium text-amber-700 truncate" title="Express Same-Day Dispatch from Warehouse">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Fast Dispatch</span>
            </span>
            <span className="flex items-center gap-0.5 font-medium text-indigo-700 shrink-0" title="Cash on Delivery & Express Nationwide Shipping">
              <Truck className="w-3 h-3 text-[#4F46E5] shrink-0" />
              <span>COD</span>
            </span>
          </div>

          {/* Dual CTA Buttons: Quick 'Add to Cart' and 'Buy Now' with Min 44px Hitboxes */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleAdd}
              disabled={product.inStock === false}
              aria-label={`Add ${product.title} to cart`}
              className={`w-full min-h-[44px] py-2 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none ${
                product.inStock === false
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200/80 hover:border-slate-300'
              }`}
              title="Add to Shopping Cart"
            >
              {isAdded ? (
                <div className="flex items-center gap-1 animate-scaleIn">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="truncate">Added</span>
                </div>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
                  <span className="truncate">Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.inStock === false}
              aria-label={`Instant buy now for ${product.title}`}
              className={`w-full min-h-[44px] py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none ${
                product.inStock === false
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white hover:shadow-indigo-500/20'
              }`}
              title="Instant Buy Now"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="truncate">Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
