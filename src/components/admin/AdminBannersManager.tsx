import React, { useState, useEffect } from 'react';
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
  ToggleRight,
  Gift,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { SystemBannerSettings, PromoBanner, CampaignBannerConfig } from '../../types';
import { INITIAL_PROMO_BANNERS } from '../../data/banners';
import { 
  saveCampaignBannerToFirestore, 
  getCampaignBannerFromFirestore,
  DEFAULT_CAMPAIGN_BANNER 
} from '../../services/campaignBannerService';

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

  // ================= SEASONAL CAMPAIGN BANNER STATE (TASK 13) =================
  const [campaignEnabled, setCampaignEnabled] = useState<boolean>(
    settings.campaignBanner?.isEnabled ?? true
  );
  const [campaignTitle, setCampaignTitle] = useState<string>(
    settings.campaignBanner?.title || DEFAULT_CAMPAIGN_BANNER.title
  );
  const [campaignSubtitle, setCampaignSubtitle] = useState<string>(
    settings.campaignBanner?.subtitle || DEFAULT_CAMPAIGN_BANNER.subtitle
  );
  const [campaignPromoCode, setCampaignPromoCode] = useState<string>(
    settings.campaignBanner?.promoCode || DEFAULT_CAMPAIGN_BANNER.promoCode || 'ZEROPICBD'
  );
  const [campaignBadge, setCampaignBadge] = useState<string>(
    settings.campaignBanner?.badgeText || DEFAULT_CAMPAIGN_BANNER.badgeText || '🎉 FESTIVE OFFER'
  );
  const [campaignBgColor, setCampaignBgColor] = useState<string>(
    settings.campaignBanner?.bgColor || DEFAULT_CAMPAIGN_BANNER.bgColor || 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)'
  );
  const [campaignBgImageUrl, setCampaignBgImageUrl] = useState<string>(
    settings.campaignBanner?.bgImageUrl || ''
  );
  const [campaignButtonText, setCampaignButtonText] = useState<string>(
    settings.campaignBanner?.buttonText || DEFAULT_CAMPAIGN_BANNER.buttonText
  );
  const [campaignLinkTarget, setCampaignLinkTarget] = useState<string>(
    settings.campaignBanner?.linkTarget || DEFAULT_CAMPAIGN_BANNER.linkTarget
  );
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [campaignSavedSuccess, setCampaignSavedSuccess] = useState(false);

  // Load latest campaign banner from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    getCampaignBannerFromFirestore().then((remoteConfig) => {
      if (!isMounted || !remoteConfig) return;
      setCampaignEnabled(remoteConfig.isEnabled);
      setCampaignTitle(remoteConfig.title);
      setCampaignSubtitle(remoteConfig.subtitle);
      setCampaignPromoCode(remoteConfig.promoCode || '');
      setCampaignBadge(remoteConfig.badgeText || '');
      setCampaignBgColor(remoteConfig.bgColor || 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)');
      setCampaignBgImageUrl(remoteConfig.bgImageUrl || '');
      setCampaignButtonText(remoteConfig.buttonText || 'Shop Festival Deals');
      setCampaignLinkTarget(remoteConfig.linkTarget || '#explore');
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSaveCampaignBanner = async () => {
    setIsSavingCampaign(true);
    const config: CampaignBannerConfig = {
      isEnabled: campaignEnabled,
      title: campaignTitle.trim(),
      subtitle: campaignSubtitle.trim(),
      promoCode: campaignPromoCode.trim() || undefined,
      badgeText: campaignBadge.trim() || undefined,
      bgColor: campaignBgColor.trim() || 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)',
      bgImageUrl: campaignBgImageUrl.trim() || undefined,
      buttonText: campaignButtonText.trim() || 'Shop Now',
      linkTarget: campaignLinkTarget.trim() || '#explore',
    };

    try {
      await saveCampaignBannerToFirestore(config);
      // Also update local banner settings
      onUpdateSettings({
        ...settings,
        campaignBanner: config,
      });
      setCampaignSavedSuccess(true);
      showToast('✓ Seasonal Campaign Banner updated and published to Firestore (settings/campaign_banner)!');
      setTimeout(() => setCampaignSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      showToast('❌ Failed to update campaign banner in Firestore.');
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const applyCampaignPreset = (preset: 'eid' | 'festive' | 'mega_deal' | 'ramadan' | 'zero_shipping') => {
    if (preset === 'eid') {
      setCampaignBadge('🌙 EID MUBARAK SPECIAL');
      setCampaignTitle('Eid Mega Festival 2026');
      setCampaignSubtitle('Flat 20% OFF on all signature perfumes, attars & lifestyle products!');
      setCampaignPromoCode('EID2026');
      setCampaignBgColor('linear-gradient(135deg, #064E3B 0%, #047857 50%, #D97706 100%)');
      setCampaignButtonText('Shop Eid Collection');
      setCampaignLinkTarget('Perfume & Fragrances');
    } else if (preset === 'festive') {
      setCampaignBadge('🎉 FESTIVE SUPER SALE');
      setCampaignTitle('Exclusive Seasonal Offer');
      setCampaignSubtitle('Get up to 40% OFF + ৳20 Instant Wallet Credit across all premium departments!');
      setCampaignPromoCode('ZEROPICBD');
      setCampaignBgColor('linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)');
      setCampaignButtonText('Explore Super Deals');
      setCampaignLinkTarget('#explore');
    } else if (preset === 'mega_deal') {
      setCampaignBadge('⚡ 48-HOUR FLASH BLOWOUT');
      setCampaignTitle('Midnight Deal Carnival');
      setCampaignSubtitle('Massive clearance discounts up to 50% on gadgets, luxury watches & apparel!');
      setCampaignPromoCode('FLASH50');
      setCampaignBgColor('linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #F59E0B 100%)');
      setCampaignButtonText('View Flash Deals');
      setCampaignLinkTarget('Flash Sale');
    } else if (preset === 'ramadan') {
      setCampaignBadge('🕌 RAMADAN KAREEM');
      setCampaignTitle('Holy Month Fragrance & Gift Specials');
      setCampaignSubtitle('Pure organic attars and luxury prayer gift boxes with special discounts!');
      setCampaignPromoCode('BARAKAH');
      setCampaignBgColor('linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #059669 100%)');
      setCampaignButtonText('Shop Attars & Gifts');
      setCampaignLinkTarget('Perfume & Fragrances');
    } else if (preset === 'zero_shipping') {
      setCampaignBadge('🚚 ZERO DELIVERY FEE');
      setCampaignTitle('Nationwide Free Shipping Week');
      setCampaignSubtitle('Free express courier delivery on all orders across all 64 districts!');
      setCampaignPromoCode('FREESHIP');
      setCampaignBgColor('linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0284C7 100%)');
      setCampaignButtonText('Order with Free Shipping');
      setCampaignLinkTarget('#explore');
    }
    showToast(`Applied preset: ${preset.toUpperCase()}`);
  };

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

      {/* ================= SECTION: SEASONAL & FESTIVE CAMPAIGN BANNER (TASK 13) ================= */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4 shadow-lg relative overflow-hidden">
        
        {/* Top Header & Toggle Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm sm:text-base font-bold text-white">
                Seasonal & Festive Campaign Announcement Banner
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                campaignEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {campaignEnabled ? '● LIVE ON STOREFRONT' : '○ DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin-controlled top announcement strip synced live with Firestore document <code className="text-indigo-400">settings/campaign_banner</code>.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCampaignEnabled(!campaignEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                campaignEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {campaignEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Banner Enabled</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span>Banner Disabled</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Campaign Presets Bar */}
        <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Festive Presets:
          </span>
          <button
            type="button"
            onClick={() => applyCampaignPreset('festive')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 transition-colors cursor-pointer"
          >
            🎉 Festive Super Sale
          </button>
          <button
            type="button"
            onClick={() => applyCampaignPreset('eid')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-colors cursor-pointer"
          >
            🌙 Eid Mubarak
          </button>
          <button
            type="button"
            onClick={() => applyCampaignPreset('mega_deal')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 transition-colors cursor-pointer"
          >
            ⚡ 48h Flash Blowout
          </button>
          <button
            type="button"
            onClick={() => applyCampaignPreset('ramadan')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 transition-colors cursor-pointer"
          >
            🕌 Ramadan Kareem
          </button>
          <button
            type="button"
            onClick={() => applyCampaignPreset('zero_shipping')}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 transition-colors cursor-pointer"
          >
            🚚 Free Shipping Week
          </button>
        </div>

        {/* Live Storefront Preview Strip */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              Live Storefront Announcement Preview:
            </span>
            <span className="text-[11px] text-slate-500">
              {campaignEnabled ? 'Visible on Storefront' : 'Currently Hidden from Customers'}
            </span>
          </div>

          <div 
            style={
              campaignBgImageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${campaignBgImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : { background: campaignBgColor }
            }
            className="p-3 rounded-xl border border-white/15 text-white shadow-inner flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {campaignBadge && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider border border-white/20 shrink-0">
                  {campaignBadge}
                </span>
              )}
              <strong className="text-white shrink-0">{campaignTitle || 'Campaign Title'}:</strong>
              <span className="text-white/90 truncate max-w-sm sm:max-w-md">{campaignSubtitle || 'Campaign subtitle description goes here.'}</span>
              {campaignPromoCode && (
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-bold text-[10px] shrink-0">
                  CODE: {campaignPromoCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {campaignButtonText && (
                <span className="px-2.5 py-1 rounded bg-white text-slate-900 font-bold text-[11px] shadow-xs">
                  {campaignButtonText} →
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          
          {/* Campaign Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Campaign Title *
            </label>
            <input
              type="text"
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              placeholder="e.g. Festive Super Sale"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Banner Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Banner Subtitle *
            </label>
            <input
              type="text"
              value={campaignSubtitle}
              onChange={(e) => setCampaignSubtitle(e.target.value)}
              placeholder="e.g. Get Up To 15% OFF on all fragrances!"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Promo Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Promo Code / Voucher (Optional)
            </label>
            <input
              type="text"
              value={campaignPromoCode}
              onChange={(e) => setCampaignPromoCode(e.target.value)}
              placeholder="e.g. ZEROPICBD or EID2026"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Badge Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Top Badge Text
            </label>
            <input
              type="text"
              value={campaignBadge}
              onChange={(e) => setCampaignBadge(e.target.value)}
              placeholder="e.g. 🎉 FESTIVE OFFER, 🌙 EID SPECIAL"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Action Button Text
            </label>
            <input
              type="text"
              value={campaignButtonText}
              onChange={(e) => setCampaignButtonText(e.target.value)}
              placeholder="e.g. Shop Now, Explore Deals"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Link Target */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Action Link Target
            </label>
            <select
              value={campaignLinkTarget}
              onChange={(e) => setCampaignLinkTarget(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="#explore">#explore (Curated Products Section)</option>
              <option value="/checkout">/checkout (Direct Checkout Page)</option>
              <option value="Flash Sale">Flash Sale Deals Tab</option>
              <option value="Perfume & Fragrances">Perfume & Fragrances Department</option>
              <option value="Electronics & Gadgets">Electronics & Gadgets Department</option>
              <option value="Fashion & Lifestyle">Fashion & Lifestyle Department</option>
              <option value="Watches & Accessories">Watches & Accessories Department</option>
            </select>
          </div>

          {/* Background Gradient / Color */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Background Color / CSS Gradient
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={campaignBgColor}
                onChange={(e) => setCampaignBgColor(e.target.value)}
                placeholder="e.g. linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
              />
              {/* Quick Gradient Palette Swatches */}
              <div className="flex items-center gap-1">
                {[
                  { bg: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)', label: 'Indigo Rose' },
                  { bg: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #D97706 100%)', label: 'Emerald Gold' },
                  { bg: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #F59E0B 100%)', label: 'Crimson Ember' },
                  { bg: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #059669 100%)', label: 'Royal Teal' },
                  { bg: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0284C7 100%)', label: 'Midnight Blue' },
                ].map((swatch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCampaignBgColor(swatch.bg)}
                    style={{ background: swatch.bg }}
                    className="w-7 h-7 rounded-lg border border-white/30 hover:scale-110 transition-transform cursor-pointer shrink-0"
                    title={swatch.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Optional Background Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Optional Background Image URL
            </label>
            <input
              type="url"
              value={campaignBgImageUrl}
              onChange={(e) => setCampaignBgImageUrl(e.target.value)}
              placeholder="e.g. https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

        </div>

        {/* Save Campaign Banner to Firestore Action */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Saves directly to Firestore collection <strong className="text-indigo-300">settings/campaign_banner</strong> with instant real-time synchronization.
          </p>

          <button
            type="button"
            onClick={handleSaveCampaignBanner}
            disabled={isSavingCampaign}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 ${
              campaignSavedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
            }`}
          >
            {isSavingCampaign ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing to Firestore...</span>
              </>
            ) : campaignSavedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Saved & Deployed Live!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Save & Deploy Campaign Banner</span>
              </>
            )}
          </button>
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
