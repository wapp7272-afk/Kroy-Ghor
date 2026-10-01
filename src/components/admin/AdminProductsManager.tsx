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
  Clock
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
}

const DEFAULT_CATEGORIES = [
  'Glow Lights',
  'Attar Perfumes',
  'Perfume',
  'Notebooks',
  'Bricks Toys',
  'Accessories',
  'Watches',
  'Fashion Accessories',
  'Home Decor',
  'Electronics & Gadgets'
];

const PRESET_TAGS = [
  'Trending',
  'Best Seller',
  'Hot Deal',
  'New Arrival',
  'Featured',
  'Limited Edition',
  'Flash Sale',
  'Verified Official'
];

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onResetDemoProducts,
}) => {
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'pre_order'>('all');
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
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); // Discounted / Selling price
  const [regularPrice, setRegularPrice] = useState(''); // MSRP / Regular price
  const [sku, setSku] = useState('');
  const [stockQuantityInput, setStockQuantityInput] = useState('25');
  const [stockStatus, setStockStatus] = useState<'in_stock' | 'out_of_stock' | 'pre_order'>('in_stock');
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState('5');
  const [isFeatured, setIsFeatured] = useState(false);
  
  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(['Trending']);
  const [customTagInput, setCustomTagInput] = useState('');

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

  // Identify dummy products (demo items seeded originally)
  const dummyProductIds = useMemo(() => {
    return products
      .filter((p) => {
        const id = p.id.toLowerCase();
        return (
          id.startsWith('p') && !isNaN(Number(id.slice(1))) ||
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

  // Helper to determine stock status
  const getProductStockStatus = (product: Product): 'in_stock' | 'out_of_stock' | 'pre_order' => {
    if (product.stockStatus) return product.stockStatus;
    if (product.inStock === false || getProductStock(product) <= 0) return 'out_of_stock';
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
        if (status !== selectedStockFilter) return false;
      }

      // Featured filter
      if (featuredOnlyFilter && !p.isFeatured) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesCategory = (p.category || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || p.id).toLowerCase().includes(q);
        const matchesTag = p.tag?.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
        return matchesTitle || matchesDesc || matchesCategory || matchesSku || matchesTag;
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
    // Remove purged from selection
    const next = new Set(selectedIds);
    dummyProductIds.forEach((id) => next.delete(id));
    setSelectedIds(next);
    setDummyPurgeModalOpen(false);
  };

  // Quick Inline Adjustments
  const handleInlineStockDelta = (product: Product, delta: number) => {
    const current = getProductStock(product);
    const updated = Math.max(0, current + delta);
    onUpdateProduct({
      ...product,
      stockQuantity: updated,
      inStock: updated > 0,
      stockStatus: updated > 0 ? (product.stockStatus === 'pre_order' ? 'pre_order' : 'in_stock') : 'out_of_stock'
    });
  };

  const handleInlineToggleStatus = (product: Product, nextStatus: 'in_stock' | 'out_of_stock' | 'pre_order') => {
    onUpdateProduct({
      ...product,
      stockStatus: nextStatus,
      inStock: nextStatus !== 'out_of_stock',
      stockQuantity: nextStatus === 'out_of_stock' ? 0 : (product.stockQuantity || 10)
    });
  };

  const handleInlineToggleFeatured = (product: Product) => {
    onUpdateProduct({
      ...product,
      isFeatured: !product.isFeatured,
      tag: !product.isFeatured ? 'Featured' : (product.tag === 'Featured' ? 'Trending' : product.tag)
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setSubCategory('');
    setDescription('');
    setPrice('');
    setRegularPrice('');
    setSku(`ZPBD-${Math.floor(1000 + Math.random() * 9000)}`);
    setStockQuantityInput('30');
    setStockStatus('in_stock');
    setLowStockThresholdInput('5');
    setIsFeatured(false);
    setSelectedTags(['Trending', 'Verified Official']);
    setCustomTagInput('');
    setPrimaryImage('https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800');
    setGalleryImages([
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800'
    ]);
    setNewImageUrlInput('');
    setVideoUrl('');
    setVideoPoster('');
    setFeaturesText('Premium Verified Quality, Nationwide Delivery, 7-Day Guarantee');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setCategory(product.category || DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setSubCategory(product.subCategory || '');
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setRegularPrice(product.regularPrice ? product.regularPrice.toString() : (product.originalPrice ? product.originalPrice.toString() : ''));
    setSku(product.sku || product.id);
    setStockQuantityInput(getProductStock(product).toString());
    setStockStatus(getProductStockStatus(product));
    setLowStockThresholdInput((product.lowStockThreshold || 5).toString());
    setIsFeatured(Boolean(product.isFeatured));
    setSelectedTags(
      product.tags && product.tags.length > 0 
        ? product.tags 
        : (product.tag ? [product.tag] : ['Trending'])
    );
    setCustomTagInput('');
    setPrimaryImage(product.image || '');
    setGalleryImages(product.images ? product.images.filter((img) => img !== product.image) : []);
    setNewImageUrlInput('');
    setVideoUrl(product.videoUrl || '');
    setVideoPoster(product.videoPoster || '');
    setFeaturesText(product.features ? product.features.join(', ') : '');
    setFormError(null);
    setIsModalOpen(true);
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

  // Toggle Tag
  const handleToggleTag = (t: string) => {
    setSelectedTags((prev) => 
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  // Add Custom Tag
  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const tagClean = customTagInput.trim();
    if (!selectedTags.includes(tagClean)) {
      setSelectedTags((prev) => [...prev, tagClean]);
    }
    setCustomTagInput('');
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
      setFormError('Please provide a valid price (greater than 0).');
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

    const productPayload = {
      title: title.trim(),
      name: title.trim(),
      category: resolvedCategory,
      subCategory: subCategory.trim() || undefined,
      description: description.trim() || 'Verified quality product from ZeropicBD marketplace.',
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
      tag: selectedTags[0] || 'Trending',
      tags: selectedTags,
      isFeatured: isFeatured,
      inStock: stockStatus !== 'out_of_stock' && (stockStatus === 'pre_order' || parsedStock > 0),
      stockStatus: stockStatus,
      stockQuantity: parsedStock,
      lowStockThreshold: parsedLowStock,
      features: featuresArray.length > 0 ? featuresArray : ['100% Authentic Quality', 'Cash on Delivery Nationwide'],
      storeName: editingProduct?.storeName || 'ZeropicBD Official',
      sellerName: editingProduct?.sellerName || 'ZeropicBD Official',
    };

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productPayload,
      });
    } else {
      onAddProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* ================= 1. HEADER & KPI STATS (Light ZeropicBD Theme) ================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007BFF] animate-pulse" />
              <h3 className="text-xl font-black text-[#0A1B3D]">
                Product Catalog & Inventory Management
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#007BFF] border border-blue-200">
                {products.length} Products
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add new products, upload images/videos, manage stock levels, and organize homepage featured items.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {dummyProductIds.length > 0 && (
              <button
                type="button"
                onClick={() => setDummyPurgeModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Remove demo dummy products in one click"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete {dummyProductIds.length} Demo Products</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
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
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="pre_order">Pre-Order</option>
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
        <div className="flex items-center justify-between px-3 py-2 bg-[#F3F7FF] rounded-xl border border-blue-100 text-xs">
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
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. PRODUCTS LISTING GRID / CARDS ================= */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3 shadow-xs">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const stock = getProductStock(product);
            const status = getProductStockStatus(product);
            const isDummy = dummyProductIds.includes(product.id);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
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
                    {/* Featured Star Toggle */}
                    <button
                      type="button"
                      onClick={() => handleInlineToggleFeatured(product)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        product.isFeatured
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                      }`}
                      title={product.isFeatured ? 'Featured on Home Page (Click to unfeature)' : 'Mark as Featured on Home'}
                    >
                      <Star className={`w-3.5 h-3.5 ${product.isFeatured ? 'fill-amber-400' : ''}`} />
                    </button>

                    {isDummy && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Middle: Image + Details */}
                <div className="p-3.5 flex gap-3.5 flex-1">
                  {/* Thumbnail with Video Indicator */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
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
                    {product.images && product.images.length > 1 && (
                      <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[9px] font-bold">
                        +{product.images.length}
                      </div>
                    )}
                  </div>

                  {/* Title & Pricing */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#0A1B3D] line-clamp-1 hover:text-[#007BFF] transition-colors" title={product.title}>
                        {product.title}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        SKU: {product.sku || product.id}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black font-mono text-[#007BFF]">
                        ৳{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs font-mono text-slate-400 line-through">
                          ৳{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                      {product.discount && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                          {product.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Lower Strip: Stock Status & Quantity Controls */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {/* Stock Status Selector */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={status}
                      onChange={(e) => handleInlineToggleStatus(product, e.target.value as any)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none ${
                        status === 'in_stock'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : status === 'pre_order'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="pre_order">Pre-Order</option>
                    </select>

                    {/* Stock Counter Stepper */}
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

                  {/* Actions (Edit / Delete) */}
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
                    Full product specifications, pricing, stock control, and rich media assets.
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

              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Basic Product Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Product Title *
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

                  {/* Category */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Category *
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

                  {/* Sub-Category or Custom Category Input */}
                  <div>
                    {category === 'CUSTOM' ? (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Enter Custom Category Name *
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
                          placeholder="e.g. Eau De Parfum / LED Desk Lamp / Building Set"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                        />
                      </div>
                    )}
                  </div>

                  {/* SKU / Code */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      SKU / Product Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ZPBD-9821"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Featured on Home Page Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">Featured on Home Page</span>
                      <span className="text-[10px] text-slate-500">Showcases in the prominent Home grid</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isFeatured ? 'bg-[#007BFF]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                          isFeatured ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the product quality, dimensions, materials, benefits..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                  />
                </div>
              </div>

              {/* Pricing & Stock Management */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  2. Pricing & Stock Inventory
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Selling Price */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Sale Price (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 1450"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Regular Price (MSRP) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Regular Price / MSRP (৳ BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 1800 (for discount strikethrough)"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Stock Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25"
                      value={stockQuantityInput}
                      onChange={(e) => setStockQuantityInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Stock Status Selector */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Stock Status *
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#007BFF]"
                    >
                      <option value="in_stock">In Stock (Available immediately)</option>
                      <option value="out_of_stock">Out of Stock (Mark as unavailable)</option>
                      <option value="pre_order">Pre-Order (Book in advance)</option>
                    </select>
                  </div>

                  {/* Low Stock Warning Threshold */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={lowStockThresholdInput}
                      onChange={(e) => setLowStockThresholdInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>

                  {/* Features / Highlights */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Key Highlights (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Original, Waterproof, Gift Pack"
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>

                {/* Product Tags */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Product Tags (Select or add custom)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {PRESET_TAGS.map((t) => {
                      const isSelected = selectedTags.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleToggleTag(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#007BFF] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Add another tag..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Media Management (Multiple Images & Video) */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  3. Product Images & Video Assets
                </h4>

                {/* Primary Thumbnail Image */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Primary Thumbnail Image URL *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={primaryImage}
                      onChange={(e) => setPrimaryImage(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <label className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#007BFF]" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {primaryImage && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                        <img src={primaryImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-slate-500">
                        ✓ Primary catalog thumbnail loaded
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Gallery Images */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Additional Gallery Images (Multi-Image Support)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Enter extra gallery image URL..."
                      value={newImageUrlInput}
                      onChange={(e) => setNewImageUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryImageUrl}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer shrink-0"
                    >
                      + Add URL
                    </button>
                    <label className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Gallery Thumbnails List */}
                  {galleryImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {galleryImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group w-18 h-18 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                        >
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs"
                            title="Remove this image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Video (YouTube embed or MP4 direct link) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Product Video URL (YouTube or Direct MP4 link)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=M7lc1UVf-VE"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports YouTube embed URLs or direct MP4/WebM video links.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Video Poster / Cover Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={videoPoster}
                      onChange={(e) => setVideoPoster(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>

                {/* Video Preview if present */}
                {videoUrl && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 block mb-2">
                      Video Live Preview:
                    </span>
                    {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                      <div className="aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={getYouTubeEmbedUrl(videoUrl)}
                          title="Preview"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : (
                      <video
                        src={videoUrl}
                        controls
                        className="aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-black"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95"
                >
                  {editingProduct ? 'Save Product Changes' : 'Publish Product to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. SINGLE DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#0A1B3D]">
                Delete Product Permanently?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this product? It will be removed permanently from the marketplace catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. BULK DELETE MODAL ================= */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#0A1B3D]">
                Bulk Delete {selectedIds.size} Selected Products?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                This action will permanently delete all {selectedIds.size} selected products from the database and store catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete {selectedIds.size} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. DUMMY PRODUCTS PURGE MODAL ================= */}
      {dummyPurgeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#0A1B3D]">
                Purge All Demo Dummy Products?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Found <strong>{dummyProductIds.length}</strong> dummy/demo products in the database. Deleting them will clean the marketplace so only your authentic real products remain.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDummyPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurgeDummy}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Purge All {dummyProductIds.length} Demo Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
