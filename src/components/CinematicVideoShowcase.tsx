import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Star,
  Flame,
  ShoppingBag,
  ExternalLink,
  Youtube,
  Layers,
  Award
} from 'lucide-react';
import { Product, SystemBannerSettings } from '../types';

interface CinematicVideoShowcaseProps {
  featuredProduct?: Product;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  bannerSettings?: SystemBannerSettings;
  onOpenAdmin?: () => void;
}

export const CinematicVideoShowcase: React.FC<CinematicVideoShowcaseProps> = ({
  featuredProduct,
  onSelectProduct,
  onBuyNow,
  onAddToCart,
  bannerSettings,
  onOpenAdmin,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'film' | 'youtube'>('film');

  // Fallback showcase product
  const spotlightProduct: Product = featuredProduct || {
    id: 'p1',
    title: 'Cool Water Davidoff — Signature Edition',
    name: 'Cool Water Davidoff',
    category: 'Perfume',
    price: 3450,
    originalPrice: 4500,
    rating: 4.9,
    reviewsCount: 328,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800'],
    description: 'Authentic imported aromatic fresh fragrance with crisp mint, ocean water notes, lavender and sandalwood base.',
    tag: 'Trending',
    inStock: true,
    features: ['100% Original Imported', 'All-Day Crisp Sillage', 'Signature Fresh Scent', 'Instant Nationwide Delivery']
  };

  const videoUrl = spotlightProduct.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-and-rose-petals-40291-large.mp4';
  const posterUrl = spotlightProduct.videoPoster || spotlightProduct.image || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=1200';

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format YouTube Embed URL
  const youtubeEmbedUrl = React.useMemo(() => {
    const raw = bannerSettings?.youtubeVideoUrl || 'https://www.youtube.com/watch?v=sU3FkmV9b70';
    if (raw.includes('embed/')) return raw;
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&rel=0` : 'https://www.youtube.com/embed/sU3FkmV9b70?autoplay=1&mute=1&rel=0';
  }, [bannerSettings?.youtubeVideoUrl]);

  return (
    <section 
      id="ai-cinematic-video-showcase" 
      className="py-12 sm:py-16 bg-[#0F172A] text-white border-b border-slate-800 relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4F46E5]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>AI CINEMATIC EXPERIENCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sensory Product Showcase & Visual Verification
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xl">
              Watch 4K high-fidelity product unboxings, authentic batch code audits, and sensory demonstrations before you purchase.
            </p>
          </div>

          {/* Toggle between 4K Film and YouTube Channel */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMediaTab('film')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMediaTab === 'film'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Cinematic Film</span>
            </button>

            <button
              onClick={() => setActiveMediaTab('youtube')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeMediaTab === 'youtube'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Official YouTube</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Video Screen on Left (or center), Spotlight Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* ================= LEFT COLUMN: Video Player Screen ================= */}
          <div className="lg:col-span-8 flex flex-col">
            <div 
              ref={containerRef}
              className="relative w-full aspect-16/10 sm:aspect-16/9 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group flex-1"
            >
              {activeMediaTab === 'film' ? (
                <>
                  {/* HTML5 Autoplay Video Player */}
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={posterUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover object-center group-hover:scale-101 transition-transform duration-700"
                  />

                  {/* Gradient Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 pointer-events-none" />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span>4K Ultra-HD Showcase</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-slate-300 border border-white/10">
                      100% Genuine Guaranteed
                    </div>
                  </div>

                  {/* Center Play/Pause Overlay */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105 active:scale-95 cursor-pointer z-10"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>

                  {/* Bottom Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-10 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider mb-0.5">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>Official Vault Product Showcase</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white drop-shadow-sm">
                          {spotlightProduct.title}
                        </h4>
                      </div>

                      {/* Interactive Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSound}
                          className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
                          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-slate-300" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-[#F59E0B]" />
                          )}
                        </button>

                        <button
                          onClick={toggleFullscreen}
                          className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-colors cursor-pointer"
                          title="Fullscreen View"
                        >
                          <Maximize2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Visualizer Bar */}
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#F59E0B] w-4/5 rounded-full" />
                    </div>
                  </div>
                </>
              ) : (
                /* YouTube Embed View */
                <div className="w-full h-full">
                  <iframe
                    src={youtubeEmbedUrl}
                    title="Kroy Ghor YouTube Showcase"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Spotlight Product Card ================= */}
          <div className="lg:col-span-4 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="space-y-4">
              
              {/* Product Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Star className="w-3.5 h-3.5 fill-current text-indigo-400" />
                  <span>SPOTLIGHT PRODUCT</span>
                </span>
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  In High Demand
                </span>
              </div>

              {/* Product Card Preview */}
              <div 
                onClick={() => onSelectProduct(spotlightProduct)}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={spotlightProduct.image}
                    alt={spotlightProduct.title}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-800 shrink-0 group-hover:scale-102 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">
                      {spotlightProduct.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {spotlightProduct.title}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm sm:text-base font-extrabold font-mono text-white">
                        ৳{spotlightProduct.price.toLocaleString()}
                      </span>
                      {spotlightProduct.originalPrice && spotlightProduct.originalPrice > spotlightProduct.price && (
                        <span className="text-xs text-slate-500 line-through">
                          ৳{spotlightProduct.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Product Features */}
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Certified original import with authentic batch code</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <Zap className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>Express Dhaka 24h & nationwide 64 districts shipping</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <Star className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Rated 4.9/5 by 300+ verified customers in Bangladesh</span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => onBuyNow(spotlightProduct)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-black bg-[#F59E0B] hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-md"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Instant Buy Now — ৳{spotlightProduct.price.toLocaleString()}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddToCart(spotlightProduct)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => onSelectProduct(spotlightProduct)}
                  className="py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Quick View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {bannerSettings?.youtubeChannelUrl && (
                <a
                  href={bannerSettings.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-1 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5 text-rose-500" />
                  <span>Visit Official YouTube Channel</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
