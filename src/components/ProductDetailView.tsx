import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ShoppingBag, 
  Zap, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  Heart,
  Share2,
  Flame,
  Award,
  Video,
  Store,
  UserCheck,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  Tag,
  Plus,
  Send,
  Package,
  Box,
  ExternalLink
} from 'lucide-react';
import { Product } from '../types';

export interface ProductDetailViewProps {
  product: Product;
  products?: Product[];
  onBackToShop: () => void;
  onAddToCart: (product: Product, quantity: number, selectedSize?: string) => void;
  onBuyNow: (product: Product, quantity: number, selectedSize?: string) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenSellerStore?: (sellerName: string) => void;
  onOpenReturnPolicy?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  showToast?: (message: string) => void;
}

interface CustomerReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  likes: number;
  hasLiked?: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  products = [],
  onBackToShop,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onOpenSellerStore,
  onOpenReturnPolicy,
  isWishlisted: externalWishlisted,
  onToggleWishlist,
  showToast = () => {},
}) => {
  // Gallery images list (fallback to high-res images if none provided)
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    return [
      product.image,
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800',
    ];
  }, [product]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'sampleVideo' | 'aiTrailer'>('photos');
  const [infoTab, setInfoTab] = useState<'specs' | 'description' | 'seller' | 'reviews'>('description');

  // Mobile Touch Swipe Gesture references for photo gallery
  const photoTouchStartX = useRef<number | null>(null);
  const photoTouchEndX = useRef<number | null>(null);

  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    photoTouchStartX.current = e.touches[0].clientX;
  };

  const handlePhotoTouchMove = (e: React.TouchEvent) => {
    photoTouchEndX.current = e.touches[0].clientX;
  };

  const handlePhotoTouchEnd = () => {
    if (photoTouchStartX.current === null || photoTouchEndX.current === null) return;
    const diff = photoTouchStartX.current - photoTouchEndX.current;
    // Swipe left -> Next image
    if (diff > 45) {
      setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    } 
    // Swipe right -> Previous image
    else if (diff < -45) {
      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    photoTouchStartX.current = null;
    photoTouchEndX.current = null;
  };

  // Variant (Size) selection
  const availableSizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : ['50ml', '100ml', '150ml'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '100ml');

  // Quantity selection
  const [quantity, setQuantity] = useState(1);
  const [internalWishlisted, setInternalWishlisted] = useState(false);
  const isWishlisted = externalWishlisted !== undefined ? externalWishlisted : internalWishlisted;

  const [copySuccess, setCopySuccess] = useState(false);
  const [isFollowingStore, setIsFollowingStore] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const [isBundleAdded, setIsBundleAdded] = useState(false);

  // Video Player state & refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reviews State
  const initialReviews: CustomerReview[] = [
    {
      id: 'rev-1',
      name: 'Arifur Rahman',
      location: 'Mirpur-10, Dhaka',
      rating: 5,
      date: 'Yesterday',
      comment: 'অরিজিনাল প্রোডাক্ট! প্যাকেজিং এবং ফিনিশিং অসাধারণ। ক্যাশ অন ডেলিভারিতে দ্রুত পেয়েছি।',
      verified: true,
      likes: 18,
    },
    {
      id: 'rev-2',
      name: 'Dr. Nusrat Jahan',
      location: 'Uttara, Dhaka',
      rating: 5,
      date: '3 days ago',
      comment: 'এআই ভিডিও রিভিউ দেখে অর্ডার করেছিলাম, বাস্তবে ঠিক যেমনটা আশা করেছিলাম তেমনই পেয়েছি। প্রিমিয়াম কোয়ালিটি!',
      verified: true,
      likes: 24,
    },
    {
      id: 'rev-3',
      name: 'Shakil Anwar',
      location: 'Agrabad, Chattogram',
      rating: 4,
      date: '1 week ago',
      comment: 'সারা বাংলাদেশে ২-৩ দিনের মধ্যে ডেলিভারি পেয়েছি। প্রাইম ভল্ট জোনের সার্ভিস দারুণ, কুপনেও ভালো ছাড় পেয়েছি।',
      verified: true,
      likes: 9,
    },
  ];

  const [reviewsList, setReviewsList] = useState<CustomerReview[]>(initialReviews);

  // Review Form State
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formName, setFormName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formComment, setFormComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Reliable video sources
  const fallbackVideo = 'https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-in-a-dark-setting-41710-large.mp4';
  const activeVideoUrl = activeMediaTab === 'sampleVideo'
    ? (product.sampleVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-cellphone-in-a-dark-room-41716-large.mp4')
    : (product.aiShowcaseVideoUrl || product.videoUrl || fallbackVideo);

  const getYoutubeEmbed = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}`
      : null;
  };

  const youtubeEmbedUrl = useMemo(() => {
    return getYoutubeEmbed(activeVideoUrl);
  }, [activeVideoUrl]);

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImageIndex(0);
    setQuantity(1);
    setIsAddedFeedback(false);
    setIsBundleAdded(false);
  }, [product.id]);

  // Video autoplay policy handling
  useEffect(() => {
    if (activeMediaTab === 'photos') return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [activeMediaTab, activeVideoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTo = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      showToast('✓ Link copied to clipboard!');
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleWishlistToggle = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    } else {
      setInternalWishlisted(prev => !prev);
    }
  };

  // Derive merchant store name consistently
  const storeName = product.storeName || product.sellerName || (() => {
    if (product.category.includes('Perfume') || product.category === 'Attar Perfumes') return 'PerfumeVault BD';
    if (product.category.includes('Gadgets') || product.category === 'Glow Lights') return 'Apex Tech BD';
    if (product.category.includes('Fashion')) return 'Prime Atelier';
    if (product.category.includes('Watches')) return 'Chronos Official';
    if (product.category.includes('Beauty')) return 'Glow & Glam BD';
    if (product.category.includes('Home')) return 'Nordic Living';
    return 'Prime Vault Official';
  })();

  // Calculate or retrieve sold count
  const soldCount = product.soldCount || (() => {
    const charCodeSum = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 80 + (charCodeSum % 420);
  })();

  // Size-adjusted pricing calculation
  const sizeMultiplier = selectedSize.includes('50ml') ? 0.85 : selectedSize.includes('150ml') ? 1.35 : 1;
  const unitPrice = Math.round(product.price * sizeMultiplier);
  const originalPrice = (product.originalPrice && product.originalPrice > product.price)
    ? Math.round(product.originalPrice * sizeMultiplier)
    : null;
  const savings = originalPrice ? Math.max(0, originalPrice - unitPrice) : 0;
  const discountLabel = (originalPrice && originalPrice > unitPrice)
    ? `-${Math.round(((originalPrice - unitPrice) / originalPrice) * 100)}% OFF`
    : product.discount || null;

  const shippingCost = deliveryLocation === 'inside' ? 60 : 120;
  const estimatedDelivery = deliveryLocation === 'inside' ? '24-48 Hours (Inside Dhaka)' : '2-4 Days (Outside Dhaka)';

  // Handle Add to Cart with visual feedback
  const handleAddToCartClick = () => {
    onAddToCart(product, quantity, selectedSize);
    setIsAddedFeedback(true);
    showToast(`✓ Added ${quantity}x ${product.title} (${selectedSize}) to cart`);
    setTimeout(() => setIsAddedFeedback(false), 2000);
  };

  const handleBuyNowClick = () => {
    onBuyNow(product, quantity, selectedSize);
  };

  // Review Form Submit Handler
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) {
      showToast('⚠️ Please enter your name and review details');
      return;
    }

    setIsSubmittingReview(true);
    setTimeout(() => {
      const newReview: CustomerReview = {
        id: `rev-${Date.now()}`,
        name: formName.trim(),
        location: formCity.trim() || 'Dhaka, Bangladesh',
        rating: formRating,
        date: 'Just now',
        comment: formComment.trim(),
        verified: true,
        likes: 1,
      };

      setReviewsList(prev => [newReview, ...prev]);
      setFormName('');
      setFormCity('');
      setFormComment('');
      setFormRating(5);
      setIsSubmittingReview(false);
      showToast('🎉 Thank you! Your verified review has been published.');
    }, 400);
  };

  const handleToggleLikeReview = (reviewId: string) => {
    setReviewsList(prev =>
      prev.map(rev => {
        if (rev.id === reviewId) {
          const isLiked = rev.hasLiked;
          return {
            ...rev,
            likes: isLiked ? rev.likes - 1 : rev.likes + 1,
            hasLiked: !isLiked,
          };
        }
        return rev;
      })
    );
  };

  // Related Products recommendations
  const relatedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const sameCategory = products.filter(p => p.id !== product.id && p.category === product.category);
    if (sameCategory.length >= 4) return sameCategory.slice(0, 6);
    const others = products.filter(p => p.id !== product.id && p.category !== product.category);
    return [...sameCategory, ...others].slice(0, 6);
  }, [products, product]);

  // Complementary product for Frequently Bought Together
  const complementaryProduct = useMemo(() => {
    if (relatedProducts.length > 0) return relatedProducts[0];
    return null;
  }, [relatedProducts]);

  const bundleDiscountMultiplier = 0.92; // extra 8% off bundle
  const bundleTotalPrice = complementaryProduct
    ? Math.round((unitPrice + complementaryProduct.price) * bundleDiscountMultiplier)
    : unitPrice;
  const bundleSavings = complementaryProduct
    ? (unitPrice + complementaryProduct.price) - bundleTotalPrice
    : 0;

  const handleAddBundleToCart = () => {
    onAddToCart(product, 1, selectedSize);
    if (complementaryProduct) {
      onAddToCart(complementaryProduct, 1);
    }
    setIsBundleAdded(true);
    showToast('🎉 Frequently Bought Together combo added to cart with extra 8% savings!');
    setTimeout(() => setIsBundleAdded(false), 2200);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen pt-4 pb-32 md:py-8 font-sans text-slate-800 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* ================= 1. Top Breadcrumb & Action Bar ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto py-0.5">
            <button
              onClick={onBackToShop}
              className="inline-flex items-center gap-1.5 font-bold text-[#4F46E5] hover:text-[#4338CA] cursor-pointer group shrink-0"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Store</span>
            </button>
            <span className="text-slate-300">/</span>
            <button onClick={onBackToShop} className="hover:text-slate-900 cursor-pointer shrink-0">
              Home
            </button>
            <span className="text-slate-300">/</span>
            <button onClick={onBackToShop} className="hover:text-slate-900 cursor-pointer shrink-0 font-medium">
              {product.category}
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">{product.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all relative cursor-pointer"
              title="Share Product"
              aria-label="Share Product"
            >
              <Share2 className="w-4 h-4" />
              {copySuccess && (
                <span className="absolute -bottom-8 right-0 bg-[#4F46E5] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-fadeIn">
                  Link Copied!
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================= 2. Core 2-Column Product Detail Layout ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================
              LEFT COLUMN: MULTI-MEDIA GALLERY SWITCHER
              ======================================================== */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Media Mode Tabs: Photos vs Sample Video vs 3D/AI Cinematic Showcase */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setActiveMediaTab('photos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMediaTab === 'photos'
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Product Photos ({images.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMediaTab('sampleVideo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMediaTab === 'sampleVideo'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-cyan-700'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Sample Unboxing</span>
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => setActiveMediaTab('aiTrailer')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMediaTab === 'aiTrailer'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D / AI Cinematic Trailer</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>

            {/* TAB 1: Photo Gallery & Interactive Thumbnails */}
            {activeMediaTab === 'photos' ? (
              <div className="space-y-3.5">
                {/* Main Viewport with Fluid Touch Swipe Support */}
                <div 
                  onTouchStart={handlePhotoTouchStart}
                  onTouchMove={handlePhotoTouchMove}
                  onTouchEnd={handlePhotoTouchEnd}
                  className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200 group shadow-2xs select-none touch-pan-y"
                >
                  <img
                    src={images[selectedImageIndex] || product.image}
                    alt={product.title}
                    className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105 pointer-events-none"
                    draggable={false}
                  />

                  {/* Over-image Badges */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      In Stock & Verified Authentic
                    </span>
                  </div>

                  {discountLabel && (
                    <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                      <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
                        {discountLabel}
                      </span>
                    </div>
                  )}

                  {/* Previous / Next Image Arrow Overlays with >= 44px Touch Targets */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 z-20"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 z-20"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-slate-200 text-[11px] text-slate-600 font-semibold pointer-events-none">
                    Image {selectedImageIndex + 1} of {images.length} • Swipe to view
                  </div>
                </div>

                {/* Thumbnails Row with comfortable 44px+ touch targets */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative aspect-square min-h-[44px] min-w-[44px] rounded-xl overflow-hidden bg-white border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                        selectedImageIndex === idx
                          ? 'border-[#4F46E5] ring-2 ring-indigo-200 shadow-xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* TAB 2 & 3: Sample Video & 3D/AI Cinematic Showcase Player */
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                      {activeMediaTab === 'sampleVideo'
                        ? 'Product Unboxing & Live Hands-On Demo'
                        : '3D Cinematic Trailer • 360° AI Showcase'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-indigo-900">
                    1080p Ultra HD
                  </span>
                </div>

                {/* HTML5 or YouTube Embed Video Player */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 group">
                  {youtubeEmbedUrl ? (
                    <iframe
                      src={youtubeEmbedUrl}
                      title={product.title}
                      className="w-full h-full object-cover border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        src={activeVideoUrl}
                        poster={product.videoPoster || product.image}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onClick={togglePlay}
                        className="w-full h-full object-cover cursor-pointer"
                      />

                      {!isPlaying && (
                        <div 
                          onClick={togglePlay}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer"
                        >
                          <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Video Controls Bar */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer"
                        />

                        <div className="flex items-center justify-between text-xs text-white">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="text-white hover:text-amber-400 transition-colors p-1 cursor-pointer"
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={toggleMute}
                              className="text-white hover:text-amber-400 transition-colors p-1 flex items-center gap-1 cursor-pointer"
                            >
                              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                              <span className="text-[10px] font-mono text-slate-300">{isMuted ? 'Muted' : 'Sound ON'}</span>
                            </button>

                            <span className="font-mono text-[11px] text-slate-300">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleFullscreen}
                            className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
                            title="Fullscreen"
                          >
                            <Maximize className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>ভিডিওটি স্বয়ংক্রিয়ভাবে প্লে হচ্ছে। অডিও চালু করতে সাউন্ড বাটনে ক্লিক করুন।</span>
                </p>
              </div>
            )}

            {/* Quick Scent or Key Note Preview if available */}
            {product.fragranceNotes && (
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-[#4F46E5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#4F46E5]" />
                  <span><strong>Top Note Preview:</strong> {product.fragranceNotes.top || 'Citrus, Amber & Fresh Woods'}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setInfoTab('specs')}
                  className="font-bold underline hover:text-[#4338CA] cursor-pointer"
                >
                  View Details
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              RIGHT COLUMN: CORE PURCHASE BAR & PRODUCT DETAILS
              ======================================================== */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Category, Store Link & Title */}
            <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                    {product.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    SKU: PVZ-{product.id.toUpperCase()}
                  </span>
                </div>

                {/* Verified Seller Link */}
                <button
                  type="button"
                  onClick={() => onOpenSellerStore ? onOpenSellerStore(storeName) : null}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                  title="Visit Seller Storefront"
                >
                  <Store className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Store: {storeName}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Rating, Reviews & Sold Meta */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 4.8)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-900 ml-1">{(product.rating || 4.8).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({reviewsList.length + 120} Reviews)</span>
                </div>

                <span className="text-slate-300">|</span>

                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <Tag className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span><strong>{soldCount}</strong> Sold</span>
                </div>

                <span className="text-slate-300">|</span>

                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>

            {/* ================= Core Purchase Bar: Pricing & In Stock Status ================= */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              
              {/* Stock Status Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {product.inStock !== false ? 'In Stock & Ready to Dispatch' : 'Out of Stock'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                  VAT Inclusive
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums">
                    ৳{unitPrice.toLocaleString()}
                  </span>

                  {originalPrice && originalPrice > unitPrice && (
                    <span className="text-base text-slate-400 line-through font-mono tabular-nums">
                      ৳{originalPrice.toLocaleString()}
                    </span>
                  )}

                  {discountLabel && (
                    <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-xs font-black shadow-xs">
                      {discountLabel}
                    </span>
                  )}
                </div>

                {savings > 0 && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <span>🎉 আপনি এই অর্ডারে সাশ্রয় করছেন ৳{savings.toLocaleString()}!</span>
                  </p>
                )}
              </div>

              {/* Variant Selector (Size/Volume) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Select Size / Volume:</span>
                  <span className="font-bold text-[#4F46E5]">{selectedSize}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector & Live Subtotal */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Quantity:</span>
                  <span className="text-xs text-slate-500">
                    Subtotal: <strong className="text-slate-900 font-mono text-sm">৳{(unitPrice * quantity).toLocaleString()}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-lg font-bold text-slate-700 hover:bg-white active:bg-slate-200 transition-colors cursor-pointer"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-base text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-lg font-bold text-slate-700 hover:bg-white active:bg-slate-200 transition-colors cursor-pointer"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Express 'Buy Now' and 'Add to Cart' Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <button
                  id="product-detail-buy-now"
                  type="button"
                  onClick={handleBuyNowClick}
                  disabled={product.inStock === false}
                  className={`w-full min-h-[48px] py-3.5 px-5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md ${
                    product.inStock === false
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-indigo-500/20'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Buy Now (অর্ডার করুন)</span>
                </button>

                <button
                  id="product-detail-add-to-cart"
                  type="button"
                  onClick={handleAddToCartClick}
                  disabled={product.inStock === false}
                  className={`w-full min-h-[48px] py-3.5 px-5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border ${
                    product.inStock === false
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : isAddedFeedback
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-indigo-50/80 hover:bg-indigo-100 text-[#4F46E5] border-indigo-200'
                  }`}
                >
                  {isAddedFeedback ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart (ব্যাগে রাখুন)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ================= Verified Seller Info Card ================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div 
                  onClick={() => onOpenSellerStore && onOpenSellerStore(storeName)}
                  className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                >
                  <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#5B21B6] font-black group-hover:bg-purple-200 transition-colors shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-[#171717] group-hover:text-[#5B21B6] transition-colors truncate">
                        {storeName}
                      </h4>
                      <span title="Prime Vault Verified Official Seller">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">Prime Vault Certified Official Partner</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSellerStore && onOpenSellerStore(storeName)}
                  className="px-3 py-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Visit Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seller metrics badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center text-xs">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="font-black text-[#171717] block">98.6%</span>
                  <span className="text-[10px] text-gray-500">Positive Rating</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="font-black text-emerald-600 block">99.2%</span>
                  <span className="text-[10px] text-gray-500">On-Time Dispatch</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="font-black text-[#5B21B6] block">100%</span>
                  <span className="text-[10px] text-gray-500">Response Rate</span>
                </div>
              </div>
            </div>

            {/* ================= 3. Trust & Delivery Info Box ================= */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#4F46E5]" />
                  <span>Delivery Options & Estimated Days</span>
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                  Fast Dispatch
                </span>
              </div>

              {/* Delivery Zone Selector */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryLocation('inside')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryLocation === 'inside'
                      ? 'bg-indigo-50/40 border-[#4F46E5] ring-1 ring-[#4F46E5] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900">Inside Dhaka</div>
                  <div className="text-[11px] text-[#4F46E5] font-bold mt-0.5">৳60 • 24-48 Hours</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryLocation('outside')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryLocation === 'outside'
                      ? 'bg-indigo-50/40 border-[#4F46E5] ring-1 ring-[#4F46E5] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900">Outside Dhaka</div>
                  <div className="text-[11px] text-[#4F46E5] font-bold mt-0.5">৳120 • 2-4 Days</div>
                </button>
              </div>

              {/* Delivery Estimation Line */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Estimated: <strong>{estimatedDelivery}</strong></span>
                </div>
                <span className="font-mono font-bold text-slate-900">Charge: ৳{shippingCost}</span>
              </div>

              {/* 4 Trust Value Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <Award className="w-4 h-4 text-rose-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">Cash on Delivery</div>
                  <div className="text-[9px] text-slate-500">Pay at Doorstep</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <ShieldCheck className="w-4 h-4 text-[#4F46E5] mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">100% Authentic</div>
                  <div className="text-[9px] text-slate-500">Brand Guaranteed</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <Truck className="w-4 h-4 text-emerald-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">Fast Shipping</div>
                  <div className="text-[9px] text-slate-500">Across Bangladesh</div>
                </div>

                <div 
                  onClick={onOpenReturnPolicy}
                  className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-1 transition-all ${
                    onOpenReturnPolicy ? 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50' : ''
                  }`}
                  title="Click to view 7-Day Replacement & Return Policy"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900 flex items-center justify-center gap-0.5">
                    <span>7 Days Return</span>
                    {onOpenReturnPolicy && <span className="text-[9px] text-[#4F46E5]">↗</span>}
                  </div>
                  <div className="text-[9px] text-slate-500">Easy Replacement</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            4. MULTI-TAB INFORMATION SYSTEM
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setInfoTab('description')}
              className={`pb-3 px-4 text-sm font-bold whitespace-nowrap relative cursor-pointer transition-colors ${
                infoTab === 'description'
                  ? 'text-[#4F46E5]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Product Description</span>
              {infoTab === 'description' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#4F46E5] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setInfoTab('specs')}
              className={`pb-3 px-4 text-sm font-bold whitespace-nowrap relative cursor-pointer transition-colors ${
                infoTab === 'specs'
                  ? 'text-[#4F46E5]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Specifications Table</span>
              {infoTab === 'specs' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#4F46E5] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setInfoTab('seller')}
              className={`pb-3 px-4 text-sm font-bold whitespace-nowrap relative cursor-pointer transition-colors ${
                infoTab === 'seller'
                  ? 'text-[#4F46E5]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Seller Store Info</span>
              {infoTab === 'seller' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#4F46E5] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setInfoTab('reviews')}
              className={`pb-3 px-4 text-sm font-bold whitespace-nowrap relative cursor-pointer transition-colors flex items-center gap-1.5 ${
                infoTab === 'reviews'
                  ? 'text-[#4F46E5]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Verified Customer Reviews</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-[#4F46E5] font-extrabold">
                {reviewsList.length + 120}
              </span>
              {infoTab === 'reviews' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#4F46E5] rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Product Description */}
          {infoTab === 'description' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Overview & Experience</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                  {product.description ||
                    'Experience unmatched craftsmanship and luxury with Prime Vault Zone. This product undergoes stringent quality verification to guarantee authenticity, durability, and customer satisfaction.'}
                </p>
              </div>

              {/* Features Checklist */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Key Highlights & Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {product.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <Check className="w-4 h-4 text-[#4F46E5] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fragrance Notes Pyramid (if applicable) */}
              {product.fragranceNotes && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fragrance Notes Pyramid</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
                      <div className="text-xs font-bold uppercase text-[#4F46E5]">Top Notes (0-15 min)</div>
                      <div className="text-sm font-semibold text-slate-900">{product.fragranceNotes.top}</div>
                      <div className="text-xs text-slate-500">First impression of fresh and uplifting aromas.</div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                      <div className="text-xs font-bold uppercase text-amber-700">Heart Notes (2-4 hrs)</div>
                      <div className="text-sm font-semibold text-slate-900">{product.fragranceNotes.heart}</div>
                      <div className="text-xs text-slate-500">Core aromatic identity that defines the sillage.</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                      <div className="text-xs font-bold uppercase text-emerald-800">Base Notes (8-14+ hrs)</div>
                      <div className="text-sm font-semibold text-slate-900">{product.fragranceNotes.base}</div>
                      <div className="text-xs text-slate-500">Deep, enduring warmth that lingers on fabrics.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Specifications Table */}
          {infoTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Technical Specifications</h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 divide-y divide-slate-200 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Merchant Store</span>
                  <span className="font-bold text-slate-900">{storeName}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="font-bold text-slate-900">{product.category}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Product SKU</span>
                  <span className="font-mono font-bold text-slate-900">PVZ-{product.id.toUpperCase()}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Variant / Net Size</span>
                  <span className="font-bold text-slate-900">{selectedSize}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Battery / Longevity</span>
                  <span className="font-bold text-slate-900">8 to 14 Hours (Continuous Performance)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Country of Origin</span>
                  <span className="font-bold text-slate-900">UAE / France / Global Standards</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Authenticity Guarantee</span>
                  <span className="font-bold text-emerald-700">100% Genuine Certified</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500">Package Inclusions</span>
                  <span className="font-bold text-slate-900">Retail Box, Verification Seal & Warranty Card</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Seller Store Info */}
          {infoTab === 'seller' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div 
                  onClick={() => onOpenSellerStore && onOpenSellerStore(storeName)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4F46E5] font-black group-hover:bg-indigo-100 transition-colors">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-[#4F46E5] transition-colors">
                        {storeName}
                      </h4>
                      <span title="Verified Merchant">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Prime Vault Certified Official Partner</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenSellerStore && onOpenSellerStore(storeName)}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#4F46E5] bg-white hover:bg-indigo-50 border border-indigo-200 cursor-pointer transition-colors"
                  >
                    Visit Store
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFollowingStore(!isFollowingStore);
                      showToast(isFollowingStore ? `Unfollowed ${storeName}` : `✓ Now following ${storeName}!`);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isFollowingStore
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                    }`}
                  >
                    {isFollowingStore ? '✓ Following' : '+ Follow Store'}
                  </button>
                </div>
              </div>

              {/* Seller Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-900">98.6%</div>
                  <div className="text-xs text-slate-500 mt-1">Positive Store Ratings</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-900">99.2%</div>
                  <div className="text-xs text-slate-500 mt-1">On-Time Dispatch Rate</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 mt-1">Customer Chat Response</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Customer Reviews & Interactive Review Submission Form */}
          {infoTab === 'reviews' && (
            <div className="space-y-8">
              {/* Summary Rating Overview */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 text-center md:text-left space-y-1">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900">
                    {(product.rating || 4.8).toFixed(1)}
                  </div>
                  <div className="flex justify-center md:justify-start text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Based on {reviewsList.length + 120} verified buyer ratings
                  </p>
                </div>

                {/* Star Distribution Progress Bars */}
                <div className="md:col-span-8 space-y-1.5 text-xs">
                  {[
                    { stars: '5 Star', pct: 86 },
                    { stars: '4 Star', pct: 11 },
                    { stars: '3 Star', pct: 2 },
                    { stars: '2 Star', pct: 1 },
                    { stars: '1 Star', pct: 0 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span className="w-12 text-slate-600 font-medium">{row.stars}</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full" 
                          style={{ width: `${row.pct}%` }} 
                        />
                      </div>
                      <span className="w-8 text-right text-slate-500 font-mono">{row.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Review Submission Form */}
              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Write a Verified Customer Review</h4>
                    <p className="text-xs text-slate-500">Share your genuine experience with other buyers.</p>
                  </div>
                  <span className="text-xs font-semibold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-md">
                    Verified Buyer
                  </span>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Rating:</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setFormHoverRating(star)}
                          onMouseLeave={() => setFormHoverRating(0)}
                          className="p-1 cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (formHoverRating || formRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {formRating === 5 ? '5/5 Excellent' : `${formRating}/5 Good`}
                      </span>
                    </div>
                  </div>

                  {/* Name and City Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. Dhanmondi, Dhaka"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Comment Area */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review *</label>
                    <textarea
                      required
                      rows={3}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="পণ্যটির গুণগত মান, ডেলিভারি সার্ভিস এবং আপনার অভিজ্ঞতা লিখুন..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{rev.date}</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed min-h-[40px]">
                      "{rev.comment}"
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{rev.name}</div>
                        <div className="text-[10px] text-slate-500">{rev.location}</div>
                      </div>

                      <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        <Check className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleLikeReview(rev.id)}
                      className={`flex items-center gap-1 text-[11px] pt-1 cursor-pointer transition-colors ${
                        rev.hasLiked ? 'text-[#4F46E5] font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${rev.hasLiked ? 'fill-[#4F46E5]' : ''}`} />
                      <span>Helpful ({rev.likes})</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            5. FREQUENTLY BOUGHT TOGETHER & RELATED PRODUCTS
            ======================================================== */}
        {complementaryProduct && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Frequently Bought Together</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Complete the Look & Save Extra 8%
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Combo Offer
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              {/* Product 1 + Product 2 visual */}
              <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto w-full md:w-auto">
                {/* Product 1 */}
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shrink-0">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="max-w-[140px]">
                    <div className="text-xs font-bold text-slate-900 truncate">{product.title}</div>
                    <div className="text-xs font-mono font-bold text-[#4F46E5]">৳{unitPrice.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-400">This Item ({selectedSize})</span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
                  <Plus className="w-4 h-4" />
                </div>

                {/* Product 2 */}
                <div 
                  onClick={() => onSelectProduct && onSelectProduct(complementaryProduct)}
                  className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shrink-0 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <img
                    src={complementaryProduct.image}
                    alt={complementaryProduct.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="max-w-[140px]">
                    <div className="text-xs font-bold text-slate-900 truncate">{complementaryProduct.title}</div>
                    <div className="text-xs font-mono font-bold text-[#4F46E5]">৳{complementaryProduct.price.toLocaleString()}</div>
                    <span className="text-[10px] text-slate-400">Complementary Pick</span>
                  </div>
                </div>
              </div>

              {/* Combo Pricing & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto shrink-0 md:border-l md:border-slate-200 md:pl-6">
                <div>
                  <div className="text-xs text-slate-500">Combo Total Price:</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      ৳{bundleTotalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      ৳{(unitPrice + complementaryProduct.price).toLocaleString()}
                    </span>
                  </div>
                  {bundleSavings > 0 && (
                    <div className="text-[11px] font-bold text-emerald-700">
                      You Save ৳{bundleSavings.toLocaleString()} on Combo!
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddBundleToCart}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                    isBundleAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                  }`}
                >
                  {isBundleAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Combo Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add Both to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. Related Products Recommendation Carousel/Grid ================= */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Related Products & Recommendations
                </h3>
                <p className="text-xs text-slate-500">
                  Customers who viewed this item also explored these verified products.
                </p>
              </div>

              <button
                type="button"
                onClick={onBackToShop}
                className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
              >
                View Full Catalog →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {relatedProducts.map((relProduct) => {
                const relDiscount = relProduct.originalPrice && relProduct.originalPrice > relProduct.price
                  ? `-${Math.round(((relProduct.originalPrice - relProduct.price) / relProduct.originalPrice) * 100)}%`
                  : null;

                return (
                  <div
                    key={relProduct.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(relProduct);
                      }
                    }}
                    className="group bg-white rounded-xl border border-slate-200/90 hover:border-[#4F46E5]/40 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xs cursor-pointer"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={relProduct.image}
                        alt={relProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {relDiscount && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                          {relDiscount}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400 truncate">
                          {relProduct.category}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-[#4F46E5] transition-colors mt-0.5 min-h-[2rem]">
                          {relProduct.title}
                        </h4>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ৳{relProduct.price.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(relProduct, 1);
                            showToast(`✓ Added ${relProduct.title} to cart`);
                          }}
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-[#4F46E5] text-slate-700 hover:text-white transition-colors cursor-pointer"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ================= 7. MOBILE STICKY BOTTOM ACTION BAR (Thumb Zone Optimized) ================= */}
      <div 
        id="mobile-sticky-product-bar"
        className="md:hidden fixed bottom-[58px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2.5"
      >
        {/* Left: Price & Variant Info */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-900 font-mono">
              ৳{unitPrice.toLocaleString()}
            </span>
            {originalPrice && originalPrice > unitPrice && (
              <span className="text-[10px] text-slate-400 line-through font-mono">
                ৳{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-medium truncate">
            {selectedSize} • In Stock
          </span>
        </div>

        {/* Right: Quick Action Buttons (Min 44px Hitboxes) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCartClick}
            disabled={product.inStock === false}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border ${
              product.inStock === false
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : isAddedFeedback
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border-indigo-200'
            }`}
            aria-label="Add to cart"
          >
            {isAddedFeedback ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            <span className="text-[11px] font-bold">Cart</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNowClick}
            disabled={product.inStock === false}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md ${
              product.inStock === false
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-[#4F46E5] hover:bg-[#4338CA] shadow-indigo-500/20'
            }`}
            aria-label="Buy now"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="text-[11px] font-black">Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
