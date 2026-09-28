import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  DollarSign,
  AlertCircle,
  Check,
  User,
  ShoppingBag,
  FileText,
  Printer,
  ShieldCheck,
  Store,
  Send,
  Eye,
  X
} from 'lucide-react';
import { Order } from '../../types';

interface AdminOrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  showToast: (msg: string) => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Quick Tracking update popover states
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [courierInput, setCourierInput] = useState('Pathao Courier');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      showToast(`Copied ${label}: ${text}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // KPIs
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'All') {
        if (paymentFilter === 'cod' && order.paymentMethod !== 'cod') return false;
        if (paymentFilter === 'bkash' && order.paymentMethod !== 'bkash') return false;
        if (paymentFilter === 'nagad' && order.paymentMethod !== 'nagad') return false;
        if (paymentFilter === 'card' && order.paymentMethod !== 'card') return false;
      }

      // 3. Search Query Filter (Order ID, Name, Phone, Items, TrxID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = order.address.fullName.toLowerCase().includes(q);
        const matchesPhone = order.address.phone.toLowerCase().includes(q);
        const matchesAddress = order.address.fullAddress.toLowerCase().includes(q);
        const matchesTrx = order.trxId ? order.trxId.toLowerCase().includes(q) : false;
        const matchesItem = order.items.some((item) => item.product.title.toLowerCase().includes(q));

        if (!matchesId && !matchesName && !matchesPhone && !matchesAddress && !matchesTrx && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  const handleSaveTracking = () => {
    if (!trackingModalOrder) return;
    if (onUpdateOrderTracking) {
      onUpdateOrderTracking(trackingModalOrder.id, courierInput, trackingNumberInput);
    }
    showToast(`✓ Tracking updated for ${trackingModalOrder.id}`);
    setTrackingModalOrder(null);
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Confirmed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Processing':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Shipped':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Delivered':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Cancelled':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getPaymentMethodBadge = (method: Order['paymentMethod'], trxId?: string) => {
    switch (method) {
      case 'bkash':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E2136E]/15 border border-[#E2136E]/40 text-[#E2136E] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#E2136E] animate-pulse" />
            <span>bKash Online</span>
            {trxId && <span className="text-[10px] text-pink-300 opacity-90 font-mono">({trxId})</span>}
          </div>
        );
      case 'nagad':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7941D]/15 border border-[#F7941D]/40 text-[#F7941D] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#F7941D] animate-pulse" />
            <span>Nagad Online</span>
            {trxId && <span className="text-[10px] text-amber-200 opacity-90 font-mono">({trxId})</span>}
          </div>
        );
      case 'cod':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Cash on Delivery (COD)</span>
          </div>
        );
      case 'card':
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Debit / Credit Card</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold">
            <span>{String(method).toUpperCase()}</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & KPI Statistics Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Orders Logged</span>
          </span>
          <span className="text-xl font-extrabold text-white font-mono mt-1">
            {totalOrdersCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Real-time buyer checkout orders</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 flex flex-col justify-between">
          <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Action</span>
          </span>
          <span className="text-xl font-extrabold text-amber-400 font-mono mt-1">
            {pendingOrdersCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Requires dispatch or confirmation</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered Orders</span>
          </span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
            {deliveredOrdersCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Completed customer deliveries</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30 flex flex-col justify-between">
          <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            <span>Total Revenue Logged</span>
          </span>
          <span className="text-xl font-extrabold text-cyan-300 font-mono mt-1">
            ৳{totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Accumulated sales volume</span>
        </div>
      </div>

      {/* 2. Interactive Search and Filters Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Universal Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="admin-search-orders-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Customer Name, Phone (e.g. 017...), TrxID, or Item..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-400" />
              <span>Payment:</span>
            </span>
            <select
              id="admin-order-payment-filter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="All">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="bkash">bKash Online</option>
              <option value="nagad">Nagad Online</option>
              <option value="card">Card Payment</option>
            </select>
          </div>
        </div>

        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-semibold mr-1 shrink-0">Status:</span>
          {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => {
            const count = st === 'All' ? orders.length : orders.filter((o) => o.status === st).length;
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-black text-cyan-300' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Granular Orders Listing */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">No Orders Match Your Filter</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, status tab, or payment method filter. Real-time buyer orders will appear here automatically.
          </p>
          {(searchQuery || statusFilter !== 'All' || paymentFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setPaymentFilter('All');
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition-all"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders[order.id] ?? true; // Default expanded for maximum clarity
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="bg-slate-900/90 rounded-2xl border border-slate-800/90 hover:border-slate-700 transition-all overflow-hidden shadow-lg"
              >
                {/* Order Summary Top Bar */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Order ID with Copy */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-cyan-400">{order.id}</span>
                      <button
                        onClick={() => copyToClipboard(order.id, 'Order ID')}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title="Copy Order ID"
                      >
                        {copiedId === order.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="text-slate-600 hidden sm:inline">•</span>

                    {/* Date and Time */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{order.date}</span>
                    </div>

                    <span className="text-slate-600 hidden sm:inline">•</span>

                    {/* Payment Method Badge */}
                    <div>{getPaymentMethodBadge(order.paymentMethod, order.trxId)}</div>
                  </div>

                  {/* Status Dropdown & Action Cluster */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* One-Click bKash/Nagad TrxID Quick Verification Toggle */}
                    {(order.paymentMethod === 'bkash' || order.paymentMethod === 'nagad') && (
                      order.paymentStatus === 'Verified' ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>TrxID Verified</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateOrderPaymentStatus) {
                              onUpdateOrderPaymentStatus(order.id, 'Verified');
                            }
                            if (order.status === 'Pending') {
                              onUpdateOrderStatus(order.id, 'Confirmed');
                            }
                            showToast(`✓ TrxID for Order #${order.id} verified & confirmed!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
                          title={`Click to verify ${order.paymentMethod.toUpperCase()} TrxID: ${order.trxId || 'N/A'}`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Verify TrxID</span>
                        </button>
                      )
                    )}

                    {/* Status Dropdown with Ready for Pickup */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">Status:</span>
                      <select
                        id={`status-select-${order.id}`}
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 bg-slate-900 border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Invoice View Button */}
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="View / Print Customer Invoice"
                    >
                      <FileText className="w-4 h-4 text-cyan-300" />
                    </button>

                    {/* Collapse / Expand Toggle */}
                    <button
                      onClick={() => toggleOrderExpand(order.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Detailed Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5">
                    {/* Status Override Sequence Pipeline */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                          <span>Admin Status Override Pipeline:</span>
                        </span>
                        <span className="text-[11px] text-slate-500 hidden sm:inline">Click any stage to instantly transition order state</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 text-xs">
                        {[
                          { id: 'Pending', label: '1. Pending' },
                          { id: 'Confirmed', label: '2. Confirmed (Verified)' },
                          { id: 'Processing', label: '3. Processing' },
                          { id: 'Ready for Pickup', label: '4. Ready for Pickup' },
                          { id: 'Shipped', label: '5. Shipped' },
                          { id: 'Delivered', label: '6. Delivered' },
                        ].map((step) => {
                          const isActive = order.status === step.id;
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => {
                                onUpdateOrderStatus(order.id, step.id as Order['status']);
                                showToast(`✓ Order #${order.id} status transitioned to ${step.id}`);
                              }}
                              className={`p-2 rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer border ${
                                isActive
                                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                              }`}
                            >
                              <span>{step.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                    {/* LEFT (Cols 1-5): Customer & Delivery Information */}
                    <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-5">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                        <User className="w-4 h-4" />
                        <span>Customer & Shipping Details</span>
                      </div>

                      {/* Customer Full Name */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">Full Name:</span>
                          <span className="text-sm font-bold text-white block">{order.address.fullName}</span>
                        </div>

                        {/* Verified Mobile Number */}
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                            Verified Mobile Number:
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-sm font-bold text-cyan-300">
                              {order.address.phone}
                            </span>
                            <a
                              href={`tel:${order.address.phone}`}
                              className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Direct Phone Call"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                            <button
                              onClick={() => copyToClipboard(order.address.phone, 'Phone number')}
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title="Copy Phone"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Detailed Shipping Address */}
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                            Delivery Shipping Address:
                          </span>
                          <div className="text-slate-300 mt-0.5 flex items-start gap-1.5 leading-relaxed">
                            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-white">{order.address.fullAddress}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-purple-300 text-[10px] font-semibold">
                                {order.address.cityDivision}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Notes */}
                        {order.address.notes && (
                          <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-amber-200 text-[11px]">
                            <strong className="block text-amber-400 text-[10px] uppercase">Buyer Delivery Note:</strong>
                            <em>"{order.address.notes}"</em>
                          </div>
                        )}
                      </div>

                      {/* Courier & Tracking Assignment */}
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                            Courier Logistics:
                          </span>
                          <span className="font-bold text-white">
                            {order.courierName || 'Pathao Courier'}
                          </span>
                          {order.trackingNumber ? (
                            <span className="text-[11px] font-mono text-cyan-400 block">
                              Track: {order.trackingNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 block">No tracking code yet</span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setTrackingModalOrder(order);
                            setCourierInput(order.courierName || 'Pathao Courier');
                            setTrackingNumberInput(order.trackingNumber || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Truck className="w-3 h-3" />
                          <span>{order.trackingNumber ? 'Edit' : 'Assign'} Tracking</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT (Cols 6-12): Itemized Product Breakdown & Financial Total */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center justify-between text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Itemized Product Breakdown ({totalItemsCount} items)</span>
                        </div>
                        <span className="text-slate-400 font-mono text-xs">
                          Subtotal: ৳{order.subtotal}
                        </span>
                      </div>

                      {/* Items List Table / Cards */}
                      <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${item.product.id}-${idx}`}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.product.image}
                                alt={item.product.title}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="font-bold text-white text-xs truncate max-w-xs sm:max-w-sm">
                                  {item.product.title}
                                </h5>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                  {item.selectedSize && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                                      Size: {item.selectedSize}
                                    </span>
                                  )}
                                  <span className="text-slate-400">
                                    Unit Price: <strong className="text-white font-mono">৳{item.product.price}</strong>
                                  </span>
                                  {item.product.category && (
                                    <span className="text-slate-500">• {item.product.category}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quantity & Item Line Total */}
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-400 block font-mono">
                                x{item.quantity}
                              </span>
                              <span className="text-sm font-bold text-cyan-400 font-mono block">
                                ৳{(item.product.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financial Breakdown & Total Amount Highlight */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Items Subtotal:</span>
                          <span className="font-mono text-white">৳{order.subtotal}</span>
                        </div>

                        {order.discount > 0 && (
                          <div className="flex justify-between text-xs text-rose-400">
                            <span>Promotional Discount / Coupon:</span>
                            <span className="font-mono">-৳{order.discount}</span>
                          </div>
                        )}

                        {order.walletDeducted > 0 && (
                          <div className="flex justify-between text-xs text-emerald-400">
                            <span>Prime Vault Wallet Balance Used:</span>
                            <span className="font-mono">-৳{order.walletDeducted}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Shipping & Express Delivery Fee:</span>
                          <span className="font-mono text-white">৳{order.deliveryFee}</span>
                        </div>

                        {/* Grand Total Order Amount Highlight */}
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="text-sm font-bold text-white block">Grand Total Paid:</span>
                            <span className="text-[10px] text-slate-400">
                              Via {order.paymentMethod.toUpperCase()}{' '}
                              {order.trxId ? `(Trx: ${order.trxId})` : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono block">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Payment Verification Status Selector */}
                        <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-semibold">Payment Status:</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                order.paymentStatus === 'Verified' || order.paymentStatus === 'Paid (COD on Delivery)' || order.status === 'Delivered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : order.paymentStatus === 'Failed'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : order.paymentMethod === 'cod'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              }`}
                            >
                              {order.paymentStatus || (order.paymentMethod === 'cod' ? 'Pending Collection (COD)' : 'Pending Verification')}
                            </span>
                          </div>

                          {onUpdateOrderPaymentStatus && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">Update Status:</span>
                              <select
                                id={`order-payment-status-select-${order.id}`}
                                value={
                                  order.paymentStatus ||
                                  (order.paymentMethod === 'cod' ? 'Pending Verification' : 'Pending Verification')
                                }
                                onChange={(e) => {
                                  const nextStatus = e.target.value as Order['paymentStatus'];
                                  if (nextStatus) {
                                    onUpdateOrderPaymentStatus(order.id, nextStatus);
                                    showToast(`✓ Order #${order.id} payment status set to: ${nextStatus}`);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                {order.paymentMethod === 'cod' ? (
                                  <>
                                    <option value="Pending Verification">Pending Collection (COD)</option>
                                    <option value="Paid (COD on Delivery)">Paid (COD on Delivery) ✓</option>
                                    <option value="Failed">Payment Failed</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Pending Verification">Pending Verification</option>
                                    <option value="Verified">Verified ✓</option>
                                    <option value="Failed">Failed / Invalid Trx</option>
                                  </>
                                )}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Tracking Number Modal */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Courier Logistics - {trackingModalOrder.id}</span>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Logistics Courier Partner</label>
                <select
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="Steadfast Courier">Steadfast Courier</option>
                  <option value="Paperfly Logistics">Paperfly Logistics</option>
                  <option value="RedX Delivery">RedX Delivery</option>
                  <option value="Sundarban Courier">Sundarban Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Courier Tracking / Consignment ID</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. PTH-98214-BD"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setTrackingModalOrder(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTracking}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold shadow-lg"
              >
                Save Tracking Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Printable Invoice / Receipt Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white text-[#171717] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header / Brand */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-[#5B21B6] tracking-tight">PRIME VAULT ZONE</h3>
                <p className="text-[11px] text-gray-500">Official Customer Purchase Invoice & Order Receipt</p>
              </div>
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order & Customer Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Order Details:</span>
                <p className="font-mono font-bold text-[#5B21B6] mt-0.5">{selectedOrderForInvoice.id}</p>
                <p className="text-gray-600 mt-0.5">Date: {selectedOrderForInvoice.date}</p>
                <p className="text-gray-600 mt-0.5">Payment: {selectedOrderForInvoice.paymentMethod.toUpperCase()}</p>
                {selectedOrderForInvoice.trxId && (
                  <p className="text-gray-600 font-mono">TrxID: {selectedOrderForInvoice.trxId}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Billed & Shipped To:</span>
                <p className="font-bold text-gray-900 mt-0.5">{selectedOrderForInvoice.address.fullName}</p>
                <p className="text-gray-600 font-mono mt-0.5">{selectedOrderForInvoice.address.phone}</p>
                <p className="text-gray-600 mt-0.5 leading-snug">{selectedOrderForInvoice.address.fullAddress}</p>
                <p className="text-gray-500 text-[11px]">{selectedOrderForInvoice.address.cityDivision}</p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrderForInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-gray-800">
                        {item.product.title}
                        {item.selectedSize && <span className="text-gray-500 text-[10px] ml-1">({item.selectedSize})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">৳{item.product.price}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        ৳{item.product.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="space-y-1.5 text-xs text-gray-600 border-t pt-3">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono text-gray-900 font-medium">৳{selectedOrderForInvoice.subtotal}</span>
              </div>
              {selectedOrderForInvoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-৳{selectedOrderForInvoice.discount}</span>
                </div>
              )}
              {selectedOrderForInvoice.walletDeducted > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Wallet Bonus Applied:</span>
                  <span className="font-mono">-৳{selectedOrderForInvoice.walletDeducted}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Delivery Fee:</span>
                <span className="font-mono text-gray-900 font-medium">৳{selectedOrderForInvoice.deliveryFee}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-gray-900 border-t pt-2 mt-1">
                <span>Total Amount:</span>
                <span className="text-[#5B21B6] font-mono text-lg">৳{selectedOrderForInvoice.total}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-[10px] text-gray-500">
                Helpline: 01883-418309 | support@primevaultzone.com
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
