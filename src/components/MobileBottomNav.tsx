import React, { useState } from 'react';
import { 
  Home, 
  Layers, 
  Search, 
  ShoppingBag, 
  User,
  LogOut,
  X,
  Package,
  ShieldCheck,
  Store,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { UserProfile } from '../types';

interface MobileBottomNavProps {
  activeNav: string;
  activeFilterTab?: string;
  selectedCategory?: string;
  cartCount: number;
  user: UserProfile;
  onGoHome: () => void;
  onOpenCategories: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onLogout?: () => void;
  onOpenOrders?: () => void;
  onOpenAdmin?: () => void;
  onOpenSellerCenter?: () => void;
  isSearchOpen?: boolean;
  isCategoriesDrawerOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({
  activeNav,
  activeFilterTab,
  selectedCategory,
  cartCount,
  user,
  onGoHome,
  onOpenCategories,
  onOpenSearch,
  onOpenCart,
  onOpenAccount,
  onLogout,
  onOpenOrders,
  onOpenAdmin,
  onOpenSellerCenter,
  isSearchOpen = false,
  isCategoriesDrawerOpen = false,
}) => {
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const isHomeActive = 
    activeNav === 'Home' && 
    activeFilterTab === 'All' && 
    (!selectedCategory || selectedCategory === 'All') && 
    !isSearchOpen && 
    !isCategoriesDrawerOpen;

  const isCategoriesActive = isCategoriesDrawerOpen || (selectedCategory && selectedCategory !== 'All');

  return (
    <>
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] transition-all"
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative" role="tablist" aria-label="Mobile View Tabs">
          
          {/* 1. Home Button */}
          <button
            id="mobile-bottom-nav-home"
            role="tab"
            aria-selected={Boolean(isHomeActive)}
            onClick={onGoHome}
            className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-xl relative ${
              isHomeActive ? 'text-[#4F46E5] bg-indigo-50/60' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Go to Home"
          >
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform duration-200 ${isHomeActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {isHomeActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#4F46E5] rounded-full animate-scaleIn" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight transition-all duration-200 ${isHomeActive ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
              Home
            </span>
          </button>

          {/* 2. Categories Button */}
          <button
            id="mobile-bottom-nav-categories"
            role="tab"
            aria-selected={Boolean(isCategoriesActive)}
            aria-expanded={isCategoriesDrawerOpen}
            onClick={onOpenCategories}
            className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-xl relative ${
              isCategoriesActive ? 'text-[#4F46E5] bg-indigo-50/60' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Explore Categories"
          >
            <div className="relative">
              <Layers className={`w-5 h-5 transition-transform duration-200 ${isCategoriesActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {isCategoriesActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#4F46E5] rounded-full animate-scaleIn" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight transition-all duration-200 ${isCategoriesActive ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
              Categories
            </span>
          </button>

          {/* 3. Search Button */}
          <button
            id="mobile-bottom-nav-search"
            role="tab"
            aria-selected={Boolean(isSearchOpen)}
            aria-expanded={isSearchOpen}
            onClick={onOpenSearch}
            className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-xl relative ${
              isSearchOpen ? 'text-[#4F46E5] bg-indigo-50/60' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Search Catalog"
          >
            <div className="relative">
              <Search className={`w-5 h-5 transition-transform duration-200 ${isSearchOpen ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {isSearchOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#4F46E5] rounded-full animate-scaleIn" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight transition-all duration-200 ${isSearchOpen ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
              Search
            </span>
          </button>

          {/* 4. Cart Button with Live Badge */}
          <button
            id="mobile-bottom-nav-cart"
            role="tab"
            onClick={onOpenCart}
            className="flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-800 transition-all duration-200 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-xl relative"
            aria-label={`Shopping Cart with ${cartCount} items`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span 
                  id="mobile-bottom-cart-badge"
                  className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 bg-[#F59E0B] text-[#0F172A] text-[9px] font-black rounded-full flex items-center justify-center shadow-xs border border-white animate-badgePop"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              Cart
            </span>
          </button>

          {/* 5. Account / Profile Button */}
          <button
            id="mobile-bottom-nav-account"
            role="tab"
            onClick={() => {
              if (user.isLoggedIn) {
                setIsAccountSheetOpen(true);
              } else {
                onOpenAccount();
              }
            }}
            className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer active:scale-90 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-xl relative ${
              user.isLoggedIn ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Account and Profile Settings"
          >
            <div className="relative">
              {user.isLoggedIn ? (
                <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold shadow-xs overflow-hidden ring-2 ring-indigo-200">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              ) : (
                <User className="w-5 h-5 stroke-[1.8]" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight truncate max-w-[58px]">
              {user.isLoggedIn ? (user.name.split(' ')[0] || 'Profile') : 'Account'}
            </span>
          </button>

        </div>
      </nav>

      {/* Mobile Account Bottom Drawer Modal for Logged-In Users */}
      {user.isLoggedIn && isAccountSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setIsAccountSheetOpen(false)}
          />

          {/* Sheet Card */}
          <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 max-w-lg mx-auto w-full animate-slideUp text-slate-900 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Profile</span>
              <button
                type="button"
                onClick={() => setIsAccountSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Identity Banner */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#007BFF] text-white flex items-center justify-center font-black text-lg shrink-0 overflow-hidden shadow-md">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email || 'No email associated'}</p>
                {user.phone && <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.phone}</p>}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-md">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Seller' : 'Customer'}
                  </span>
                  {typeof user.walletBalance === 'number' && user.walletBalance > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-md flex items-center gap-1">
                      <Wallet className="w-2.5 h-2.5" />
                      ৳{user.walletBalance}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="space-y-1 my-2">
              <button
                type="button"
                onClick={() => {
                  setIsAccountSheetOpen(false);
                  onOpenAccount();
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#007BFF]" />
                  <span>প্রোফাইল ও ঠিকানা (Profile & Address)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {onOpenOrders && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountSheetOpen(false);
                    onOpenOrders();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>আমার অর্ডারসমূহ (My Orders)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {(user.role === 'admin' || user.role === 'super_admin') && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountSheetOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>অ্যাডমিন ড্যাশবোর্ড (Admin Panel)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </button>
              )}

              {(user.role === 'seller' || user.role === 'admin' || user.role === 'super_admin') && onOpenSellerCenter && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountSheetOpen(false);
                    onOpenSellerCenter();
                  }}
                  className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>মার্চেন্ট সেন্টার (Seller Center)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>
              )}
            </div>

            {/* Prominent Log Out Button */}
            <button
              type="button"
              id="mobile-nav-logout-btn"
              onClick={() => {
                setIsAccountSheetOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>সাইন আউট করুন (Log Out)</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
});
