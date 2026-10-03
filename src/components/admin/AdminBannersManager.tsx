import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { 
  PromoSlideBanner, 
  subscribeBannersFromFirestore, 
  saveBannerToFirestore, 
  deleteBannerFromFirestore, 
  toggleBannerActiveInFirestore,
  INITIAL_SLIDER_BANNERS
} from '../../services/bannerService';

interface AdminBannersManagerProps {
  settings?: any;
  onUpdateSettings?: (settings: any) => void;
  showToast?: (msg: string) => void;
}

export const AdminBannersManager: React.FC<AdminBannersManagerProps> = ({
  showToast = () => {},
}) => {
  const [banners, setBanners] = useState<PromoSlideBanner[]>(INITIAL_SLIDER_BANNERS);
  const [editingBanner, setEditingBanner] = useState<PromoSlideBanner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('🎉 FESTIVE OFFER');
  const [imageUrl, setImageUrl] = useState('');
  const [linkType, setLinkType] = useState<'category' | 'product' | 'external' | 'deal'>('deal');
  const [linkTarget, setLinkTarget] = useState('Flash Sale');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Real-time subscribe to Firestore banners collection
  useEffect(() => {
    const unsubscribe = subscribeBannersFromFirestore((data) => {
      setBanners(data);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAddForm = () => {
    setEditingBanner(null);
    setTitle('Durga Puja & Festive Offer');
    setSubtitle('Flat 50% OFF + ৳20 Welcome Bonus across all departments!');
    setBadge('🎉 SPECIAL FESTIVE DEALS');
    setImageUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200');
    setLinkType('deal');
    setLinkTarget('Flash Sale');
    setOrder(banners.length + 1);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (banner: PromoSlideBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setBadge(banner.badge || '');
    setImageUrl(banner.imageUrl || '');
    setLinkType(banner.linkType || 'deal');
    setLinkTarget(banner.linkTarget || banner.linkUrl || 'Flash Sale');
    setOrder(banner.order || 1);
    setIsActive(banner.isActive !== false);
    setIsFormOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      showToast('⚠️ Please enter a valid Banner Image URL.');
      return;
    }

    const bannerData: PromoSlideBanner = {
      id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: badge.trim(),
      imageUrl: imageUrl.trim(),
      linkType,
      linkTarget: linkTarget.trim(),
      linkUrl: linkTarget.trim(),
      order: Number(order) || 1,
      isActive,
      createdAt: editingBanner?.createdAt || new Date().toISOString(),
    };

    await saveBannerToFirestore(bannerData);
    showToast(`✓ Banner "${title || 'Promo Banner'}" saved successfully!`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    setIsFormOpen(false);
  };

  const handleDeleteBanner = async (id: string, name?: string) => {
    if (window.confirm(`Are you sure you want to delete the banner "${name || id}"?`)) {
      await deleteBannerFromFirestore(id);
      showToast(`✓ Banner deleted successfully.`);
    }
  };

  const handleToggleActive = async (banner: PromoSlideBanner) => {
    const nextState = !banner.isActive;
    await toggleBannerActiveInFirestore(banner.id, nextState);
    showToast(`✓ Banner ${nextState ? 'Activated' : 'Deactivated'}.`);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            HOMEPAGE PROMO SLIDER
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Banner & Promotional Slider Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control the top homepage promotional image carousel. Add festive deals, YouTube highlights, or special category links.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddForm}
          className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Promo Banner</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Homepage Slider Banner settings updated and published live!</span>
        </div>
      )}

      {/* Add / Edit Banner Modal Form */}
      {isFormOpen && (
        <form onSubmit={handleSaveBanner} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 animate-slideDown">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-600" />
              <span>{editingBanner ? 'Edit Promo Banner' : 'Create New Promo Banner'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge Text (e.g. 🎉 SPECIAL FESTIVE OFFER)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="🎉 SPECIAL FESTIVE OFFER"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Order Sequence
              </label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Main Title / Headline*
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Durga Puja & Festive Grand Offer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Describe the offer, discounts, or promotional details..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Banner Image URL (Unsplash or CDN image)*
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link / Action Type
              </label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
              >
                <option value="deal">Special Deal / Flash Sale</option>
                <option value="category">Category Page</option>
                <option value="external">External Link (YouTube / Social)</option>
                <option value="product">Specific Product</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Category / URL / Deal Name
              </label>
              <input
                type="text"
                value={linkTarget}
                onChange={(e) => setLinkTarget(e.target.value)}
                placeholder="e.g. Flash Sale or Perfumes & Attars or https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Banner</span>
            </button>
          </div>
        </form>
      )}

      {/* Banners Table / Cards List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Active Homepage Slider Banners ({banners.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Changes reflect instantly on homepage</span>
        </div>

        {banners.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No banners configured yet. Click "Add New Promo Banner" above to create one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner, idx) => (
              <div
                key={banner.id || idx}
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Banner Thumbnail & Text */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-24 sm:w-32 h-16 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-mono font-bold">
                      #{banner.order || idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    {banner.badge && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                        {banner.badge}
                      </span>
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {banner.title || 'Untitled Banner'}
                    </h4>
                    {banner.subtitle && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <span>Target: {banner.linkTarget || 'None'}</span>
                      {banner.linkType === 'external' && <ExternalLink className="w-3 h-3 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Banner Status & Admin Actions */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      banner.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {banner.isActive !== false ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(banner)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Edit Banner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id, banner.title)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBannersManager;
