import React from 'react';
import { 
  Home, 
  Layers, 
  Search, 
  ShoppingBag, 
  User 
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
  isSearchOpen = false,
  isCategoriesDrawerOpen = false,
}) => {
  const isHomeActive = 
    activeNav === 'Home' && 
    activeFilterTab === 'All' && 
    (!selectedCategory || selectedCategory === 'All') && 
    !isSearchOpen && 
    !isCategoriesDrawerOpen;

  const isCategoriesActive = isCategoriesDrawerOpen || (selectedCategory && selectedCategory !== 'All');

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] transition-all"
    >
      <div className="max-w-md mx-auto flex items-center justify-around" role="tablist" aria-label="Mobile View Tabs">
        
        {/* 1. Home Button */}
        <button
          id="mobile-bottom-nav-home"
          role="tab"
          aria-selected={Boolean(isHomeActive)}
          onClick={onGoHome}
          className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-lg ${
            isHomeActive ? 'text-[#4F46E5]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Go to Home"
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-transform ${isHomeActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isHomeActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4F46E5] rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight ${isHomeActive ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
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
          className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-lg ${
            isCategoriesActive ? 'text-[#4F46E5]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Explore Categories"
        >
          <div className="relative">
            <Layers className={`w-5 h-5 transition-transform ${isCategoriesActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isCategoriesActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4F46E5] rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight ${isCategoriesActive ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
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
          className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-lg ${
            isSearchOpen ? 'text-[#4F46E5]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Search Catalog"
        >
          <div className="relative">
            <Search className={`w-5 h-5 transition-transform ${isSearchOpen ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isSearchOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4F46E5] rounded-full" />
            )}
          </div>
          <span className={`text-[10px] tracking-tight ${isSearchOpen ? 'font-bold text-[#4F46E5]' : 'font-medium'}`}>
            Search
          </span>
        </button>

        {/* 4. Cart Button with Live Badge */}
        <button
          id="mobile-bottom-nav-cart"
          role="tab"
          onClick={onOpenCart}
          className="flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-lg relative"
          aria-label={`Shopping Cart with ${cartCount} items`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span 
                id="mobile-bottom-cart-badge"
                className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 bg-[#F59E0B] text-[#0F172A] text-[9px] font-black rounded-full flex items-center justify-center shadow-xs border border-white"
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
          onClick={onOpenAccount}
          className={`flex-1 min-h-[48px] min-w-[44px] py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none rounded-lg ${
            user.isLoggedIn ? 'text-slate-800' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Account and Profile Settings"
        >
          <div className="relative">
            {user.isLoggedIn ? (
              <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
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
  );
});
