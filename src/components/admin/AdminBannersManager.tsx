import React, { useState } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  Sliders, 
  Tag, 
  Flame, 
  CheckCircle2, 
  PhoneCall, 
  Layers, 
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { SystemBannerSettings, PromoBanner } from '../../types';
import { INITIAL_PROMO_BANNERS } from '../../data/banners';

interface AdminBannersManagerProps {
  settings: SystemBannerSettings;
  onUpdateSettings: (newSettings: SystemBannerSettings) => void;
  showToast?: (msg: string) => void;
}

export const AdminBannersManager: React.FC<AdminBannersManagerProps> = ({
  settings,
  onUpdateSettings,
  showToast = () => {},
}) => {
  // Global announcement settings
  const [announcementText, setAnnouncementText] = useState(settings.announcementText);
  const [announcementBadge, setAnnouncementBadge] = useState(settings.announcementBadge);
  const [helplineNumber, setHelplineNumber] = useState(settings.helplineNumber);
  const [heroHeadline, setHeroHeadline] = useState(settings.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(settings.heroSubheadline);
  const [flashSaleTag, setFlashSaleTag] = useState(settings.flashSaleTag);

  // Dynamic promo banners list
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(() => {
    return settings.promoBanners && settings.promoBanners.length > 0
      ? settings.promoBanners
      : INITIAL_PROMO_BANNERS;
  });

  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Banner Form State
  const [newBadge, setNewBadge] = useState('⚡ SPECIAL PROMO');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDiscount, setNewDiscount] = useState('UP TO 30% OFF');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Perfume & Fragrances');
  const [newPrimaryCta, setNewPrimaryCta] = useState('Shop Now');
  const [newPrimaryTarget, setNewPrimaryTarget] = useState('Perfume & Fragrances');
  const [newSecondaryCta, setNewSecondaryCta] = useState('Explore Flash Sale');
  const [newSecondaryTarget, setNewSecondaryTarget] = useState('Flash Sale');
  const [newCode, setNewCode] = useState('VAULT10');
  const [isAddingBanner, setIsAddingBanner] = useState(false);

  // Quick Preset Campaigns
  const applyPreset = (presetName: string) => {
    if (presetName === 'eid') {
      setAnnouncementBadge('🌙 EID MUBARAK');
      setAnnouncementText('Special Eid Fragrance Festival: Get Flat 20% OFF + Free Nationwide Delivery on orders over ৳1500!');
      setFlashSaleTag('EID EXCLUSIVE — UP TO 60% OFF');
      setHeroHeadline('Celebrate Eid With Signature Luxury Scents');
      setHeroSubheadline('Exquisite perfumes, artisanal attars and glowing lifestyle decors curated for your festive moments.');
    } else if (presetName === 'flash') {
      setAnnouncementBadge('⚡ FLASH SALE');
      setAnnouncementText('Limited 48-Hour Vault Rush! Flash discounts up to 50% across 500+ premium authentic items.');
      setFlashSaleTag('MEGA FLASH SALE — 48H ONLY');
      setHeroHeadline('High-Grade Imported Fragrances at Direct Vault Rates');
      setHeroSubheadline('Directly sourced from Paris, Dubai & Milan. 100% verified authentic with certificate of origin.');
    } else if (presetName === 'free_shipping') {
      setAnnouncementBadge('🚚 ZERO DELIVERY FEE');
      setAnnouncementText('Free Nationwide Express Delivery across Bangladesh on all orders today! Use code FREESHIP.');
      setFlashSaleTag('FREE SHIPPING MADNESS');
      setHeroHeadline('Shop Bangladesh’s #1 Authentic Lifestyle Marketplace');
      setHeroSubheadline('Zero delivery charges for Dhaka & all 64 districts. Cash on Delivery & bKash available.');
    } else {
      setAnnouncementBadge('⚡ Flash Offer');
      setAnnouncementText('Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed');
      setFlashSaleTag('UP TO 50% OFF — EXCLUSIVE');
      setHeroHeadline('Luxury Scents & Lifestyle Vault');
      setHeroSubheadline('Bangladesh’s Premier Authentic Perfume & Lifestyle Marketplace. 100% genuine guaranteed with fast nationwide express delivery.');
    }
    showToast(`Applied preset: ${presetName.toUpperCase()}`);
  };

  const handleToggleBannerActive = (bannerId: string) => {
    const updated = promoBanners.map((b) => 
      b.id === bannerId ? { ...b, isActive: !b.isActive } : b
    );
    setPromoBanners(updated);
    showToast('Banner active status updated');
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (promoBanners.length <= 1) {
      showToast('⚠️ Cannot delete the only banner. At least 1 banner is required.');
      return;
    }
    const updated = promoBanners.filter((b) => b.id !== bannerId);
    setPromoBanners(updated);
    showToast('Banner deleted successfully');
  };

  const handleAddBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) {
      showToast('Please provide a banner title and image URL');
      return;
    }

    const created: PromoBanner = {
      id: `banner-${Date.now()}`,
      badge: newBadge.trim(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Authentic imported collection with guaranteed batch codes.',
      discountText: newDiscount.trim() || 'LIMITED TIME OFFER',
      imageUrl: newImageUrl.trim(),
      category: newCategory,
      primaryCtaText: newPrimaryCta.trim() || 'Shop Now',
      primaryCtaTarget: newPrimaryTarget || newCategory,
      secondaryCtaText: newSecondaryCta.trim() || 'Explore Flash Sale',
      secondaryCtaTarget: newSecondaryTarget || 'Flash Sale',
      codeText: newCode.trim() || undefined,
      isActive: true,
    };

    setPromoBanners([created, ...promoBanners]);
    setIsAddingBanner(false);
    // Reset inputs
    setNewTitle('');
    setNewSubtitle('');
    setNewImageUrl('');
    showToast('✓ New Promo Banner added to carousel!');
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: SystemBannerSettings = {
      ...settings,
      announcementText: announcementText.trim(),
      announcementBadge: announcementBadge.trim(),
      helplineNumber: helplineNumber.trim(),
      heroHeadline: heroHeadline.trim(),
      heroSubheadline: heroSubheadline.trim(),
      flashSaleTag: flashSaleTag.trim(),
      promoBanners: promoBanners,
    };
    onUpdateSettings(updated);
    setSavedSuccess(true);
    showToast('🚀 System Banners & Global Announcements saved successfully!');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <span>Homepage Announcements & Promo Banner Manager</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage multi-category hero carousel slides, promo headlines, discount tags, and announcement tickers.
          </p>
        </div>

        {/* Quick Campaign Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('eid')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 transition-colors cursor-pointer"
          >
            🌙 Eid Festive
          </button>
          <button
            type="button"
            onClick={() => applyPreset('flash')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 transition-colors cursor-pointer"
          >
            ⚡ Flash Sale
          </button>
          <button
            type="button"
            onClick={() => applyPreset('free_shipping')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-colors cursor-pointer"
          >
            🚚 Free Shipping
          </button>
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            Default
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: DYNAMIC HERO PROMO BANNERS ================= */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Dynamic Hero Carousel Banners ({promoBanners.length} Slides)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Each banner supports imagery, promotional headlines, discount badges, and 1-click CTA links.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingBanner(!isAddingBanner)}
            className="px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingBanner ? 'Cancel' : 'Add New Slide'}</span>
          </button>
        </div>

        {/* Add New Banner Form Drawer */}
        {isAddingBanner && (
          <form onSubmit={handleAddBannerSubmit} className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-300 pb-1 border-b border-indigo-500/20">
              <span>Create New Promo Banner Slide</span>
              <span className="text-[10px] text-slate-400">Live preview below</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Banner Title / Headline *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hypnotic Smart Lamps & Desktop Decors"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Subtitle / Value Proposition</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Brief description showing under the banner headline..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Campaign Badge Tag</label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="e.g. ⚡ MEGA FLASH SALE"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Discount Tag Text</label>
                <input
                  type="text"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  placeholder="e.g. UP TO 50% OFF"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marketplace Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => {
                    setNewCategory(e.target.value);
                    setNewPrimaryTarget(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="Perfume & Fragrances">Perfume & Fragrances</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                  <option value="Watches & Accessories">Watches & Accessories</option>
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Home & Living">Home & Living</option>
                  <option value="Premium Gifts">Premium Gifts</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Primary CTA Button Label</label>
                <input
                  type="text"
                  value={newPrimaryCta}
                  onChange={(e) => setNewPrimaryCta(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Secondary CTA Button Label</label>
                <input
                  type="text"
                  value={newSecondaryCta}
                  onChange={(e) => setNewSecondaryCta(e.target.value)}
                  placeholder="e.g. Explore Flash Sale"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Coupon Voucher Code (Optional)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. VAULT10"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingBanner(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold hover:brightness-110"
              >
                Add Banner Slide
              </button>
            </div>
          </form>
        )}

        {/* Existing Promo Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {promoBanners.map((banner, index) => (
            <div
              key={banner.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                banner.isActive
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-2">
                {/* Header status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {banner.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBannerActive(banner.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        banner.isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Banner Thumbnail & Info */}
                <div className="flex gap-3 items-center">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-16 h-12 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-950"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded">
                        {banner.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {banner.discountText}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate">
                      {banner.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {banner.subtitle}
                    </p>
                  </div>
                </div>

                {/* CTA Buttons preview */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>
                    Primary CTA: <strong className="text-indigo-300">{banner.primaryCtaText}</strong>
                  </span>
                  {banner.codeText && (
                    <span className="font-mono text-amber-300">
                      Voucher: {banner.codeText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION 2: GLOBAL ANNOUNCEMENT TOPBAR & HELPLINE ================= */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>Global Announcement Topbar & Customer Support Hotline</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Top Bar Badge Text
            </label>
            <input
              type="text"
              value={announcementBadge}
              onChange={(e) => setAnnouncementBadge(e.target.value)}
              placeholder="e.g. ⚡ Flash Offer, 🌙 Eid Fest"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Helpline Phone Number
            </label>
            <input
              type="text"
              value={helplineNumber}
              onChange={(e) => setHelplineNumber(e.target.value)}
              placeholder="e.g. 01883-418309"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Flash Sale Campaign Tag
            </label>
            <input
              type="text"
              value={flashSaleTag}
              onChange={(e) => setFlashSaleTag(e.target.value)}
              placeholder="e.g. UP TO 50% OFF"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Top Header Announcement Marquee Message
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Free Delivery on orders over ৳2000 in Dhaka! | 🇧🇩 100% Genuine Guaranteed"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Save All Changes Action Button */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="text-xs text-slate-400">
          All updates sync immediately with customer storefronts, mobile app views, and LocalStorage.
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          id="admin-save-banners-btn"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Saved & Published Live!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Save & Publish All Banners</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
