import React from 'react';
import { 
  Youtube, 
  Sparkles, 
  ExternalLink, 
  Gift, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet,
  ArrowRight,
  Flame,
  Play
} from 'lucide-react';
import { UserProfile } from '../types';

interface YouTubeBonusBannerProps {
  user?: UserProfile;
  onClaimBonus: () => void;
  onOpenAuth?: () => void;
}

export const YouTubeBonusBanner: React.FC<YouTubeBonusBannerProps> = ({
  user,
  onClaimBonus,
  onOpenAuth,
}) => {
  const channelUrl = 'https://www.youtube.com/@zeropicbd';

  const handleClaimClick = () => {
    if (!user || !user.isLoggedIn) {
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        onClaimBonus();
      }
    } else {
      onClaimBonus();
    }
  };

  return (
    <section 
      id="youtube-bonus-promo-banner" 
      aria-label="YouTube Subscription ৳20 Wallet Bonus Promo"
      className="py-10 sm:py-14 bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e1b4b] text-white border-y border-slate-800 relative overflow-hidden"
    >
      {/* Background Ambience Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & Value Proposition (7 Cols) */}
          <div className="lg:col-span-7 space-y-4 text-left">
            
            {/* Top Eyebrow Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
                <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
                <span>OFFICIAL YOUTUBE COMMUNITY REWARD</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>৳20 Instant Wallet Credit</span>
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Subscribe to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">@zeropicbd</span> & Get ৳20 Shopping Bonus!
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Join our growing lifestyle community on YouTube for 4K authentic perfume batch tests, smart tech unboxings, and exclusive discount codes. Subscribe to <strong>@zeropicbd</strong>, submit your handle, and enjoy ৳20 credited directly to your ZeropicBD digital wallet.
            </p>

            {/* 3 Step Micro Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-red-600/30 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 border border-red-500/40">
                  1
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Subscribe</h3>
                  <p className="text-[11px] text-slate-400">Visit @zeropicbd</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/40">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Submit Handle</h3>
                  <p className="text-[11px] text-slate-400">Enter your channel name</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/40">
                  3
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Spend ৳20</h3>
                  <p className="text-[11px] text-slate-400">Deduct at checkout</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-98 group"
              >
                <Youtube className="w-4 h-4 fill-white" />
                <span>Visit @zeropicbd on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <button
                onClick={handleClaimClick}
                className="px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Wallet className="w-4 h-4 text-slate-950" />
                <span>{user?.hasClaimedYouTubeBonus ? 'View Wallet Balance' : 'Claim ৳20 Bonus Now'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            {/* Micro Guarantees */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                1-Time Claim Per Customer
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                No Minimum Spend Required
              </span>
            </div>

          </div>

          {/* Right Video / Visual Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden bg-slate-800/90 border border-slate-700 shadow-2xl p-4 sm:p-5 group">
              
              {/* Channel Profile Header */}
              <div className="flex items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-base shadow-md ring-2 ring-red-400/40">
                    <Youtube className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      ZeropicBD Official
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">✓</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">@zeropicbd</p>
                  </div>
                </div>

                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                >
                  <span>Subscribe</span>
                </a>
              </div>

              {/* Video Thumbnail with Play Trigger */}
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800"
                  alt="ZeropicBD YouTube Channel Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-xs text-[11px] text-slate-200 font-medium flex items-center justify-between">
                  <span className="truncate">Authentic Unboxings & Batch Verifications</span>
                  <span className="text-red-400 font-bold uppercase ml-2 text-[10px] shrink-0">4K Ultra HD</span>
                </div>
              </a>

              {/* Bonus Counter Footnote */}
              <div className="mt-3.5 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Over 1,200+ bonuses claimed
                </span>
                <span className="text-emerald-400 font-bold">100% Free Store Credit</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
