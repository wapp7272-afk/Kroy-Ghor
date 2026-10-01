import React, { useState, useMemo } from 'react';
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
  Edit2
} from 'lucide-react';
import { Order } from '../../types';
import { InvoiceModal } from '../InvoiceModal';

export interface AdminOrdersManagerProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrderPaymentStatus?: (orderId: string, newPaymentStatus: Order['paymentStatus']) => void;
  onUpdateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string) => void;
  onUpdateOrderNotes?: (orderId: string, notes: string) => void;
  showToast: (msg: string) => void;
}

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdateOrderPaymentStatus,
  onUpdateOrderTracking,
  onUpdateOrderNotes,
  showToast,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');

  // Expanded Table Rows for item-level details
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Modals
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isPackingSlipMode, setIsPackingSlipMode] = useState(false);
  const [trackingNotesOrder, setTrackingNotesOrder] = useState<Order | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('Pathao Courier');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

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
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }

      // 2. Payment Method Filter
      if (paymentMethodFilter !== 'All') {
        if (paymentMethodFilter === 'cod' && order.paymentMethod !== 'cod') return false;
        if (paymentMethodFilter === 'bkash' && order.paymentMethod !== 'bkash') return false;
        if (paymentMethodFilter === 'nagad' && order.paymentMethod !== 'nagad') return false;
        if (paymentMethodFilter === 'card' && order.paymentMethod !== 'card') return false;
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
        const matchesName = order.address.fullName.toLowerCase().includes(q);
        const matchesPhone = order.address.phone.toLowerCase().includes(q);
        const matchesEmail = (order.customerEmail || '').toLowerCase().includes(q);
        const matchesAddress = order.address.fullAddress.toLowerCase().includes(q);
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

  // Open Tracking Notes Modal
  const handleOpenTrackingNotes = (order: Order) => {
    setTrackingNotesOrder(order);
    setCourierNameInput(order.courierName || 'Pathao Courier');
    setTrackingNumberInput(order.trackingNumber || `ZBD-${order.id.replace(/\D/g, '') || '9182'}`);
    setNotesInput(order.trackingNotes || '');
  };

  // Save Tracking Notes
  const handleSaveTrackingNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNotesOrder) return;

    if (onUpdateOrderTracking) {
      onUpdateOrderTracking(trackingNotesOrder.id, courierNameInput.trim(), trackingNumberInput.trim());
    }

    if (onUpdateOrderNotes) {
      onUpdateOrderNotes(trackingNotesOrder.id, notesInput.trim());
    } else {
      // Direct update in order object if available
      trackingNotesOrder.trackingNotes = notesInput.trim();
    }

    showToast(`✓ Tracking notes updated for order ${trackingNotesOrder.id}`);
    setTrackingNotesOrder(null);
  };

  // Quick Payment Status Change
  const handleQuickPaymentStatusChange = (orderId: string, newPayStatus: Order['paymentStatus']) => {
    if (onUpdateOrderPaymentStatus) {
      onUpdateOrderPaymentStatus(orderId, newPayStatus);
      showToast(`✓ Order payment marked as ${newPayStatus}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* ================= 1. HEADER & KPI CARDS (Light Theme) ================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xl font-black text-[#0A1B3D]">
                Customer Order Processing & Dispatch Ledger
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {orders.length} Total Orders
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Filter incoming orders, manage fulfillment stages, verify bKash/Nagad transactions, and print official invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Volume: <strong className="text-base font-black text-[#007BFF]">৳{totalRevenue.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
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
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
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

          {/* Status Counter Buttons */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Pending:</span>
            <span className="font-bold font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
              {pendingOrders}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Delivered:</span>
            <span className="font-bold font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
              {deliveredOrders}
            </span>
          </div>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-100 pb-1 text-xs">
          <span className="font-bold text-slate-400 mr-1 shrink-0">Stage:</span>
          {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => {
            const count = st === 'All' ? orders.length : orders.filter((o) => o.status === st).length;
            const isActive = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#007BFF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. ORGANIZED FILTERABLE TABLE VIEW ================= */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3 shadow-xs">
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Purchased Items</th>
                  <th className="py-3.5 px-4">Amount & Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isExpanded = Boolean(expandedRows[order.id]);
                  const totalItemsQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

                  const paymentStatusLabel =
                    order.paymentStatus || (order.paymentMethod === 'cod' ? 'Paid (COD on Delivery)' : 'Verified');

                  const isPaid = paymentStatusLabel.includes('Paid') || paymentStatusLabel === 'Verified';

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main Table Row */}
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        {/* 1. Order ID & Date/Time */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#007BFF]">
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
                            <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {order.courierName}
                            </span>
                          )}
                        </td>

                        {/* 2. Customer Info */}
                        <td className="py-3.5 px-4 align-top max-w-[220px]">
                          <div className="font-bold text-slate-900 truncate">
                            {order.address.fullName || 'Customer'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a href={`tel:${order.address.phone}`} className="hover:underline">
                              {order.address.phone}
                            </a>
                          </div>
                          {order.customerEmail && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{order.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-1 text-[10px] text-slate-500 mt-1 line-clamp-2" title={order.address.fullAddress}>
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              {order.address.cityDivision}: {order.address.fullAddress}
                            </span>
                          </div>
                        </td>

                        {/* 3. Items Summary */}
                        <td className="py-3.5 px-4 align-top max-w-[240px]">
                          <div className="font-bold text-slate-800">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} ({totalItemsQty} total pcs)
                          </div>
                          <div className="mt-1 space-y-1">
                            {order.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                                <span className="truncate max-w-[170px]" title={it.product.title}>
                                  {it.quantity}x {it.product.title}
                                </span>
                                <span className="font-mono text-slate-400">
                                  ৳{(it.product.price * it.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[10px] text-[#007BFF] font-semibold block">
                                +{order.items.length - 2} more item(s)...
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(order.id)}
                            className="mt-1.5 text-[10px] text-[#007BFF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Items' : 'View Item Breakdown'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* 4. Payment Details */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono text-sm font-black text-[#0A1B3D]">
                            ৳{order.total.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Subtotal: ৳{order.subtotal.toLocaleString()} + Del: ৳{order.deliveryFee.toLocaleString()}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {order.paymentMethod}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
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

                        {/* 5. Status Selector */}
                        <td className="py-3.5 px-4 align-top">
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none transition-all shadow-2xs ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : order.status === 'Shipped'
                                ? 'bg-indigo-50 border-indigo-300 text-[#007BFF]'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready for Pickup">Ready for Pickup</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          {order.trackingNotes && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500" title={order.trackingNotes}>
                              <StickyNote className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate max-w-[130px] italic">{order.trackingNotes}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. Action Buttons */}
                        <td className="py-3.5 px-4 align-top text-right space-y-1.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Notes / Tracking Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenTrackingNotes(order)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                              title="Add Tracking Notes or Courier details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Print / Tax Invoice Memo Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsPackingSlipMode(false);
                                setSelectedOrderForInvoice(order);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Print Tax Invoice / Money Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#007BFF]" />
                              <span>Invoice</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Item Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={6} className="p-4 pl-8">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <h5 className="font-bold text-xs text-[#0A1B3D] flex items-center gap-1.5">
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
                                  {order.trackingNumber && <span> (Tracking: <code className="font-bold text-slate-700">{order.trackingNumber}</code>)</span>}
                                </div>
                                <div>
                                  <span>Full Address: <strong>{order.address.fullAddress}</strong></span>
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

      {/* ================= 3. TRACKING & DISPATCH NOTES MODAL ================= */}
      {trackingNotesOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#0A1B3D]">
                    Courier & Tracking Details: {trackingNotesOrder.id}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Customer: {trackingNotesOrder.address.fullName} ({trackingNotesOrder.address.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingNotesOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrackingNotes} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assigned Courier Partner
                </label>
                <select
                  value={courierNameInput}
                  onChange={(e) => setCourierNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#007BFF]"
                >
                  <option value="Pathao Courier">Pathao Courier (Express Delivery)</option>
                  <option value="Steadfast Courier">Steadfast Courier (Nationwide COD)</option>
                  <option value="RedX Logistics">RedX Logistics</option>
                  <option value="Sundarban Courier">Sundarban Courier Service</option>
                  <option value="eCourier">eCourier Bangladesh</option>
                  <option value="Internal Rider (Dhaka)">ZeropicBD Dedicated Rider</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Courier Consignment / Tracking Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PTH-89127391"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Internal Admin Dispatch Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer for delivery confirmation; dispatch scheduled for afternoon slot."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTrackingNotesOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Dispatch Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 4. TAX INVOICE & MONEY RECEIPT MODAL ================= */}
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
