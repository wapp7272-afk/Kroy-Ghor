import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Package,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  TrendingDown,
  Layers,
  ArrowUpDown,
  Tag,
  Store,
  ExternalLink,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { Product } from '../../types';

interface AdminInventoryManagerProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  showToast?: (msg: string) => void;
}

export const AdminInventoryManager: React.FC<AdminInventoryManagerProps> = ({
  products,
  onUpdateProduct,
  showToast = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'low' | 'out' | 'sufficient'>('All');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [bulkRestockAmount, setBulkRestockAmount] = useState<number>(10);

  // Helper to get stock quantity with safe fallback
  const getProductStock = (product: Product): number => {
    if (product.stockQuantity !== undefined) return product.stockQuantity;
    if (product.inStock === false) return 0;
    // Specific low-stock items for realistic simulation
    if (product.id === 'p3') return 3;
    if (product.id === 'p5') return 2;
    if (product.id === 'glow-3' || product.id === 'tech-2') return 4;
    // Default fallback based on hash
    const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 12 + (hash % 18);
  };

  // Adjust stock quantity
  const handleAdjustStock = (product: Product, delta: number) => {
    const currentStock = getProductStock(product);
    const newStock = Math.max(0, currentStock + delta);
    const isNowInStock = newStock > 0;

    onUpdateProduct({
      ...product,
      stockQuantity: newStock,
      inStock: isNowInStock,
      lowStockThreshold: product.lowStockThreshold || lowStockThreshold,
    });

    if (newStock <= lowStockThreshold && newStock > 0) {
      showToast(`⚠️ Low stock warning for "${product.title}": Only ${newStock} units left!`);
    } else if (newStock === 0) {
      showToast(`🚫 "${product.title}" marked as Out of Stock (0 units)!`);
    } else {
      showToast(`✓ Stock updated for "${product.title}": ${newStock} units`);
    }
  };

  // Set absolute stock quantity
  const handleSetStockValue = (product: Product, value: number) => {
    const newStock = Math.max(0, value);
    const isNowInStock = newStock > 0;

    onUpdateProduct({
      ...product,
      stockQuantity: newStock,
      inStock: isNowInStock,
      lowStockThreshold: product.lowStockThreshold || lowStockThreshold,
    });

    setEditingStockId(null);
    showToast(`✓ Stock inventory set to ${newStock} units for "${product.title}"`);
  };

  // Quick Restock (+10 or bulk amount)
  const handleQuickRestock = (product: Product, amount: number = 10) => {
    handleAdjustStock(product, amount);
  };

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Inventory Metrics
  const inventoryMetrics = useMemo(() => {
    let totalUnits = 0;
    let totalAssetValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyStockCount = 0;

    products.forEach((p) => {
      const stock = getProductStock(p);
      totalUnits += stock;
      totalAssetValue += stock * p.price;

      if (stock === 0 || !p.inStock) {
        outOfStockCount++;
      } else if (stock <= lowStockThreshold) {
        lowStockCount++;
      } else {
        healthyStockCount++;
      }
    });

    return {
      totalUnits,
      totalAssetValue,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      totalProducts: products.length,
    };
  }, [products, lowStockThreshold]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = getProductStock(p);

      // Category filter
      if (categoryFilter !== 'All' && p.category !== categoryFilter) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === 'low') {
        if (stock === 0 || stock > lowStockThreshold) return false;
      } else if (stockStatusFilter === 'out') {
        if (stock > 0 && p.inStock) return false;
      } else if (stockStatusFilter === 'sufficient') {
        if (stock <= lowStockThreshold) return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = p.category ? p.category.toLowerCase().includes(q) : false;
        const matchesStore = p.storeName ? p.storeName.toLowerCase().includes(q) : false;
        const matchesSku = p.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesStore && !matchesSku) {
          return false;
        }
      }

      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, searchQuery, lowStockThreshold]);

  return (
    <div className="space-y-5">
      {/* 1. Low-Stock Warning Alert Banner (if any items <= threshold) */}
      {inventoryMetrics.lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-amber-200">
                  Critical Low-Stock Alert: {inventoryMetrics.lowStockCount} Products Below Threshold
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-black">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                These items have {lowStockThreshold} or fewer units remaining. Restock immediately to avoid stockout disruptions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStockStatusFilter('low')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" />
            <span>View {inventoryMetrics.lowStockCount} Low-Stock Items</span>
          </button>
        </div>
      )}

      {/* 2. Key Inventory Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Stock Units */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Physical Stock</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {inventoryMetrics.totalUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Units in warehouse</span>
          </div>
        </div>

        {/* Inventory Asset Value */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs text-cyan-300">
            <span>Inventory Valuation</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
              Retail
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              ৳{inventoryMetrics.totalAssetValue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Total retail value</span>
          </div>
        </div>

        {/* Low-Stock SKUs */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Low-Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {inventoryMetrics.lowStockCount}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">≤ {lowStockThreshold} units left</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>Out of Stock (Zero)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {inventoryMetrics.outOfStockCount}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Unavailable for sale</span>
          </div>
        </div>

        {/* Healthy Stock */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>Healthy Stock (&gt;5)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {inventoryMetrics.healthyStockCount}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Sufficient inventory</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search by Product Title, Category, SKU */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product inventory by title, category, or SKU..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Departments' : c}
                </option>
              ))}
            </select>

            {/* Threshold Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 text-[11px]">Alert Threshold:</span>
              <select
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value={3} className="bg-slate-900 text-white">≤ 3 units</option>
                <option value={5} className="bg-slate-900 text-white">≤ 5 units (Standard)</option>
                <option value={10} className="bg-slate-900 text-white">≤ 10 units</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-1">Filter Inventory:</span>
            {[
              { id: 'All', label: `All Catalog (${products.length})` },
              { id: 'low', label: `⚠️ Low Stock Warning (${inventoryMetrics.lowStockCount})`, alert: true },
              { id: 'out', label: `🚫 Out of Stock (${inventoryMetrics.outOfStockCount})`, danger: true },
              { id: 'sufficient', label: `✅ Sufficient Stock (${inventoryMetrics.healthyStockCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  stockStatusFilter === tab.id
                    ? tab.alert
                      ? 'bg-amber-500 text-black shadow-md'
                      : tab.danger
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-cyan-500 text-black shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredProducts.length}</strong> matching items
          </span>
        </div>
      </div>

      {/* 4. Inventory Products List Table / Cards */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No products found for this inventory filter</h4>
            <p className="text-xs text-slate-500">Try switching your stock filter or resetting search terms.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = getProductStock(product);
            const isLow = stock <= lowStockThreshold && stock > 0;
            const isOut = stock === 0 || !product.inStock;
            const isEditing = editingStockId === product.id;

            return (
              <div
                key={product.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isOut
                    ? 'bg-red-950/20 border-red-500/30'
                    : isLow
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Product Info & Visuals */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {isOut && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <span className="text-[9px] font-black text-rose-400 uppercase">OUT</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate max-w-sm">
                        {product.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        SKU: PVZ-{product.id.toUpperCase()}
                      </span>
                      {product.storeName && (
                        <span className="text-[10px] font-semibold text-purple-300 flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span>{product.storeName}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>Category: <strong className="text-slate-300">{product.category}</strong></span>
                      <span>•</span>
                      <span>Price: <strong className="text-cyan-400 font-mono">৳{product.price.toLocaleString()}</strong></span>
                      <span>•</span>
                      <span>Asset Valuation: <strong className="text-emerald-400 font-mono">৳{(stock * product.price).toLocaleString()}</strong></span>
                    </div>

                    {/* Stock status indicator badge */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-950 text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Out of Stock (0 units remaining)</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Low Stock Alert ({stock} units left • Critical)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Stock ({stock} units available)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls: Quick Steppers, Inline Input & Quick Restock */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Current Units Stepper Control */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(product, -1)}
                      disabled={stock <= 0}
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Decrease by 1 unit"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={tempStockValue}
                          onChange={(e) => setTempStockValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSetStockValue(product, parseInt(tempStockValue) || 0);
                            } else if (e.key === 'Escape') {
                              setEditingStockId(null);
                            }
                          }}
                          autoFocus
                          className="w-14 text-center py-1 text-sm font-black font-mono bg-slate-900 text-cyan-300 border border-cyan-500 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSetStockValue(product, parseInt(tempStockValue) || 0)}
                          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                          title="Save quantity"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingStockId(product.id);
                          setTempStockValue(stock.toString());
                        }}
                        className="w-14 text-center cursor-pointer hover:bg-slate-900/80 py-1 rounded-lg transition-colors"
                        title="Click to edit quantity directly"
                      >
                        <span className={`text-base font-black font-mono block ${
                          isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'
                        }`}>
                          {stock}
                        </span>
                        <span className="text-[9px] text-slate-500 block -mt-1 font-sans">units</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAdjustStock(product, 1)}
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                      title="Increase by 1 unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Increment Steppers (+5, +10 Restock) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(product, 5)}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Quick add +5 units"
                    >
                      +5
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickRestock(product, 10)}
                      className="px-3 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="Quick Restock +10 units"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>+10 Restock</span>
                    </button>

                    {/* Quick In/Out toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const newStock = isOut ? 10 : 0;
                        handleSetStockValue(product, newStock);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        isOut
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900'
                          : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                      }`}
                      title={isOut ? 'Mark In-Stock (+10)' : 'Mark Out-of-Stock (0)'}
                    >
                      {isOut ? 'Mark In Stock' : 'Mark Zero'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
