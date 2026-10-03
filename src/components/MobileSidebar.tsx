import React from 'react';
import { 
  X, 
  User, 
  Wallet, 
  Package, 
  Heart, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  MessageCircle, 
  PhoneCall, 
  HelpCircle, 
  RotateCcw, 
  Store, 
  LogOut, 
  ChevronRight, 
  Gift, 
  Flame, 
  ShoppingBag,
  ExternalLink,
  Crown,
  Youtube
} from 'lucide-react';
import { UserProfile, ActivePage } from '../types';
import { BrandLogo } from './BrandLogo';
import { checkIsAdmin } from '../services/authService';

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activeNav?: ActivePage | string;
  ordersCount?: number;
  wishlistCount?: number;
  selectedCategory?: string;
  onSelectCategory?: (categoryName: string) => void;
  onOpenAuth?: () => void;
  onOpenOrders?: () => void;
  onOpenWishlist?: () => void;
  onOpenTrackOrder?: () => void;
  onOpenFaq?: () => void;
  onOpenSellerCenter?: () => void;
  onOpenAdmin?: () => void;
  onGoHome?: () => void;
  onLogout?: () => void;
  onOpenYouTubeBonusModal?: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  user,
  activeNav = 'Home',
  ordersCount = 0,
  wishlistCount = 0,
  selectedCategory = 'All',
  onSelectCategory = () => {},
  onOpenAuth = () => {},
  onOpenOrders = () => {},
  onOpenWishlist,
  onOpenTrackOrder = () => {},
  onOpenFaq,
  onOpenSellerCenter,
  onOpenAdmin,
  onGoHome = () => {},
  onLogout,
  onOpenYouTubeBonusModal,
}) => {
  if (!isOpen) return null;

  const isAdmin = checkIsAdmin(user);

  const handleCategoryClick = (catName: string) => {
    onSelectCategory(catName);
    onGoHome();
    onClose();
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/8801883418309?text=Hi%20Kroyghor,%20I%20need%20help', '_blank');
  };

  const handleYouTubeBonusClick = () => {
    if (onOpenYouTubeBonusModal) {
      onOpenYouTubeBonusModal();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto animate-slideRight border-r border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header with Transparent Logo Container */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-transparent sticky top-0 backdrop-blur-md z-10">
          <div onClick={() => { onGoHome(); onClose(); }} className="cursor-pointer bg-transparent">
            <BrandLogo size="md" className="bg-transparent" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-6 flex-1">
          {/* ================= 1. USER PROFILE & ACCOUNT SUMMARY ================= */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/80">
            {user.isLoggedIn ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center font-extrabold text-orange-400 text-base shrink-0">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'KG'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold truncate text-white">{user.name}</h4>
                      {user.isPhoneVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono truncate">{user.phone || user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => { onOpenAuth(); onClose(); }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-300 block font-medium">Wallet Balance</span>
                    <span className="text-xs font-black text-amber-300 font-mono">৳{user.walletBalance || 0} BDT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onOpenOrders(); onClose(); }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-300 block font-medium">My Orders</span>
                    <span className="text-xs font-black text-white font-mono">{ordersCount} Orders</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Kroyghor Member Club</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in or create an account to claim your <strong className="text-amber-300 font-mono font-bold">৳20 Welcome Bonus</strong> instantly!
                </p>
                <button
                  type="button"
                  onClick={() => { onOpenAuth(); onClose(); }}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <User className="w-4 h-4" />
                  <span>Login / Register (+৳20 Bonus)</span>
                </button>
              </div>
            )}
          </div>

          {/* ================= 2. QUICK SHOPPING NAVIGATION ================= */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Shopping & Navigation
            </h5>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { onGoHome(); onClose(); }}
                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                  activeNav === 'Home'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Homepage</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => { onOpenTrackOrder(); onClose(); }}
                className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Track Live Order</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {onOpenWishlist && (
                <button
                  type="button"
                  onClick={() => { onOpenWishlist(); onClose(); }}
                  className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Saved Wishlist</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                    {wishlistCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* ================= 3. POPULAR CATEGORIES ================= */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Top Categories
            </h5>

            <div className="space-y-1">
              {[
                { name: 'Perfumes & Attars', label: 'Perfumes & Attars', emoji: '✨' },
                { name: 'Fashion & Lifestyle', label: 'Fashion & Lifestyle', emoji: '👔' },
                { name: 'Electronics & Tech', label: 'Electronics & Gadgets', emoji: '📱' },
                { name: 'Beauty & Skincare', label: 'Beauty & Skincare', emoji: '💄' },
                { name: 'Watches & Accessories', label: 'Watches & Accessories', emoji: '⌚' },
                { name: 'Home Living', label: 'Home Living', emoji: '🏠' },
                { name: 'Luxury Gifts & Bricks', label: 'Premium Gifts', emoji: '🎁' },
              ].map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full p-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= 3. YOUTUBE CHANNEL SPECIAL BONUS ================= */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              YouTube Channel
            </h5>
            <div className="p-3.5 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 space-y-2.5">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600 fill-current" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">@kroy-ghor Official</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                আমাদের চ্যানেল সাবস্ক্রাইব করলেই ওয়ালেটে সাথে সাথে পেয়ে যাবেন <strong className="text-emerald-600 dark:text-[#10B981] font-bold">৳২০ বোনাস</strong>!
              </p>
              <button
                type="button"
                onClick={handleYouTubeBonusClick}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Subscribe & Claim ৳২০</span>
              </button>
            </div>
          </div>

          {/* ================= 4. CUSTOMER SUPPORT & HELPLINE ================= */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Customer Help & Support
            </h5>

            <div className="space-y-1">
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 font-bold text-xs flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Direct Help</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </button>

              <a
                href="tel:01883418309"
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between cursor-pointer transition-all active:scale-98 animate-none"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-indigo-600" />
                  <span>Helpline: 01883-418309</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>

              {onOpenFaq && (
                <button
                  type="button"
                  onClick={() => { onOpenFaq(); onClose(); }}
                  className="w-full p-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Frequently Asked Questions (FAQ)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* ================= 5. SELLER & ADMIN ACCESS ================= */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            {user.isLoggedIn && (user.role === 'seller' || user.role === 'admin' || isAdmin === true) && onOpenSellerCenter && (
              <button
                type="button"
                onClick={() => { onOpenSellerCenter(); onClose(); }}
                className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-orange-600" />
                  <span>Seller Center (Become a Merchant)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {user.isLoggedIn && (user.role === 'admin' || isAdmin === true) && onOpenAdmin && (
              <button
                type="button"
                onClick={() => { if (onOpenAdmin) onOpenAdmin(); onClose(); }}
                className="w-full p-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-between cursor-pointer transition-all active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Admin Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {user.isLoggedIn && onLogout && (
              <button
                type="button"
                onClick={() => { onLogout(); onClose(); }}
                className="w-full p-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-2.5 cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Account</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
