import React, { useState, useMemo } from 'react';
import {
  Store,
  TrendingUp,
  ShieldCheck,
  Truck,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Package,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Search,
  Eye,
  Video,
  Layers,
  ArrowLeft,
  X,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Flame,
  BadgeAlert,
  Coins,
  Send,
  Navigation,
  Save,
  Download,
  Percent
} from 'lucide-react';
import { Product, Order, Seller } from '../types';

export interface SellerDashboardProps {
  onBackToShop: () => void;
  products: Product[];
  orders: Order[];
  sellers: Seller[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onRegisterSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  currentSellerId?: string;
  onSwitchSeller?: (sellerId: string) => void;
  commissionRate?: number;
  onViewPublicStore?: (slugOrStoreName: string) => void;
}

export const CATEGORIES_LIST = [
  'Luxury Perfumes',
  'Organic Attar',
  'Electronic Gadgets',
  'Glow Lights',
  'Fashion & Apparel',
  'Watches & Jewelry',
  'Lifestyle & Home'
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onBackToShop,
  products,
  orders,
  sellers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRegisterSeller,
  onUpdateOrderStatus,
  onUpdateOrderTracking,
  currentSellerId,
  onSwitchSeller,
  commissionRate = 8,
  onViewPublicStore,
}) => {
  // Navigation tabs: 'dashboard' | 'products' | 'orders' | 'payouts' | 'register'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'payouts' | 'register'>('dashboard');

  // Active seller state
  const activeSeller = useMemo(() => {
    if (currentSellerId) {
      return sellers.find((s) => s.id === currentSellerId) || sellers[0];
    }
    return sellers[0] || null;
  }, [sellers, currentSellerId]);

  // Filter products for this seller
  const sellerProducts = useMemo(() => {
    if (!activeSeller) return [];
    return products.filter((p) => {
      const pStore = (p.storeName || p.sellerName || '').toLowerCase().trim();
      const sStore = (activeSeller.storeName || '').toLowerCase().trim();
      return (
        pStore === sStore ||
        (activeSeller.id === 'seller-1' && (pStore.includes('perfume') || pStore.includes('prime')))
      );
    });
  }, [products, activeSeller]);

  // Filter orders containing products from this seller
  const sellerOrders = useMemo(() => {
    if (!activeSeller) return [];
    return orders.filter((order) => {
      return order.items.some((item) => {
        const itemStore = (item.storeName || item.product.storeName || item.product.sellerName || '').toLowerCase().trim();
        const sStore = (activeSeller.storeName || '').toLowerCase().trim();
        return (
          itemStore === sStore ||
          (activeSeller.id === 'seller-1' && (itemStore.includes('perfume') || itemStore.includes('prime')))
        );
      });
    });
  }, [orders, activeSeller]);

  // Financial KPIs
  const sellerFinancials = useMemo(() => {
    let revenue = 0;
    sellerOrders.forEach((order) => {
      order.items.forEach((item) => {
        const itemStore = (item.storeName || item.product.storeName || item.product.sellerName || '').toLowerCase().trim();
        const sStore = (activeSeller?.storeName || '').toLowerCase().trim();
        if (
          itemStore === sStore ||
          (activeSeller?.id === 'seller-1' && (itemStore.includes('perfume') || itemStore.includes('prime')))
        ) {
          revenue += item.product.price * item.quantity;
        }
      });
    });

    const pendingOrdersCount = sellerOrders.filter(
      (o) => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Processing'
    ).length;

    const effectiveCommissionRate = commissionRate || 8;
    const platformCommission = Math.round(revenue * (effectiveCommissionRate / 100));
    const availableBalance = Math.max(0, revenue - platformCommission);

    return {
      revenue,
      totalOrders: sellerOrders.length,
      pendingOrders: pendingOrdersCount,
      activeProducts: sellerProducts.filter((p) => p.inStock).length,
      totalProducts: sellerProducts.length,
      availableBalance,
      platformCommission,
      commissionRate: effectiveCommissionRate,
    };
  }, [sellerOrders, sellerProducts, activeSeller, commissionRate]);

  // ================= Product Upload & Management States =================
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState(CATEGORIES_LIST[0]);
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [prodImage, setProdImage] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodSizes, setProdSizes] = useState('50ml, 100ml');
  const [productSearch, setProductSearch] = useState('');

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdCategory(CATEGORIES_LIST[0]);
    setProdPrice('');
    setProdOriginalPrice('');
    setProdInStock(true);
    setProdImage('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80');
    setProdDescription('');
    setProdVideoUrl('');
    setProdFeatures('100% Genuine Certified, Original Packaging, Long-Lasting');
    setProdSizes('50ml, 100ml');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdTitle(product.title);
    setProdCategory(product.category || CATEGORIES_LIST[0]);
    setProdPrice(product.price.toString());
    setProdOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setProdInStock(product.inStock);
    setProdImage(product.image);
    setProdDescription(product.description || '');
    setProdVideoUrl(product.videoUrl || '');
    setProdFeatures(product.features ? product.features.join(', ') : '');
    setProdSizes(product.sizes ? product.sizes.join(', ') : '50ml, 100ml');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodPrice) return;

    const priceNum = parseFloat(prodPrice) || 0;
    const origPriceNum = prodOriginalPrice ? parseFloat(prodOriginalPrice) : undefined;
    const feats = prodFeatures
      ? prodFeatures.split(',').map((f) => f.trim()).filter(Boolean)
      : ['Original Guarantee'];
    const sizes = prodSizes
      ? prodSizes.split(',').map((s) => s.trim()).filter(Boolean)
      : ['50ml', '100ml'];

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        title: prodTitle.trim(),
        category: prodCategory,
        price: priceNum,
        originalPrice: origPriceNum,
        inStock: prodInStock,
        image: prodImage.trim() || editingProduct.image,
        description: prodDescription.trim(),
        videoUrl: prodVideoUrl.trim() || undefined,
        features: feats,
        sizes: sizes,
        storeName: activeSeller?.storeName || editingProduct.storeName,
      });
    } else {
      onAddProduct({
        title: prodTitle.trim(),
        category: prodCategory,
        price: priceNum,
        originalPrice: origPriceNum,
        rating: 4.9,
        reviewsCount: 1,
        image:
          prodImage.trim() ||
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
        description: prodDescription.trim(),
        videoUrl: prodVideoUrl.trim() || undefined,
        inStock: prodInStock,
        features: feats,
        sizes: sizes,
        storeName: activeSeller?.storeName || 'Prime Vault Official',
        sellerName: activeSeller?.storeName || 'Prime Vault Official',
      });
    }

    setIsProductModalOpen(false);
  };

  const handleToggleStock = (product: Product) => {
    onUpdateProduct({
      ...product,
      inStock: !product.inStock,
    });
  };

  // ================= Order Fulfillment & Tracking States =================
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Processing' | 'Ready' | 'Shipped' | 'Delivered'>('All');
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [inputCourier, setInputCourier] = useState('');
  const [inputTracking, setInputTracking] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const filteredSellerOrders = useMemo(() => {
    if (orderFilter === 'All') return sellerOrders;
    if (orderFilter === 'Pending') return sellerOrders.filter((o) => o.status === 'Pending' || o.status === 'Confirmed');
    if (orderFilter === 'Processing') return sellerOrders.filter((o) => o.status === 'Processing');
    if (orderFilter === 'Ready') return sellerOrders.filter((o) => o.status === 'Ready for Pickup');
    if (orderFilter === 'Shipped') return sellerOrders.filter((o) => o.status === 'Shipped');
    if (orderFilter === 'Delivered') return sellerOrders.filter((o) => o.status === 'Delivered');
    return sellerOrders;
  }, [sellerOrders, orderFilter]);

  const handleSaveTracking = (orderId: string) => {
    if (onUpdateOrderTracking && (inputCourier.trim() || inputTracking.trim())) {
      onUpdateOrderTracking(orderId, inputCourier.trim() || 'Pathao Express', inputTracking.trim());
      showToast(`✓ Tracking assigned for Order ${orderId}: ${inputCourier || 'Courier'} (${inputTracking})`);
    }
    setEditingTrackingOrderId(null);
  };

  // ================= Merchant Registration Form States =================
  const [regStoreName, setRegStoreName] = useState('');
  const [regSlug, setRegSlug] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCategory, setRegCategory] = useState(CATEGORIES_LIST[0]);
  const [regNid, setRegNid] = useState('');
  const [regPayoutMethod, setRegPayoutMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [regPayoutAccount, setRegPayoutAccount] = useState('');
  const [regBankName, setRegBankName] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regSubmitted, setRegSubmitted] = useState(false);

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRegStoreName(val);
    const slugified = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setRegSlug(slugified);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterSeller({
      storeName: regStoreName.trim(),
      slug: regSlug.trim() || 'store-' + Date.now(),
      ownerName: regOwnerName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      category: regCategory,
      nidOrTradeLicense: regNid.trim(),
      payoutMethod: regPayoutMethod,
      payoutAccount: regPayoutAccount.trim(),
      bankName: regPayoutMethod === 'bank' ? regBankName.trim() : undefined,
      description: regDescription.trim(),
    });
    setRegSubmitted(true);
    showToast(`🏪 Application for "${regStoreName}" submitted!`);
  };

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* Top Banner & Active Store Navigation */}
      <div className="bg-gray-50 border-b border-[#E5E7EB] py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={onBackToShop}
              className="text-gray-500 hover:text-[#5B21B6] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="font-extrabold text-[#5B21B6]">Merchant Seller Center</span>
          </div>

          <div className="flex items-center gap-2">
            {sellers.length > 1 && onSwitchSeller && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 text-[11px] hidden sm:inline">Active Store:</span>
                <select
                  value={activeSeller?.id}
                  onChange={(e) => onSwitchSeller(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-purple-200 bg-white text-[#5B21B6] font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeSeller && onViewPublicStore && (
              <button
                onClick={() => onViewPublicStore(activeSeller.slug)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#5B21B6] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="View your public storefront"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Public Storefront</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('register');
                setRegSubmitted(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Become a Seller (নতুন স্টোর খুলুন)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border border-purple-300 font-black shadow-2xs'
                  : 'text-[#525252] hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Merchant Dashboard (KPIs & Sales)</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border border-purple-300 font-black shadow-2xs'
                  : 'text-[#525252] hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Inventory ({sellerProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border border-purple-300 font-black shadow-2xs'
                  : 'text-[#525252] hover:bg-gray-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Order Fulfillment ({sellerOrders.length})</span>
              {sellerFinancials.pendingOrders > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'payouts'
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border border-purple-300 font-black shadow-2xs'
                  : 'text-[#525252] hover:bg-gray-50'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Payouts & Finance (৳{sellerFinancials.availableBalance.toLocaleString()})</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'register'
                  ? 'bg-[#EDE9FE] text-[#5B21B6] border border-purple-300 font-black shadow-2xs'
                  : 'text-[#525252] hover:bg-gray-50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Store Registration & KYB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-slideLeft">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ================= TAB 1: MERCHANT DASHBOARD OVERVIEW ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Store Header Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#171717] text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
                <Store className="w-48 h-48 text-purple-400" />
              </div>
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Active Merchant
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Status: {activeSeller?.status || 'Approved'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{activeSeller?.storeName}</h2>
                <p className="text-xs text-purple-200">
                  {activeSeller?.description || 'Prime Vault Zone verified seller partner in Bangladesh.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-300">
                  <span>Owner: <strong className="text-white">{activeSeller?.ownerName}</strong></span>
                  <span>•</span>
                  <span>Contact: <strong className="text-white font-mono">{activeSeller?.phone}</strong></span>
                  <span>•</span>
                  <span>Payout: <strong className="text-white font-mono uppercase">{activeSeller?.payoutMethod} ({activeSeller?.payoutAccount})</strong></span>
                </div>
              </div>
            </div>

            {/* 4 Primary Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Revenue */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Total Store Sales (বিক্রি)</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-[#171717] font-mono">
                  ৳{sellerFinancials.revenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">
                  From {sellerFinancials.totalOrders} total orders
                </div>
              </div>

              {/* Active Listings */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Active Listings (পণ্য সংখ্যা)</span>
                  <Package className="w-4 h-4 text-[#5B21B6]" />
                </div>
                <div className="text-2xl font-black text-[#171717] font-mono">
                  {sellerFinancials.activeProducts}
                </div>
                <div className="text-[11px] text-purple-700 font-semibold">
                  Out of {sellerFinancials.totalProducts} total catalog items
                </div>
              </div>

              {/* Pending Orders */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Pending Fulfillment (অর্ডার বাকি)</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {sellerFinancials.pendingOrders}
                </div>
                <div className="text-[11px] text-gray-500">
                  Ready for packing & courier dispatch
                </div>
              </div>

              {/* Available Payout Balance */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Available Payout (উত্তোলনযোগ্য)</span>
                  <Coins className="w-4 h-4 text-[#5B21B6]" />
                </div>
                <div className="text-2xl font-black text-[#5B21B6] font-mono">
                  ৳{sellerFinancials.availableBalance.toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-500">
                  After {sellerFinancials.commissionRate}% platform fee
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B21B6]">
                <Sparkles className="w-4 h-4" />
                <span>Manage your store catalog and fulfill incoming orders smoothly</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAddProductModal}
                  className="px-4 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload New Product</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-4 py-2 rounded-xl bg-white border border-purple-300 text-[#5B21B6] text-xs font-bold hover:bg-purple-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Fulfill Orders</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCT UPLOAD & INVENTORY CONTROL ================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Header with Search and Upload CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search store inventory..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <button
                onClick={openAddProductModal}
                className="px-4 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product (নতুন পণ্য যোগ করুন)</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="rounded-3xl bg-white border border-[#E5E7EB] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sellerProducts
                      .filter((p) =>
                        productSearch.trim()
                          ? p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
                          : true
                      )
                      .map((product) => {
                        const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                        return (
                          <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Product Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                                />
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-[#171717] truncate">{product.title}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Rating: {product.rating || 4.9} ★ ({product.reviewsCount || 0} reviews)
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5B21B6]">
                                {product.category}
                              </span>
                            </td>

                            {/* Price & Discount */}
                            <td className="py-3 px-4 font-mono font-bold text-[#171717]">
                              <div>৳{product.price.toLocaleString()}</div>
                              {hasDiscount && (
                                <div className="text-[10px] text-gray-400 line-through">
                                  ৳{product.originalPrice!.toLocaleString()}
                                </div>
                              )}
                            </td>

                            {/* Stock Toggle */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStock(product)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                  product.inStock
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {product.inStock ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>In Stock (বিক্রি চালু)</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-rose-600" />
                                    <span>Out of Stock</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Edit / Delete Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(product)}
                                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-[#5B21B6] hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteProduct && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete product "${product.title}"?`)) {
                                        onDeleteProduct(product.id);
                                        showToast(`Deleted ${product.title}`);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MERCHANT ORDER FULFILLMENT ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Fulfillment Status Filter Bar */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                {(['All', 'Pending', 'Processing', 'Ready', 'Shipped', 'Delivered'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      orderFilter === st
                        ? 'bg-[#5B21B6] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'Ready' ? 'Ready for Pickup' : st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">
                {filteredSellerOrders.length} orders
              </span>
            </div>

            {/* Orders Fulfillment Cards List */}
            {filteredSellerOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-2">
                <p className="text-xs text-gray-500">এই ফিল্টারে কোনো অর্ডার নেই।</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSellerOrders.map((order) => {
                  const isEditingTracking = editingTrackingOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-xs space-y-3"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#171717]">{order.id}</span>
                          <span className="text-xs text-gray-500">• {order.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : order.status === 'Ready for Pickup'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-purple-100 text-[#5B21B6]'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Status Transition Control Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-gray-500 mr-1 hidden sm:inline">Set Status:</span>
                          {(['Processing', 'Ready for Pickup', 'Shipped', 'Delivered'] as Order['status'][]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                onUpdateOrderStatus(order.id, st);
                                showToast(`✓ Order ${order.id} marked as ${st}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                order.status === st
                                  ? 'bg-[#5B21B6] text-white border-[#5B21B6]'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recipient & Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1 text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <p className="font-bold text-[#171717]">Delivery Recipient:</p>
                          <p>{order.address.fullName} ({order.address.phone})</p>
                          <p>{order.address.fullAddress}</p>
                          <p className="font-semibold text-[#5B21B6]">{order.address.cityDivision}</p>
                          {order.address.notes && (
                            <p className="text-[11px] text-gray-500 italic">"{order.address.notes}"</p>
                          )}
                        </div>

                        {/* Courier Tracking Editor Box */}
                        <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#5B21B6] flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5" />
                              <span>Courier Dispatch & Tracking Reference</span>
                            </span>
                            {!isEditingTracking && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrackingOrderId(order.id);
                                  setInputCourier(order.courierName || 'Pathao Express');
                                  setInputTracking(order.trackingNumber || `PVZ-${order.id.replace(/\D/g, '')}`);
                                }}
                                className="text-[11px] font-bold text-[#5B21B6] hover:underline cursor-pointer"
                              >
                                Edit Tracking
                              </button>
                            )}
                          </div>

                          {isEditingTracking ? (
                            <div className="space-y-2 pt-1">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Courier (e.g. Pathao / Steadfast)"
                                  value={inputCourier}
                                  onChange={(e) => setInputCourier(e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white text-gray-900 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Tracking Reference ID"
                                  value={inputTracking}
                                  onChange={(e) => setInputTracking(e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-purple-300 text-xs bg-white text-gray-900 font-mono focus:outline-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveTracking(order.id)}
                                  className="px-3 py-1 rounded-lg bg-[#5B21B6] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Save Tracking
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTrackingOrderId(null)}
                                  className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-[11px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-600 font-mono space-y-0.5">
                              <p>Courier: <strong>{order.courierName || 'Unassigned (Default Pathao)'}</strong></p>
                              <p>Tracking ID: <strong>{order.trackingNumber || `PVZ-BD-${order.id.replace(/\D/g, '')}`}</strong></p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Ordered Table */}
                      <div className="divide-y divide-gray-100 pt-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                              />
                              <span className="font-semibold text-gray-800">{item.product.title}</span>
                              <span className="text-gray-400 font-mono">x{item.quantity}</span>
                            </div>
                            <span className="font-bold text-[#171717] font-mono">
                              ৳{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PAYOUTS & FINANCE ================= */}
        {activeTab === 'payouts' && (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#171717] to-slate-900 text-white shadow-md space-y-3">
              <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                Merchant Earnings & Settlement
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono">
                  ৳{sellerFinancials.availableBalance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-gray-400">BDT</span>
              </div>
              <p className="text-xs text-gray-300">
                Disbursed every week to your verified {activeSeller?.payoutMethod.toUpperCase()} account ({activeSeller?.payoutAccount}).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-3 text-xs">
              <h4 className="font-bold text-[#171717]">Settlement Breakdown</h4>
              <div className="divide-y divide-gray-100">
                <div className="py-2 flex justify-between">
                  <span className="text-gray-600">Gross Sales (মোট বিক্রি)</span>
                  <span className="font-bold text-gray-900 font-mono">৳{sellerFinancials.revenue.toLocaleString()}</span>
                </div>
                <div className="py-2 flex justify-between text-rose-600">
                  <span>Prime Vault Zone Commission ({sellerFinancials.commissionRate}%)</span>
                  <span className="font-bold font-mono">-৳{sellerFinancials.platformCommission.toLocaleString()}</span>
                </div>
                <div className="py-2 flex justify-between font-bold text-[#5B21B6] text-sm">
                  <span>Net Available Balance</span>
                  <span className="font-mono">৳{sellerFinancials.availableBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REGISTRATION & KYB ================= */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E5E7EB] p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-black text-[#171717]">Become a Verified Seller</h3>
              <p className="text-xs text-gray-500">
                Join Bangladesh's premier lifestyle and luxury marketplace. Zero listing fees.
              </p>
            </div>

            {regSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-gray-900">Application Submitted!</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Our merchant verification team is reviewing your documents. We will contact you at {regPhone} within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Store / Business Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PerfumeVault BD"
                    value={regStoreName}
                    onChange={handleStoreNameChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Storefront URL Slug*</label>
                  <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden bg-gray-50 px-3 py-2 text-xs">
                    <span className="text-gray-400 font-mono">primevault.zone/store/</span>
                    <input
                      type="text"
                      required
                      value={regSlug}
                      onChange={(e) => setRegSlug(e.target.value)}
                      className="flex-1 bg-transparent font-mono font-bold text-[#5B21B6] focus:outline-none pl-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Owner Name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Number (01XXXXXXXXX)*</label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#5B21B6]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-4"
                >
                  Submit Merchant Application
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-[#171717]">
                {editingProduct ? 'Edit Store Product' : 'Upload New Product (নতুন পণ্য)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Title*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. French Oudh Royal Extrait De Parfum"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category*</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:border-[#5B21B6]"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock Availability</label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stock"
                        checked={prodInStock}
                        onChange={() => setProdInStock(true)}
                        className="text-[#5B21B6]"
                      />
                      <span className="font-semibold text-emerald-700">In Stock</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stock"
                        checked={!prodInStock}
                        onChange={() => setProdInStock(false)}
                        className="text-rose-600"
                      />
                      <span className="font-semibold text-rose-700">Out of Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selling Price (৳)*</label>
                  <input
                    type="number"
                    required
                    placeholder="1250"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold focus:outline-none focus:border-[#5B21B6]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Original Price (৳ - Strike-through)</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#5B21B6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Image URL*</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#5B21B6]"
                />
                {prodImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={prodImage}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <span className="text-[11px] text-gray-500">Image Asset Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Showcase Video URL (YouTube or MP4 - Optional)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={prodVideoUrl}
                  onChange={(e) => setProdVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Available Sizes (Comma separated)</label>
                <input
                  type="text"
                  placeholder="50ml, 100ml, 150ml"
                  value={prodSizes}
                  onChange={(e) => setProdSizes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Key Features (Comma separated)</label>
                <input
                  type="text"
                  placeholder="100% Genuine, Long Lasting, Original Packaging"
                  value={prodFeatures}
                  onChange={(e) => setProdFeatures(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed product specifications and highlights..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#5B21B6] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold cursor-pointer shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Upload Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
