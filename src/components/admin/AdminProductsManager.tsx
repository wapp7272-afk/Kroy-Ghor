import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Image as ImageIcon,
  Upload,
  Sparkles,
  AlertCircle,
  Tag,
  Eye,
  Video,
  Layers,
  Star,
  CheckCircle2,
  Play,
  Minus,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  ExternalLink,
  Flame,
  ShieldCheck,
  Hash,
  Box,
  SlidersHorizontal,
  Clock,
  Table as TableIcon,
  LayoutGrid,
  TrendingUp,
  PackageCheck,
  PackageX,
  Coins,
  DollarSign
} from 'lucide-react';
import { Product } from '../../types';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

export interface AdminProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onResetDemoProducts?: () => void;
  showToast?: (msg: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Perfume',
  'Attar Perfumes',
  'Glow Lights',
  'Notebooks',
  'Bricks Toys',
  'Accessories',
  'Watches',
  'Fashion Accessories',
  'Home Decor',
  'Electronics & Gadgets'
];

const PRESET_BADGES = [
  'Featured',
  'Best Seller',
  'New Arrival',
  'On Sale',
  'Trending',
  'Limited Edition'
];

interface SizeVariantItem {
  size: string;
  price: number;
}

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onResetDemoProducts,
  showToast = () => {},
}) => {
  // View mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order'>('all');
  const [featuredOnlyFilter, setFeaturedOnlyFilter] = useState(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [dummyPurgeModalOpen, setDummyPurgeModalOpen] = useState(false);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); // Sale / Selling price
  const [regularPrice, setRegularPrice] = useState(''); // MSRP / Regular price
  const [sku, setSku] = useState('');
  const [stockQuantityInput, setStockQuantityInput] = useState('25');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'pre_order'>('in_stock');
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState('5');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Badges & Tags
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['Best Seller']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Variants & Sizes with custom prices
  const [variantsList, setVariantsList] = useState<SizeVariantItem[]>([
    { size: '50ml', price: 1250 },
    { size: '100ml', price: 2150 }
  ]);
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  // Media (Images & Video)
  const [primaryImage, setPrimaryImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPoster, setVideoPoster] = useState('');
  const [featuresText, setFeaturesText] = useState('');

  // Form Error
  const [formError, setFormError] = useState<string | null>(null);

  // Extract all categories dynamically from existing products + defaults
  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Identify dummy products
  const dummyProductIds = useMemo(() => {
    return products
      .filter((p) => {
        const id = p.id.toLowerCase();
        return (
          (id.startsWith('p') && !isNaN(Number(id.slice(1)))) ||
          id.startsWith('glow-') ||
          id.startsWith('attar-') ||
          id.startsWith('note-') ||
          id.startsWith('brick-') ||
          id.startsWith('acc-') ||
          id.startsWith('tech-') ||
          id.startsWith('demo-')
        );
      })
      .map((p) => p.id);
  }, [products]);

  // Helper to determine accurate stock quantity
  const getProductStock = (product: Product): number => {
    if (product.stockQuantity !== undefined) return product.stockQuantity;
    if (product.inStock === false) return 0;
    const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 15 + (hash % 20);
  };

  // Helper to determine stock status with low stock check
  const getProductStockStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order' => {
    const stock = getProductStock(product);
    if (product.stockStatus === 'pre_order') return 'pre_order';
    if (product.inStock === false || stock <= 0) return 'out_of_stock';
    const lowThreshold = product.lowStockThreshold || 5;
    if (stock < lowThreshold) return 'low_stock';
    return 'in_stock';
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      // Stock filter
      if (selectedStockFilter !== 'all') {
        const status = getProductStockStatus(p);
        if (selectedStockFilter === 'low_stock' && status !== 'low_stock') return false;
        if (selectedStockFilter === 'in_stock' && status !== 'in_stock' && status !== 'low_stock') return false;
        if (selectedStockFilter === 'out_of_stock' && status !== 'out_of_stock') return false;
        if (selectedStockFilter === 'pre_order' && status !== 'pre_order') return false;
      }

      // Featured filter
      if (featuredOnlyFilter && !p.isFeatured) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSubtitle = (p.subtitle || '').toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesCategory = (p.category || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || p.id).toLowerCase().includes(q);
        const matchesTag = p.tag?.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
        return matchesTitle || matchesSubtitle || matchesDesc || matchesCategory || matchesSku || matchesTag;
      }

      return true;
    });
  }, [products, selectedCategory, selectedStockFilter, featuredOnlyFilter, searchQuery]);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk Delete
  const handleConfirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (onBulkDeleteProducts) {
      onBulkDeleteProducts(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteProduct(id));
    }
    setSelectedIds(new Set());
    setBulkDeleteModalOpen(false);
  };

  // Purge All Dummy Products
  const handleConfirmPurgeDummy = () => {
    if (dummyProductIds.length === 0) return;
    if (onBulkDeleteProducts) {
      onBulkDeleteProducts(dummyProductIds);
    } else {
      dummyProductIds.forEach((id) => onDeleteProduct(id));
    }
    const next = new Set(selectedIds);
    dummyProductIds.forEach((id) => next.delete(id));
    setSelectedIds(next);
    setDummyPurgeModalOpen(false);
  };

  // Quick Inline Stock Adjustments
  const handleInlineStockDelta = (product: Product, delta: number) => {
    const current = getProductStock(product);
    const updated = Math.max(0, current + delta);
    onUpdateProduct({
      ...product,
      stockQuantity: updated,
      inStock: updated > 0,
      stockStatus: updated === 0 ? 'out_of_stock' : (product.stockStatus === 'pre_order' ? 'pre_order' : 'in_stock')
    });
  };

  // Quick Inline Stock Status Change
  const handleInlineToggleStatus = (product: Product, newStatus: 'in_stock' | 'out_of_stock' | 'pre_order') => {
    const isNowInStock = newStatus !== 'out_of_stock';
    const currentStock = getProductStock(product);
    const updatedStock = newStatus === 'out_of_stock' ? 0 : (currentStock === 0 ? 15 : currentStock);

    onUpdateProduct({
      ...product,
      stockStatus: newStatus,
      inStock: isNowInStock,
      stockQuantity: updatedStock
    });
  };

  // Quick Inline Featured Toggle
  const handleInlineToggleFeatured = (product: Product) => {
    onUpdateProduct({
      ...product,
      isFeatured: !product.isFeatured,
    });
  };

  // Quick Inline Active Toggle
  const handleInlineToggleActive = (product: Product) => {
    const currentActive = product.isActive !== false && product.inStock !== false;
    onUpdateProduct({
      ...product,
      isActive: !currentActive,
      inStock: !currentActive,
      stockStatus: !currentActive ? 'in_stock' : 'out_of_stock'
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSubtitle('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setSubCategory('');
    setDescription('');
    setPrice('');
    setRegularPrice('');
    setSku(`ZPBD-${Math.floor(1000 + Math.random() * 9000)}`);
    setStockQuantityInput('25');
    setStockStatus('in_stock');
    setLowStockThresholdInput('5');
    setIsFeatured(false);
    setIsActive(true);
    setSelectedBadges(['Best Seller', 'New Arrival']);
    setVariantsList([
      { size: '50ml', price: 1250 },
      { size: '100ml', price: 2150 }
    ]);
    setNewVariantSize('');
    setNewVariantPrice('');
    setPrimaryImage('https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800');
    setGalleryImages([]);
    setNewImageUrlInput('');
    setVideoUrl('');
    setVideoPoster('');
    setFeaturesText('100% Authentic Guaranteed, Long Lasting 12+ Hours, Cash on Delivery Nationwide');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title || product.name || '');
    setSubtitle(product.subtitle || '');
    setCategory(product.category || DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setSubCategory(product.subCategory || '');
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setRegularPrice(
      product.regularPrice
        ? product.regularPrice.toString()
        : product.originalPrice
        ? product.originalPrice.toString()
        : ''
    );
    setSku(product.sku || product.id);
    setStockQuantityInput(getProductStock(product).toString());
    setStockStatus(
      product.stockStatus === 'pre_order'
        ? 'pre_order'
        : getProductStock(product) === 0
        ? 'out_of_stock'
        : 'in_stock'
    );
    setLowStockThresholdInput((product.lowStockThreshold || 5).toString());
    setIsFeatured(Boolean(product.isFeatured));
    setIsActive(product.isActive !== false && product.inStock !== false);
    setSelectedBadges(
      product.tags && product.tags.length > 0
        ? product.tags
        : product.tag
        ? [product.tag]
        : ['Best Seller']
    );
    setVariantsList(
      product.variants && product.variants.length > 0
        ? product.variants
        : (product.sizes || []).map((s) => ({ size: s, price: product.price }))
    );
    setNewVariantSize('');
    setNewVariantPrice('');
    setPrimaryImage(product.image || '');
    setGalleryImages(product.images ? product.images.filter((img) => img !== product.image) : []);
    setNewImageUrlInput('');
    setVideoUrl(product.videoUrl || '');
    setVideoPoster(product.videoPoster || '');
    setFeaturesText(product.features ? product.features.join(', ') : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Add Variant / Size
  const handleAddVariant = () => {
    if (!newVariantSize.trim()) return;
    const vPrice = parseFloat(newVariantPrice) || parseFloat(price) || 0;
    setVariantsList((prev) => [...prev, { size: newVariantSize.trim(), price: vPrice }]);
    setNewVariantSize('');
    setNewVariantPrice('');
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Image Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB limit. Please compress or provide an image URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isPrimary) {
        setPrimaryImage(dataUrl);
      } else {
        setGalleryImages((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Image from URL
  const handleAddGalleryImageUrl = () => {
    if (!newImageUrlInput.trim()) return;
    const url = newImageUrlInput.trim();
    if (!galleryImages.includes(url) && url !== primaryImage) {
      setGalleryImages((prev) => [...prev, url]);
    }
    setNewImageUrlInput('');
  };

  // Remove Gallery Image
  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle Badge / Tag
  const handleToggleBadge = (b: string) => {
    setSelectedBadges((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  // Save Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedPrice = parseFloat(price);
    if (!title.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Please provide a valid selling price (greater than 0).');
      return;
    }
    if (!primaryImage.trim()) {
      setFormError('Primary product image is required.');
      return;
    }

    const resolvedCategory = category === 'CUSTOM' ? (customCategory.trim() || 'General') : category;
    const parsedRegular = regularPrice ? parseFloat(regularPrice) : undefined;
    const parsedStock = Math.max(0, parseInt(stockQuantityInput) || 0);
    const parsedLowStock = Math.max(1, parseInt(lowStockThresholdInput) || 5);

    const computedDiscount =
      parsedRegular && parsedRegular > parsedPrice
        ? `-${Math.round(((parsedRegular - parsedPrice) / parsedRegular) * 100)}%`
        : undefined;

    const allImages = [primaryImage.trim(), ...galleryImages.filter((img) => img !== primaryImage.trim())];

    const featuresArray = featuresText
      .split(/,|\n/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const sizesArray = variantsList.map((v) => v.size);

    const productPayload: Omit<Product, 'id'> = {
      title: title.trim(),
      name: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category: resolvedCategory,
      subCategory: subCategory.trim() || undefined,
      description: description.trim() || 'Authentic quality product from ZeropicBD marketplace.',
      price: parsedPrice,
      regularPrice: parsedRegular,
      originalPrice: parsedRegular,
      discount: computedDiscount,
      rating: editingProduct?.rating ?? 5.0,
      reviewsCount: editingProduct?.reviewsCount ?? 12,
      image: primaryImage.trim(),
      images: allImages,
      videoUrl: videoUrl.trim() || undefined,
      videoPoster: videoPoster.trim() || undefined,
      sku: sku.trim() || `ZPBD-${Math.floor(1000 + Math.random() * 9000)}`,
      tag: selectedBadges[0] || 'Best Seller',
      tags: selectedBadges,
      badge: selectedBadges[0] || 'Best Seller',
      isFeatured: isFeatured,
      isActive: isActive,
      inStock: stockStatus !== 'out_of_stock' && (stockStatus === 'pre_order' || parsedStock > 0),
      stockStatus: parsedStock === 0 ? 'out_of_stock' : stockStatus,
      stockQuantity: parsedStock,
      lowStockThreshold: parsedLowStock,
      features: featuresArray.length > 0 ? featuresArray : ['100% Authentic Quality', 'Cash on Delivery Nationwide'],
      sizes: sizesArray,
      variants: variantsList,
      storeName: editingProduct?.storeName || 'ZeropicBD Official',
      sellerName: editingProduct?.sellerName || 'ZeropicBD Official',
    };

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productPayload,
        id: editingProduct.id,
      });
      showToast(`✓ Product "${title.trim()}" updated successfully in Firestore!`);
    } else {
      onAddProduct(productPayload);
      showToast(`✓ New product "${title.trim()}" created successfully in Firestore!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* ================= 1. HEADER & KPI STATS ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF] animate-pulse" />
              <h3 className="text-xl font-black text-[#0A1B3D]">
                Product & Inventory Management Directory
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#007BFF] border border-blue-200">
                {products.length} Products in Firestore
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add new products, configure variants & pricing, upload images/YouTube demos, and track stock levels directly in Firestore.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#007BFF] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Structured Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#007BFF] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {dummyProductIds.length > 0 && (
              <button
                type="button"
                onClick={() => setDummyPurgeModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Remove demo dummy products in one click"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete {dummyProductIds.length} Demo Items</span>
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm animate-bounce [animation-duration:3s]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, SKU, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">All Categories ({products.length})</option>
              {allCategories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (Available)</option>
              <option value="low_stock">Low Stock (Under 5 units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
              <option value="pre_order">Pre-Order Only</option>
            </select>
          </div>

          {/* Featured Toggle */}
          <button
            type="button"
            onClick={() => setFeaturedOnlyFilter(!featuredOnlyFilter)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              featuredOnlyFilter
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${featuredOnlyFilter ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span>Featured on Home ({products.filter((p) => p.isFeatured).length})</span>
          </button>
        </div>
      </div>

      {/* ================= 2. BULK SELECTION ACTION STRIP ================= */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F3F7FF] rounded-2xl border border-blue-100 text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-slate-700 font-bold hover:text-[#007BFF] cursor-pointer"
            >
              {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#007BFF]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Visible ({filteredProducts.length})</span>
            </button>

            {selectedIds.size > 0 && (
              <span className="font-semibold text-[#007BFF]">
                {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium underline cursor-pointer"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. PRODUCTS LISTING (TABLE VIEW OR GRID VIEW) ================= */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <Box className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Products Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No products match your current search and filters. Try resetting filters or add a new product.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedStockFilter('all');
                setFeaturedOnlyFilter(false);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-1.5 rounded-xl bg-[#007BFF] text-white text-xs font-bold hover:bg-[#0056B3] cursor-pointer"
            >
              Add New Product
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ================= STRUCTURED DATA TABLE ================= */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-[#007BFF]"
                    >
                      {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#007BFF]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Product</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Regular Price</th>
                  <th className="py-3.5 px-3">Sale Price</th>
                  <th className="py-3.5 px-3">Stock Quantity</th>
                  <th className="py-3.5 px-3">Stock Status</th>
                  <th className="py-3.5 px-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  const stock = getProductStock(product);
                  const status = getProductStockStatus(product);
                  const isActiveState = product.isActive !== false && product.inStock !== false;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(product.id)}
                          className="cursor-pointer text-slate-400 hover:text-[#007BFF]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#007BFF]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800';
                              }}
                            />
                            {product.videoUrl && (
                              <div className="absolute bottom-0.5 right-0.5 p-0.5 bg-black/70 rounded-full text-cyan-400">
                                <Play className="w-2 h-2 fill-cyan-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-[#0A1B3D] text-xs truncate" title={product.title}>
                                {product.title}
                              </h4>
                              {product.isFeatured && (
                                <span title="Featured on Homepage">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              SKU: {product.sku || product.id}
                              {product.subtitle && ` • ${product.subtitle}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] inline-block">
                          {product.category}
                        </span>
                        {product.subCategory && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {product.subCategory}
                          </span>
                        )}
                      </td>

                      {/* Regular Price */}
                      <td className="py-3 px-3">
                        {product.regularPrice || product.originalPrice ? (
                          <span className="font-mono text-slate-400 line-through text-xs">
                            ৳{(product.regularPrice || product.originalPrice || 0).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-[#007BFF]">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {product.discount && (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                              {product.discount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Quantity Stepper */}
                      <td className="py-3 px-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden w-fit shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleInlineStockDelta(product, -1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 cursor-pointer"
                            title="Decrease stock by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-mono text-xs font-black text-[#0A1B3D]">
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleInlineStockDelta(product, 1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-200 cursor-pointer"
                            title="Increase stock by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-3">
                        {status === 'out_of_stock' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                            <PackageX className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : status === 'low_stock' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Low Stock ({stock} left)</span>
                          </span>
                        ) : status === 'pre_order' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            <span>Pre-Order</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <PackageCheck className="w-3 h-3" />
                            <span>In Stock ({stock})</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Active / In Stock */}
                          <button
                            type="button"
                            onClick={() => handleInlineToggleActive(product)}
                            className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isActiveState
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={isActiveState ? 'Product Active (Click to disable)' : 'Product Inactive (Click to enable)'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-xl text-slate-600 hover:text-[#007BFF] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(product.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= GRID CARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const stock = getProductStock(product);
            const status = getProductStockStatus(product);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-[#007BFF] ring-2 ring-blue-100 bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Strip with Checkbox, Category, Badges */}
                <div className="p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectOne(product.id)}
                      className="cursor-pointer shrink-0 text-slate-400 hover:text-[#007BFF]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#007BFF]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span className="text-[11px] font-bold text-[#007BFF] truncate max-w-[130px]">
                      {product.category}
                    </span>
                    {product.subCategory && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        • {product.subCategory}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleInlineToggleFeatured(product)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        product.isFeatured
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                      }`}
                      title={product.isFeatured ? 'Featured on Home Page' : 'Mark as Featured on Home'}
                    >
                      <Star className={`w-3.5 h-3.5 ${product.isFeatured ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Card Middle: Image + Details */}
                <div className="p-3.5 flex gap-3.5 flex-1">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                    {product.videoUrl && (
                      <div className="absolute bottom-1 right-1 p-1 bg-black/70 rounded-full text-cyan-400">
                        <Play className="w-2.5 h-2.5 fill-cyan-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0A1B3D] line-clamp-1" title={product.title}>
                        {product.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        SKU: {product.sku || product.id}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-black font-mono text-[#007BFF]">
                        ৳{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[11px] font-mono text-slate-400 line-through">
                          ৳{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {product.discount && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                          {product.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Lower Strip: Stock Status & Quantity Controls */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={status}
                      onChange={(e) => handleInlineToggleStatus(product, e.target.value as any)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none ${
                        status === 'in_stock'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : status === 'low_stock'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : status === 'pre_order'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <option value="in_stock">In Stock ({stock})</option>
                      <option value="low_stock">Low Stock ({stock})</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre-Order</option>
                    </select>

                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleInlineStockDelta(product, -1)}
                        className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title="Decrease stock by 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold text-slate-700">
                        {stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInlineStockDelta(product, 1)}
                        className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title="Increase stock by 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-[#007BFF] hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 4. ADD / EDIT PRODUCT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#007BFF] flex items-center justify-center">
                  {editingProduct ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0A1B3D]">
                    {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Marketplace Product'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Product specifications, pricing, variants, stock management & media gallery in Firestore.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-[#0A1B3D] uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#007BFF]" />
                  <span>1. Basic Product Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Product Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Luxury Velvet Oud Perfume (100ml)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF] transition-all"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Product Subtitle / Tagline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pure Artisanal French EDP Blend"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF] transition-all"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:outline-none focus:border-[#007BFF] cursor-pointer"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Add Custom Category</option>
                    </select>
                  </div>

                  {/* Sub-Category or Custom Category */}
                  <div>
                    {category === 'CUSTOM' ? (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Enter Custom Category Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Leather Crafts"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Sub-Category (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. French EDP / Unisex"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Short Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Short Description & Highlights
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter engaging product overview, notes, and key selling propositions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Features (Bullet Points) */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Product Features & Specifications (Comma-separated or line breaks)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 100% Original French Extract, Long Lasting 12h, Safe on Skin, Batch Code Verified"
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Pricing & Stock */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-[#0A1B3D] uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#007BFF]" />
                  <span>2. Pricing & Stock Inventory</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Regular Price */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Regular Price (MSRP / ৳ BDT)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Sale / Selling Price (৳ BDT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1850"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Stock Quantity (Units) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 25"
                      value={stockQuantityInput}
                      onChange={(e) => setStockQuantityInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Stock Status */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Stock Status Flag
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold focus:outline-none focus:border-[#007BFF] cursor-pointer"
                    >
                      <option value="in_stock">In Stock (Available)</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre-Order</option>
                    </select>
                  </div>

                  {/* Low Stock Threshold */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Default: 5"
                      value={lowStockThresholdInput}
                      onChange={(e) => setLowStockThresholdInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      SKU / Barcode Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZPBD-9821"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Variants & Sizes */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-[#0A1B3D] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#007BFF]" />
                  <span>3. Product Sizes & Volume Variants</span>
                </h4>

                <div className="space-y-2">
                  {variantsList.map((variant, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{variant.size}</span>
                        <span className="font-mono text-slate-500 font-bold">
                          ৳{variant.price.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove Variant"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Variant Form */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Size/Variant (e.g. 50ml, 100ml)"
                      value={newVariantSize}
                      onChange={(e) => setNewVariantSize(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#007BFF]"
                    />
                    <input
                      type="number"
                      placeholder="Price (৳)"
                      value={newVariantPrice}
                      onChange={(e) => setNewVariantPrice(e.target.value)}
                      className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-[#007BFF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Add Size
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Media & Gallery & YouTube Video Demo */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-[#0A1B3D] uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#007BFF]" />
                  <span>4. Media & Video Assets</span>
                </h4>

                {/* Primary Image */}
                <div className="space-y-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Primary Product Image URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={primaryImage}
                      onChange={(e) => setPrimaryImage(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <label className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {primaryImage && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                      <img
                        src={primaryImage}
                        alt="Primary Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div className="space-y-2 pt-2">
                  <label className="block text-slate-700 font-bold mb-1">
                    Additional Gallery Images
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter additional image URL..."
                      value={newImageUrlInput}
                      onChange={(e) => setNewImageUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryImageUrl}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Add Image
                    </button>
                  </div>

                  {galleryImages.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${idx}`}
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1 right-1 p-0.5 rounded-md bg-rose-600 text-white opacity-90 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* YouTube Video Demo URL */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-600" />
                    <span>YouTube Product Showcase Video URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.youtube.com/watch?v=sU3FkmV9b70"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                  {videoUrl && (
                    <p className="text-[11px] text-slate-400">
                      Customers will be able to play authentic video reviews and unboxings directly in the product detail view.
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Badge Flags & Promotion */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-[#0A1B3D] uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#007BFF]" />
                  <span>5. Badge Flags & Visibility</span>
                </h4>

                <div className="flex flex-wrap gap-2">
                  {PRESET_BADGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleToggleBadge(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedBadges.includes(b)
                          ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#007BFF] focus:ring-[#007BFF] border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Feature on Homepage Showcase (Hero / Flash Sale)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#007BFF] focus:ring-[#007BFF] border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Publish & Enable for Customer Purchase
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer CTA */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Update Product in Firestore' : 'Create Product in Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#0A1B3D]">Delete Product?</h4>
              <p className="text-xs text-slate-500">
                This will permanently delete the product from the Firestore catalog and storefront.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('✓ Product deleted from Firestore catalog.');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. BULK DELETE MODAL ================= */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#0A1B3D]">
                Delete {selectedIds.size} Selected Products?
              </h4>
              <p className="text-xs text-slate-500">
                This action cannot be undone. Selected items will be removed from Firestore.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. DUMMY PURGE MODAL ================= */}
      {dummyPurgeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-[#0A1B3D]">
                Purge {dummyProductIds.length} Demo Products?
              </h4>
              <p className="text-xs text-slate-500">
                Clear all template demo products so you only have authentic custom items in your store.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDummyPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurgeDummy}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Purge Demo Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
