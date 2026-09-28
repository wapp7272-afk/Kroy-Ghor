import React, { useState } from 'react';
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
  ToggleLeft,
  ToggleRight,
  Eye,
  Video,
  Layers,
  Flame,
  Film,
  Star,
  CheckCircle2,
  Play,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { Product } from '../../types';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

interface AdminProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const CATEGORIES = [
  'Glow Lights',
  'Attar Perfumes',
  'Notebooks',
  'Bricks Toys',
  'Accessories'
];

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [galleryImagesText, setGalleryImagesText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPoster, setVideoPoster] = useState('');
  const [sampleVideoUrl, setSampleVideoUrl] = useState('');
  const [aiShowcaseVideoUrl, setAiShowcaseVideoUrl] = useState('');
  const [fragranceTop, setFragranceTop] = useState('');
  const [fragranceHeart, setFragranceHeart] = useState('');
  const [fragranceBase, setFragranceBase] = useState('');
  const [tag, setTag] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [stockQuantityInput, setStockQuantityInput] = useState('20');
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState('5');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to get stock quantity with safe fallback
  const getProductStock = (product: Product): number => {
    if (product.stockQuantity !== undefined) return product.stockQuantity;
    if (product.inStock === false) return 0;
    if (product.id === 'p3') return 3;
    if (product.id === 'p5') return 2;
    if (product.id === 'glow-3' || product.id === 'tech-2') return 4;
    const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 12 + (hash % 18);
  };

  // Adjust stock quantity
  const handleAdjustProductStock = (product: Product, delta: number) => {
    const current = getProductStock(product);
    const updated = Math.max(0, current + delta);
    onUpdateProduct({
      ...product,
      stockQuantity: updated,
      inStock: updated > 0,
    });
  };

  // Open Add modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setCategory(CATEGORIES[0]);
    setInStock(true);
    setStockQuantityInput('20');
    setLowStockThresholdInput('5');
    setImageUrl('https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800');
    setGalleryImagesText('https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800\nhttps://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=800');
    setVideoUrl('');
    setVideoPoster('');
    setSampleVideoUrl('');
    setAiShowcaseVideoUrl('');
    setFragranceTop('Sea Water, Mint, Green Notes, Lavender');
    setFragranceHeart('Sandalwood, Jasmine, Neroli, Geranium');
    setFragranceBase('Musk, Oakmoss, Cedar, Tobacco, Amber');
    setTag('Trending');
    setIsFeatured(false);
    setFeaturesText('Premium Luxury Quality, 100% Authentic, Long Lasting');
    setImagePreviewError(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setCategory(product.category || CATEGORIES[0]);
    setInStock(product.inStock ?? true);
    setStockQuantityInput(getProductStock(product).toString());
    setLowStockThresholdInput((product.lowStockThreshold || 5).toString());
    setImageUrl(product.image);
    setGalleryImagesText(
      product.images && product.images.length > 0
        ? product.images.filter((img) => img !== product.image).join('\n')
        : ''
    );
    setVideoUrl(product.videoUrl || '');
    setVideoPoster(product.videoPoster || '');
    setSampleVideoUrl(product.sampleVideoUrl || '');
    setAiShowcaseVideoUrl(product.aiShowcaseVideoUrl || '');
    setFragranceTop(product.fragranceNotes?.top || '');
    setFragranceHeart(product.fragranceNotes?.heart || '');
    setFragranceBase(product.fragranceNotes?.base || '');
    setTag(product.tag || '');
    setIsFeatured(product.isFeatured ?? (product.tag === 'Featured' || product.tag === 'Hot Deal'));
    setFeaturesText(product.features ? product.features.join(', ') : '');
    setImagePreviewError(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle local image file upload converting to DataURL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFormError('Image file is larger than 3MB. Please select a smaller image or use an image URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setImagePreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle local sample video file upload
  const handleSampleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setFormError('Video file exceeds 25MB limit. Please provide a YouTube link or hosted video URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSampleVideoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle local AI showcase video file upload
  const handleAiVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setFormError('Video file exceeds 25MB limit. Please provide a YouTube link or hosted video URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAiShowcaseVideoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save product (Add or Edit)
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
    if (!imageUrl.trim()) {
      setFormError('Please enter an image URL or upload an image file.');
      return;
    }

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    const featuresArray = featuresText
      .split(/,|\n/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const galleryLines = galleryImagesText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const finalImages = [imageUrl.trim(), ...galleryLines.filter((url) => url !== imageUrl.trim())];

    const fragranceNotes =
      fragranceTop.trim() || fragranceHeart.trim() || fragranceBase.trim()
        ? {
            top: fragranceTop.trim(),
            heart: fragranceHeart.trim(),
            base: fragranceBase.trim(),
          }
        : undefined;

    const computedDiscount =
      parsedOriginalPrice && parsedOriginalPrice > parsedPrice
        ? `-${Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100)}%`
        : undefined;

    const parsedStock = Math.max(0, parseInt(stockQuantityInput) || 0);
    const parsedThreshold = Math.max(1, parseInt(lowStockThresholdInput) || 5);
    const finalInStock = parsedStock > 0 && inStock;

    if (editingProduct) {
      // Update
      const updated: Product = {
        ...editingProduct,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        discount: computedDiscount,
        category,
        inStock: finalInStock,
        stockQuantity: parsedStock,
        lowStockThreshold: parsedThreshold,
        image: imageUrl.trim(),
        images: finalImages,
        videoUrl: videoUrl.trim() || undefined,
        videoPoster: videoPoster.trim() || undefined,
        sampleVideoUrl: sampleVideoUrl.trim() || undefined,
        aiShowcaseVideoUrl: aiShowcaseVideoUrl.trim() || undefined,
        fragranceNotes,
        tag: tag.trim() || undefined,
        isFeatured,
        features: featuresArray.length > 0 ? featuresArray : ['High quality material', 'Original product'],
      };
      onUpdateProduct(updated);
    } else {
      // Add
      onAddProduct({
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        discount: computedDiscount,
        category,
        rating: 4.9,
        reviewsCount: 1,
        inStock: finalInStock,
        stockQuantity: parsedStock,
        lowStockThreshold: parsedThreshold,
        image: imageUrl.trim(),
        images: finalImages,
        videoUrl: videoUrl.trim() || undefined,
        videoPoster: videoPoster.trim() || undefined,
        sampleVideoUrl: sampleVideoUrl.trim() || undefined,
        aiShowcaseVideoUrl: aiShowcaseVideoUrl.trim() || undefined,
        fragranceNotes,
        tag: tag.trim() || undefined,
        isFeatured,
        features: featuresArray.length > 0 ? featuresArray : ['High quality material', 'Original product'],
      });
    }

    setIsModalOpen(false);
  };

  // Toggle Featured status quickly
  const handleToggleFeatured = (product: Product) => {
    onUpdateProduct({
      ...product,
      isFeatured: !product.isFeatured,
    });
  };

  // Toggle stock quickly
  const handleQuickToggleStock = (product: Product) => {
    onUpdateProduct({
      ...product,
      inStock: !product.inStock,
    });
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Action and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/5">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="admin-search-products-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, category..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Category Filter */}
          <select
            id="admin-category-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="All">All Categories ({products.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <button
          id="admin-add-product-btn"
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Stats Pill */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing <strong>{filteredProducts.length}</strong> of {products.length} products</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            In Stock: {products.filter((p) => p.inStock).length}
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Out of Stock: {products.filter((p) => !p.inStock).length}
          </span>
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs text-slate-500 mt-1">Try changing your search keywords or click "Add New Product".</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex gap-3 items-start justify-between group"
            >
              {/* Product Thumbnail */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-white/5">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter text-center px-1">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {product.category}
                  </span>
                  {product.tag && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-950/60 text-pink-300 border border-pink-500/30">
                      {product.tag}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 font-mono">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                  {product.sampleVideoUrl && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" />
                      <span>Sample Video</span>
                    </span>
                  )}
                  {(product.aiShowcaseVideoUrl || product.videoUrl) && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Film className="w-2.5 h-2.5" />
                      <span>AI Showcase</span>
                    </span>
                  )}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                  {product.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {product.description}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    ৳{product.price}
                    {product.originalPrice && (
                      <span className="text-[10px] line-through text-slate-500 ml-1 font-normal">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Quick Stock Adjustment Steppers & Live Indicator */}
                  {(() => {
                    const currentStock = getProductStock(product);
                    const isLow = currentStock <= 5 && currentStock > 0;
                    const isOut = currentStock === 0 || !product.inStock;

                    return (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleAdjustProductStock(product, -1)}
                            disabled={currentStock <= 0}
                            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold disabled:opacity-30 cursor-pointer"
                            title="Decrease stock (-1 unit)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`text-[11px] font-mono font-black px-1 ${
                            isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-cyan-300'
                          }`}>
                            {currentStock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustProductStock(product, 1)}
                            className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                            title="Increase stock (+1 unit)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Stock status pill & low-stock warning alert */}
                        {isOut ? (
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStock(product)}
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30 flex items-center gap-1 cursor-pointer hover:bg-rose-900"
                            title="Out of stock - Click to toggle"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Out of Stock</span>
                          </button>
                        ) : isLow ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse" title="Critical low inventory alert">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                            <span>Low Stock ({currentStock} left)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStock(product)}
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-900"
                            title="In stock - Click to toggle"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>In Stock</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Featured toggle switch */}
                  <button
                    onClick={() => handleToggleFeatured(product)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors flex items-center gap-1 ${
                      product.isFeatured
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200'
                    }`}
                    title="Toggle Homepage Featured Spotlight"
                  >
                    <Star className={`w-3 h-3 ${product.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                    <span>{product.isFeatured ? 'Featured' : 'Normal'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col gap-1.5 shrink-0">
                <button
                  id={`edit-product-${product.id}`}
                  onClick={() => handleOpenEditModal(product)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold"
                  title="Edit Product"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit</span>
                </button>

                <button
                  id={`delete-product-${product.id}`}
                  onClick={() => setDeleteConfirmId(product.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 border border-rose-500/30 hover:border-rose-500/60 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Delete Product from store"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Alert Modal */}
      {deleteConfirmId && (() => {
        const prodToDelete = products.find((p) => p.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400 border-b border-rose-500/20 pb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Product from Store</h3>
                  <p className="text-[11px] text-slate-400">Safety Verification Confirmation</p>
                </div>
              </div>

              {prodToDelete && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <img
                    src={prodToDelete.image}
                    alt={prodToDelete.title}
                    className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <h4 className="font-bold text-white truncate">{prodToDelete.title}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">Category: {prodToDelete.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold text-cyan-400">৳{prodToDelete.price}</span>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {prodToDelete.id}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Are you sure you want to permanently delete this product?</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                  This item will immediately be removed from the storefront catalog, active buyer carts, category grids, and live search queries across all devices without needing a hard reload.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  id="admin-cancel-delete-btn"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="admin-confirm-delete-btn"
                  onClick={() => {
                    onDeleteProduct(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Product</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0d1020] rounded-2xl border border-cyan-500/40 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  {editingProduct ? 'Edit Product Details' : 'Add New Product to Store'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Title*</label>
                <input
                  id="product-form-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lumina Crystal Galaxy Lamp"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Category & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category*</label>
                  <select
                    id="product-form-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tag / Badge (Optional)</label>
                  <input
                    id="product-form-tag"
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. Bestseller, New, Trending"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Selling Price (৳)*
                    <span className="text-[10px] font-normal text-slate-400 block">Actual price customer pays</span>
                  </label>
                  <input
                    id="product-form-price"
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 950"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Original Price (৳) (Optional)
                    <span className="text-[10px] font-normal text-slate-400 block">MRP / Regular price before discount</span>
                  </label>
                  <input
                    id="product-form-original-price"
                    type="number"
                    min="1"
                    step="any"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="e.g. 1200"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Dynamic Discount Calculator Preview */}
              {parseFloat(price) > 0 && parseFloat(originalPrice) > parseFloat(price) ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Computed Discount: -{Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% OFF
                  </span>
                  <span className="font-mono text-emerald-200 font-bold">
                    Saves ৳{(parseFloat(originalPrice) - parseFloat(price)).toLocaleString()}
                  </span>
                </div>
              ) : originalPrice && parseFloat(originalPrice) <= parseFloat(price) ? (
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px]">
                  ⚠️ Note: Original Price is ≤ Sale Price. No discount badge will be displayed on this product.
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 px-1">
                  💡 Discounts are strictly computed when Original Price is greater than Sale Price.
                </p>
              )}

              {/* Stock Quantity & Threshold Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Physical Units in Stock*
                    <span className="text-[10px] text-slate-500 font-normal block">Total available warehouse quantity</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantityInput}
                    onChange={(e) => {
                      setStockQuantityInput(e.target.value);
                      if (parseInt(e.target.value) === 0) {
                        setInStock(false);
                      } else if (parseInt(e.target.value) > 0 && !inStock) {
                        setInStock(true);
                      }
                    }}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Low-Stock Alert Threshold
                    <span className="text-[10px] text-slate-500 font-normal block">Triggers low-stock warning alert when ≤ this level</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThresholdInput}
                    onChange={(e) => setLowStockThresholdInput(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Stock Status Selector */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Stock Availability Status*</span>
                  <span className="text-[11px] text-slate-400">
                    {inStock ? 'Item will be displayed as available for purchase' : 'Item will display "Out of Stock" and purchase disabled'}
                  </span>
                </div>
                <button
                  type="button"
                  id="product-form-stock-toggle"
                  onClick={() => setInStock(!inStock)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    inStock
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {inStock ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-rose-400" />}
                  <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                </button>
              </div>

              {/* Homepage Featured Spotlight Selector */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Featured on Homepage Spotlight</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Promote this item in Hero Highlights and Flash Sale showcase
                  </span>
                </div>
                <button
                  type="button"
                  id="product-form-featured-toggle"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                    isFeatured
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isFeatured ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  <span>{isFeatured ? '★ Featured' : 'Standard'}</span>
                </button>
              </div>

              {/* Image URL & File Upload */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Image (URL or Upload)*</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="product-form-image-url"
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreviewError(false);
                      }}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Live Image Preview */}
                  {imageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        onError={() => setImagePreviewError(true)}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-[11px]">
                        <span className="text-slate-300 font-medium block">Live Image Preview</span>
                        <span className="text-slate-500 truncate block">
                          {imagePreviewError ? '⚠️ Image could not be loaded, check URL' : '✓ Image ready to render'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Photos Gallery (Daraz-style) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Daraz-Style Multiple Gallery Photos (One URL per line)</span>
                  </label>
                  <label className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 cursor-pointer hover:underline">
                    <Upload className="w-3 h-3" />
                    <span>Upload Extra Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        Array.from(files).forEach((file) => {
                          if (file.size <= 3 * 1024 * 1024) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              setGalleryImagesText((prev) => (prev ? `${prev}\n${dataUrl}` : dataUrl));
                            };
                            reader.readAsDataURL(file);
                          }
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  id="product-form-gallery-images"
                  rows={2}
                  value={galleryImagesText}
                  onChange={(e) => setGalleryImagesText(e.target.value)}
                  placeholder="https://example.com/photo2.jpg&#10;https://example.com/photo3.jpg"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* Enhanced Media Support: Product Sample Video */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>Product Sample Video (Live Unboxing / Demonstration)</span>
                  </div>
                  <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer flex items-center gap-1 text-[10px] font-bold transition-colors">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>Upload Video File</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleSampleVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <input
                    id="product-form-sample-video-url"
                    type="text"
                    value={sampleVideoUrl}
                    onChange={(e) => setSampleVideoUrl(e.target.value)}
                    placeholder="Enter Sample Video URL (MP4, WebM or YouTube link: https://youtube.com/watch?v=...)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Sample Video Live Preview */}
                {sampleVideoUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden bg-black border border-cyan-500/20 aspect-video relative">
                    {getYouTubeEmbedUrl(sampleVideoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(sampleVideoUrl)}
                        title="Sample Video Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={sampleVideoUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      ✓ Live Sample Video Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Enhanced Media Support: AI Showcase Video */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span>AI Showcase Video (3D CGI Render / AI Cinematic Trailer)</span>
                  </div>
                  <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 cursor-pointer flex items-center gap-1 text-[10px] font-bold transition-colors">
                    <Upload className="w-3 h-3 text-purple-400" />
                    <span>Upload AI Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleAiVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Video Stream / YouTube Link</label>
                    <input
                      id="product-form-video-url"
                      type="text"
                      value={aiShowcaseVideoUrl || videoUrl}
                      onChange={(e) => {
                        setAiShowcaseVideoUrl(e.target.value);
                        setVideoUrl(e.target.value);
                      }}
                      placeholder="https://example.com/ai-video.mp4 or YouTube link"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Video Poster Thumbnail (Optional)</label>
                    <input
                      id="product-form-video-poster"
                      type="url"
                      value={videoPoster}
                      onChange={(e) => setVideoPoster(e.target.value)}
                      placeholder="https://example.com/poster.jpg"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* AI Video Live Preview */}
                {(aiShowcaseVideoUrl || videoUrl) && (
                  <div className="mt-2 rounded-xl overflow-hidden bg-black border border-purple-500/20 aspect-video relative">
                    {getYouTubeEmbedUrl(aiShowcaseVideoUrl || videoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(aiShowcaseVideoUrl || videoUrl)}
                        title="AI Showcase Video Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={aiShowcaseVideoUrl || videoUrl}
                        poster={videoPoster}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      ✓ Live AI Showcase Video Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Fragrance Notes (Top, Heart, Base) */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Flame className="w-4 h-4 text-[#fbbf24]" />
                  <span>Fragrance Olfactory Pyramid (Top, Heart & Base Notes)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Top Notes (0-15m)</label>
                    <input
                      id="product-form-fragrance-top"
                      type="text"
                      value={fragranceTop}
                      onChange={(e) => setFragranceTop(e.target.value)}
                      placeholder="e.g. Sea Water, Mint, Lavender"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-[11px] placeholder-slate-600 focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Heart Notes (2-4h)</label>
                    <input
                      id="product-form-fragrance-heart"
                      type="text"
                      value={fragranceHeart}
                      onChange={(e) => setFragranceHeart(e.target.value)}
                      placeholder="e.g. Sandalwood, Jasmine, Neroli"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-[11px] placeholder-slate-600 focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Base Notes (6-16h)</label>
                    <input
                      id="product-form-fragrance-base"
                      type="text"
                      value={fragranceBase}
                      onChange={(e) => setFragranceBase(e.target.value)}
                      placeholder="e.g. Musk, Cedar, Amber, Tobacco"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-[11px] placeholder-slate-600 focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description*</label>
                <textarea
                  id="product-form-description"
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed aesthetic description of the product..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Features (Comma separated) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Key Features (Comma separated)</label>
                <input
                  id="product-form-features"
                  type="text"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="e.g. Touch Dimmer, USB Rechargeable, 12h Battery"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="save-product-submit-btn"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
