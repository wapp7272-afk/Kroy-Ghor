import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Package,
  Phone,
  Mail,
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
  X,
  StickyNote,
  Edit2,
  RotateCcw,
  Coins,
  RefreshCw,
  Tag,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { Order } from '../../types';
import { InvoiceModal } from '../InvoiceModal';
import {
  subscribeToAllOrdersFromFirestore,
  updateOrderStatusInFirestore,
  updateOrderPaymentStatusInFirestore,
  updateOrderCourierTrackingInFirestore,
  refundUserWalletInFirestore
} from '../../services/orderFirestoreService';

export interface AdminOrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (
    orderId: string,
    courierName: string,
    trackingNumber: string,
    trackingUrl?: string,
    trackingNotes?: string
  ) => void;
  onUpdateOrderNotes?: (orderId: string, notes: string) => void;
  showToast: (msg: string) => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders: initialOrders,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  onUpdateOrderNotes,
  showToast,
}) => {
  // Real-time stream of all orders from Firestore
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const unsub = subscribeToAllOrdersFromFirestore((firestoreOrders) => {
      if (firestoreOrders && firestoreOrders.length > 0) {
        setOrders(firestoreOrders);
      }
    });
    return () => unsub();
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');

  // Expanded Table Rows for item-level details
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('Steadfast Courier');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [trackingUrlInput, setTrackingUrlInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Cancel & Refund Modal
  const [cancelRefundOrder, setCancelRefundOrder] = useState<Order | null>(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Copied indicator
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const toggleRowExpand = (orderId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      showToast(`Copied ${label}: ${text}`);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const processingOrders = orders.filter((o) => o.status === 'Processing' || o.status === 'Confirmed').length;
  const shippedOrders = orders.filter((o) => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      // 2. Payment Method Filter
      if (paymentMethodFilter !== 'All') {
        const pm = (order.paymentMethod || '').toLowerCase();
        if (paymentMethodFilter === 'cod' && !pm.includes('cod')) return false;
        if (paymentMethodFilter === 'bkash' && !pm.includes('bkash')) return false;
        if (paymentMethodFilter === 'nagad' && !pm.includes('nagad')) return false;
        if (paymentMethodFilter === 'card' && !pm.includes('card')) return false;
      }

      // 3. Payment Status Filter
      if (paymentStatusFilter !== 'All') {
        const orderPayStatus = order.paymentStatus || (order.paymentMethod === 'cod' ? 'Paid (COD on Delivery)' : 'Paid');
        if (paymentStatusFilter === 'paid') {
          if (!orderPayStatus.includes('Paid') && orderPayStatus !== 'Verified') return false;
        } else if (paymentStatusFilter === 'pending') {
          if (!orderPayStatus.includes('Pending')) return false;
        } else if (paymentStatusFilter === 'unpaid') {
          if (orderPayStatus.includes('Paid') || orderPayStatus === 'Verified') return false;
        }
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesName = (order.address?.fullName || order.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (order.address?.phone || order.customerPhone || '').toLowerCase().includes(q);
        const matchesEmail = (order.customerEmail || '').toLowerCase().includes(q);
        const matchesAddress = (order.address?.fullAddress || '').toLowerCase().includes(q);
        const matchesTrx = order.trxId ? order.trxId.toLowerCase().includes(q) : false;
        const matchesItems = order.items.some((item) =>
          item.product.title.toLowerCase().includes(q)
        );

        if (!matchesId && !matchesName && !matchesPhone && !matchesEmail && !matchesAddress && !matchesTrx && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, paymentMethodFilter, paymentStatusFilter, searchQuery]);

  // Handle Order Status Change from Dropdown
  const handleStatusChange = (order: Order, newStatus: Order['status']) => {
    if (newStatus === 'Shipped' && (!order.courierName || !order.trackingNumber)) {
      // Trigger Courier Assignment Modal
      handleOpenTrackingModal(order);
      return;
    }

    if (newStatus === 'Cancelled') {
      if (order.walletDeducted && order.walletDeducted > 0) {
        // Open cancel & refund dialog
        setCancelRefundOrder(order);
        return;
      }
    }

    // Direct status update in Firestore & local state
    onUpdateOrderStatus(order.id, newStatus);
    updateOrderStatusInFirestore(order.id, newStatus).catch(() => {});
    showToast(`✓ Order ${order.id} status set to ${newStatus}`);
  };

  // Open Tracking & Courier Modal
  const handleOpenTrackingModal = (order: Order) => {
    setTrackingModalOrder(order);
    setCourierNameInput(order.courierName || 'Steadfast Courier');
    const autoCode = order.trackingNumber || `STDF-${order.id.replace(/\D/g, '') || Math.floor(10000 + Math.random() * 90000)}`;
    setTrackingNumberInput(autoCode);
    setTrackingUrlInput(
      (order as any).trackingUrl ||
      `https://steadfast.com.bd/t/${autoCode}`
    );
    setNotesInput(order.trackingNotes || '');
  };

  // Save Courier & Tracking Details
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalOrder) return;

    const courier = courierNameInput.trim();
    const trackingNo = trackingNumberInput.trim();
    const trackingUrl = trackingUrlInput.trim();
    const notes = notesInput.trim();

    if (onUpdateOrderTracking) {
      onUpdateOrderTracking(trackingModalOrder.id, courier, trackingNo, trackingUrl, notes);
    }
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(trackingModalOrder.id, 'Shipped');
    }

    await updateOrderCourierTrackingInFirestore(
      trackingModalOrder.id,
      courier,
      trackingNo,
      trackingUrl,
      notes
    );

    showToast(`✓ Order ${trackingModalOrder.id} dispatched via ${courier} (${trackingNo})!`);
    setTrackingModalOrder(null);
  };

  // Quick Payment Status Change
  const handleQuickPaymentStatusChange = async (orderId: string, newPayStatus: Order['paymentStatus']) => {
    if (onUpdateOrderPaymentStatus) {
      onUpdateOrderPaymentStatus(orderId, newPayStatus);
    }
    await updateOrderPaymentStatusInFirestore(orderId, newPayStatus);
    showToast(`✓ Order payment marked as ${newPayStatus}`);
  };

  // Handle Cancel & Wallet Refund
  const handleExecuteCancelAndRefund = async () => {
    if (!cancelRefundOrder) return;
    setIsProcessingRefund(true);

    try {
      // 1. Mark Order as Cancelled in Firestore
      onUpdateOrderStatus(cancelRefundOrder.id, 'Cancelled');
      await updateOrderStatusInFirestore(cancelRefundOrder.id, 'Cancelled');

      // 2. Refund wallet if used
      if (cancelRefundOrder.walletDeducted && cancelRefundOrder.walletDeducted > 0 && cancelRefundOrder.userId) {
        await refundUserWalletInFirestore(
          cancelRefundOrder.userId,
          cancelRefundOrder.walletDeducted,
          cancelRefundOrder.id,
          cancelRefundOrder.customerEmail
        );
        showToast(
          `✓ Order ${cancelRefundOrder.id} Cancelled & ৳${cancelRefundOrder.walletDeducted} refunded to customer's wallet!`
        );
      } else {
        showToast(`✓ Order ${cancelRefundOrder.id} marked as Cancelled.`);
      }
    } catch (e: any) {
      showToast(`❌ Error cancelling order: ${e.message || e}`);
    } finally {
      setIsProcessingRefund(false);
      setCancelRefundOrder(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* ================= 1. HEADER & KPI CARDS ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xl font-black text-[#0A1B3D]">
                Customer Order Processing & Dispatch Ledger
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {orders.length} Total Orders in Firestore
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live Firestore order fulfillment, courier assignments (Steadfast, Pathao, RedX), wallet refunds, and printable tax invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Volume: <strong className="text-base font-black text-[#007BFF]">৳{totalRevenue.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Phone, Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="bkash">bKash Mobile Wallet</option>
              <option value="nagad">Nagad Mobile Wallet</option>
              <option value="card">Online Debit/Credit Card</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#007BFF] focus:bg-white transition-all cursor-pointer"
            >
              <option value="All">All Payment Statuses</option>
              <option value="paid">Paid / Verified</option>
              <option value="pending">Pending Verification</option>
              <option value="unpaid">Unpaid / Incomplete</option>
            </select>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold">
            <span className="text-amber-700">Pending: {pendingOrders}</span>
            <span className="text-slate-300">|</span>
            <span className="text-[#007BFF]">Shipped: {shippedOrders}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700">Delivered: {deliveredOrders}</span>
          </div>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-100 pb-1 text-xs scrollbar-none">
          <span className="font-bold text-slate-400 mr-1 shrink-0">Stage Filter:</span>
          {[
            { key: 'All', label: 'All Orders', count: orders.length },
            { key: 'Pending', label: 'Pending', count: pendingOrders },
            { key: 'Confirmed', label: 'Confirmed', count: orders.filter((o) => o.status === 'Confirmed').length },
            { key: 'Processing', label: 'Processing', count: orders.filter((o) => o.status === 'Processing').length },
            { key: 'Shipped', label: 'Shipped', count: shippedOrders },
            { key: 'Delivered', label: 'Delivered', count: deliveredOrders },
            { key: 'Cancelled', label: 'Cancelled', count: cancelledOrders },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. ORGANIZED FILTERABLE TABLE VIEW ================= */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Orders Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No incoming orders matched your filters or search criteria.
          </p>
          {(searchQuery || statusFilter !== 'All' || paymentMethodFilter !== 'All' || paymentStatusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setPaymentMethodFilter('All');
                setPaymentStatusFilter('All');
              }}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer & Photo</th>
                  <th className="py-3.5 px-4">Contact & WhatsApp</th>
                  <th className="py-3.5 px-4">Items Bought</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isExpanded = Boolean(expandedRows[order.id]);
                  const totalItemsQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  const paymentStatusLabel =
                    order.paymentStatus || (order.paymentMethod === 'cod' ? 'Paid (COD on Delivery)' : 'Verified');

                  const isPaid = paymentStatusLabel.includes('Paid') || paymentStatusLabel === 'Verified';

                  const customerName = order.address?.fullName || order.customerName || 'Kroyghor Member';
                  const rawPhone = order.address?.phone || order.customerPhone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  const formattedWhatsAppNumber = cleanPhone.startsWith('880') 
                    ? cleanPhone 
                    : cleanPhone.startsWith('0') 
                      ? `88${cleanPhone}` 
                      : `880${cleanPhone}`;

                  const customerAvatar = (order as any).customerAvatar || (order as any).userAvatar || null;

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main Table Row */}
                      <tr className="hover:bg-blue-50/20 transition-colors">
                        {/* 1. Order ID & Date/Time */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-[#007BFF]">
                              {order.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.id, 'Order ID')}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy Order ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{order.date}</span>
                            {order.time && <span>• {order.time}</span>}
                          </div>
                          {order.courierName && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                🚚 {order.courierName}
                              </span>
                              {order.trackingNumber && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  #{order.trackingNumber}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 2. Customer Name & Profile Photo */}
                        <td className="py-3.5 px-4 align-top max-w-[190px]">
                          <div className="flex items-center gap-2.5">
                            {customerAvatar ? (
                              <img
                                src={customerAvatar}
                                alt={customerName}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                {customerName ? customerName.slice(0, 2).toUpperCase() : 'KG'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-extrabold text-[#0A1B3D] truncate" title={customerName}>
                                {customerName}
                              </div>
                              {order.customerEmail ? (
                                <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={order.customerEmail}>
                                  {order.customerEmail}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Verified Member</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Phone Number & WhatsApp Number */}
                        <td className="py-3.5 px-4 align-top max-w-[170px]">
                          <div className="space-y-1.5">
                            {/* Phone Call Link */}
                            {rawPhone ? (
                              <a
                                href={`tel:${rawPhone}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-[11px] transition-colors"
                                title="Click to Call Phone"
                              >
                                <Phone className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>{rawPhone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No phone</span>
                            )}

                            {/* Direct WhatsApp Chat Action */}
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${formattedWhatsAppNumber}?text=Hello%20${encodeURIComponent(customerName)}%2C%20thank%20you%20for%20your%20Kroyghor%20Order%20${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] transition-all shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-[#25D366] shrink-0 fill-[#25D366]/20" />
                                <span>WhatsApp Chat</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 4. Items Bought (with thumbnails) */}
                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span>{order.items.length} item{order.items.length > 1 ? 's' : ''} ({totalItemsQty} pcs)</span>
                          </div>
                          <div className="space-y-1.5">
                            {order.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                {it.product.image && (
                                  <img
                                    src={it.product.image}
                                    alt={it.product.title}
                                    width={28}
                                    height={28}
                                    className="w-7 h-7 rounded-md object-cover bg-white border border-slate-200 shrink-0"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="truncate block font-semibold" title={it.product.title}>
                                    {it.quantity}x {it.product.title}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-500">
                                    ৳{(it.product.price * it.quantity).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[10px] text-[#007BFF] font-semibold block px-1">
                                +{order.items.length - 2} more product(s)...
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(order.id)}
                            className="mt-1 text-[10px] text-[#007BFF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Items' : 'View All Items'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* 5. Total Amount & Payment */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono text-sm font-black text-[#0A1B3D]">
                            ৳{order.total.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Subtotal: ৳{order.subtotal.toLocaleString()} + Del: ৳{order.deliveryFee.toLocaleString()}
                          </div>
                          {order.walletDeducted > 0 && (
                            <div className="mt-0.5 text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              <span>-৳{order.walletDeducted} Wallet Discount</span>
                            </div>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {order.paymentMethod}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </div>
                          {order.trxId && (
                            <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                              <span>TrxID:</span>
                              <span className="font-bold text-slate-700">{order.trxId}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(order.trxId || '', 'TrxID')}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 6. Delivery Address */}
                        <td className="py-3.5 px-4 align-top max-w-[200px]">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#007BFF] border border-blue-200 mb-1">
                            {order.address?.cityDivision || 'Inside Dhaka'}
                          </span>
                          <div className="flex items-start gap-1 text-[11px] text-slate-600 leading-snug" title={order.address?.fullAddress}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-3">
                              {order.address?.fullAddress || 'No full address provided'}
                            </span>
                          </div>
                        </td>

                        {/* 5. Order Status Lifecycle Dropdown */}
                        <td className="py-3.5 px-4 align-top">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as any)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none transition-all shadow-2xs ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : order.status === 'Shipped'
                                ? 'bg-indigo-50 border-indigo-300 text-[#007BFF]'
                                : order.status === 'Processing' || order.status === 'Confirmed'
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped (Assign Courier)</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {order.trackingNotes && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500" title={order.trackingNotes}>
                              <StickyNote className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[130px] italic">{order.trackingNotes}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3.5 px-4 align-top text-right pr-4 space-y-1.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Courier / Tracking Assignment Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenTrackingModal(order)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Assign Courier Partner & Tracking Number"
                            >
                              <Truck className="w-3.5 h-3.5 text-[#007BFF]" />
                              <span>Courier</span>
                            </button>

                            {/* Print Invoice / Shipping Label Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForInvoice(order)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Print Official Invoice & Shipping Label"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print</span>
                            </button>

                            {/* Cancel & Refund Button (if order not already cancelled) */}
                            {order.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => setCancelRefundOrder(order)}
                                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                title="Cancel Order & Refund Wallet"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Item Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={6} className="p-4 pl-8">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <h5 className="font-extrabold text-xs text-[#0A1B3D] flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-[#007BFF]" />
                                <span>Complete Itemized Breakdown ({order.items.length} items)</span>
                              </h5>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                                  >
                                    <img
                                      src={item.product.image}
                                      alt={item.product.title}
                                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800';
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h6 className="font-bold text-xs text-slate-800 truncate" title={item.product.title}>
                                        {item.product.title}
                                      </h6>
                                      <p className="text-[10px] text-slate-400">
                                        Qty: <strong className="text-slate-700">{item.quantity}</strong> • Unit: ৳{item.product.price.toLocaleString()}
                                      </p>
                                      {item.selectedSize && (
                                        <span className="text-[9px] bg-white px-1 rounded border border-slate-200 text-slate-600">
                                          Size: {item.selectedSize}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono font-bold text-xs text-[#007BFF]">
                                      ৳{(item.product.price * item.quantity).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Order Footnotes / Delivery Notes */}
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                                <div>
                                  <span>Courier: <strong>{order.courierName || 'Pending Hub Assignment'}</strong></span>
                                  {order.trackingNumber && (
                                    <span> (Tracking: <code className="font-bold text-slate-700">{order.trackingNumber}</code>)</span>
                                  )}
                                  {(order as any).trackingUrl && (
                                    <a
                                      href={(order as any).trackingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-[#007BFF] hover:underline inline-flex items-center gap-0.5"
                                    >
                                      <span>Track URL</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <div>
                                  <span>Full Address: <strong>{order.address?.fullAddress}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. COURIER ASSIGNMENT & TRACKING MODAL ================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#0A1B3D]">
                    Courier Partner & Tracking: {trackingModalOrder.id}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Customer: {trackingModalOrder.address?.fullName} ({trackingModalOrder.address?.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Courier Partner Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={courierNameInput}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCourierNameInput(c);
                    if (c.includes('Steadfast')) {
                      setTrackingUrlInput(`https://steadfast.com.bd/t/${trackingNumberInput}`);
                    } else if (c.includes('Pathao')) {
                      setTrackingUrlInput(`https://pathao.com/courier/tracking/?consignment_id=${trackingNumberInput}`);
                    } else if (c.includes('RedX')) {
                      setTrackingUrlInput(`https://redx.com.bd/track/${trackingNumberInput}`);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="Steadfast Courier">Steadfast Courier (Nationwide COD & Fast Track)</option>
                  <option value="Pathao Courier">Pathao Courier (Express Delivery)</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Paperfly Courier">Paperfly Smart Logistics</option>
                  <option value="Sundarban Courier">Sundarban Courier Service</option>
                  <option value="eCourier">eCourier Bangladesh</option>
                  <option value="Kroyghor Rider (Dhaka)">Kroyghor Dedicated Rider</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Courier Tracking Code / Consignment ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STDF-89127391"
                  value={trackingNumberInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTrackingNumberInput(val);
                    if (courierNameInput.includes('Steadfast')) {
                      setTrackingUrlInput(`https://steadfast.com.bd/t/${val}`);
                    } else if (courierNameInput.includes('Pathao')) {
                      setTrackingUrlInput(`https://pathao.com/courier/tracking/?consignment_id=${val}`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Live Tracking URL Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://steadfast.com.bd/t/STDF-89127391"
                  value={trackingUrlInput}
                  onChange={(e) => setTrackingUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Internal Dispatch / Rider Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over to courier hub at 2:00 PM; delivery expected tomorrow."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTrackingModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Assign & Mark as Shipped</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. CANCEL & WALLET REFUND MODAL ================= */}
      {cancelRefundOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-[#0A1B3D]">
                Cancel Order {cancelRefundOrder.id}?
              </h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to cancel this order?
              </p>

              {cancelRefundOrder.walletDeducted > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-left text-xs space-y-1 mt-3">
                  <div className="flex items-center gap-2 text-indigo-900 font-extrabold">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    <span>Wallet Balance Refund Notice</span>
                  </div>
                  <p className="text-indigo-700 text-[11px] leading-relaxed">
                    Customer used <strong className="font-mono">৳{cancelRefundOrder.walletDeducted}</strong> digital wallet credit on this order.
                    Confirming cancellation will automatically refund <strong className="font-mono">৳{cancelRefundOrder.walletDeducted}</strong> back to their digital wallet in Firestore and log a CREDIT entry in <code className="font-mono">wallet_transactions</code>.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCancelRefundOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                No, Keep Order
              </button>

              <button
                type="button"
                disabled={isProcessingRefund}
                onClick={handleExecuteCancelAndRefund}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                {isProcessingRefund ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>
                      {cancelRefundOrder.walletDeducted > 0
                        ? `Cancel & Refund ৳${cancelRefundOrder.walletDeducted}`
                        : 'Confirm Cancellation'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. TAX INVOICE & SHIPPING LABEL MODAL ================= */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedOrderForInvoice)}
          onClose={() => setSelectedOrderForInvoice(null)}
          order={selectedOrderForInvoice}
        />
      )}
    </div>
  );
};
