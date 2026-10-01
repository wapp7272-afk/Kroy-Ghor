import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  Store, 
  RefreshCw,
  MessageCircle,
  Navigation,
  Sparkles,
  ShoppingBag,
  Bike
} from 'lucide-react';
import { Order, UserProfile, Product } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { BrandLogo } from './BrandLogo';
import { fetchLiveCourierTracking } from '../services/courierLogisticsService';

export interface OrderTrackingPortalProps {
  orders: Order[];
  user: UserProfile;
  initialOrderId?: string | null;
  onBackToShop: () => void;
  onViewProduct?: (product: Product) => void;
  onOpenSupport?: () => void;
  onOpenOrders?: () => void;
}

export const OrderTrackingPortal: React.FC<OrderTrackingPortalProps> = ({
  orders,
  user,
  initialOrderId,
  onBackToShop,
  onViewProduct,
  onOpenSupport,
  onOpenOrders,
}) => {
  const [searchInput, setSearchInput] = useState<string>(initialOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isSimulatingLiveScan, setIsSimulatingLiveScan] = useState<boolean>(false);
  const [simulatedEtaMinutes, setSimulatedEtaMinutes] = useState<number>(38);

  // Initialize or update selected order
  useEffect(() => {
    if (initialOrderId) {
      const match = orders.find((o) => o.id.toLowerCase() === initialOrderId.toLowerCase());
      if (match) {
        setSelectedOrder(match);
        setSearchInput(match.id);
        return;
      }
    }

    if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0]);
      setSearchInput(orders[0].id);
    }
  }, [initialOrderId, orders]);

  // Handle Search Submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    // Search by Order ID or Customer Phone
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        o.id.toLowerCase().replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
        (o.address.phone && o.address.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase() === query)
    );

    if (found) {
      setSelectedOrder(found);
    } else {
      setSelectedOrder(null);
    }
  };

  const handleCopy = (text: string, type: 'tracking' | 'orderId') => {
    navigator.clipboard.writeText(text);
    if (type === 'tracking') {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    } else {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleSimulateScan = () => {
    setIsSimulatingLiveScan(true);
    if (selectedOrder) {
      fetchLiveCourierTracking(selectedOrder)
        .then((live) => {
          setTimeout(() => {
            setIsSimulatingLiveScan(false);
            setSimulatedEtaMinutes(live.etaMinutes > 0 ? live.etaMinutes : 18);
          }, 800);
        })
        .catch(() => {
          setIsSimulatingLiveScan(false);
        });
    } else {
      setTimeout(() => {
        setIsSimulatingLiveScan(false);
        setSimulatedEtaMinutes((prev) => Math.max(12, prev - 6));
      }, 800);
    }
  };

  // Determine Milestones and Active Progress
  const trackingSteps = useMemo(() => {
    if (!selectedOrder) return [];

    const orderDate = selectedOrder.date || '2026-09-28 14:30';
    const isDhaka = selectedOrder.address.cityDivision === 'Inside Dhaka';
    const courier = selectedOrder.courierName || (isDhaka ? 'Pathao Express' : 'Steadfast Courier');
    const trackingCode = selectedOrder.trackingNumber || `PVZ-TRK-${selectedOrder.id.replace(/\D/g, '') || '918'}`;

    const steps = [
      {
        id: 'placed',
        title: 'Order Placed & Verified',
        desc: `Order received and logged in ZeropicBD platform ledger.`,
        date: orderDate,
        completed: true,
        current: false,
      },
      {
        id: 'confirmed',
        title: selectedOrder.paymentMethod === 'cod' ? 'COD Booking Confirmed' : 'Digital Payment Verified',
        desc: selectedOrder.trxId 
          ? `Verified TrxID: ${selectedOrder.trxId} via ${selectedOrder.paymentMethod.toUpperCase()}`
          : 'Cash on delivery verified with recipient contact number.',
        date: 'Within 20 mins of order',
        completed: true,
        current: false,
      },
      {
        id: 'processing',
        title: 'Quality Checked & Packed by Merchant',
        desc: `Sealed in tamper-evident bubble wrap with authentic hologram seal.`,
        date: 'Same Day Dispatch Hub',
        completed: selectedOrder.status !== 'Pending',
        current: selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing',
      },
      {
        id: 'dispatched',
        title: `Handed over to ${courier}`,
        desc: `Consignment ID: ${trackingCode}. In transit to Regional Sorting Center.`,
        date: isDhaka ? 'Tejgaon Central Hub' : 'Agrabad Logistics Center',
        completed: selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered',
        current: selectedOrder.status === 'Shipped',
      },
      {
        id: 'out_for_delivery',
        title: 'Out for Delivery with Courier Rider',
        desc: `Rider assigned with express delivery bag. Recipient will receive OTP call.`,
        date: selectedOrder.status === 'Delivered' ? 'Completed Today' : 'Today, Live Route Active',
        completed: selectedOrder.status === 'Delivered',
        current: selectedOrder.status === 'Shipped',
      },
      {
        id: 'delivered',
        title: 'Successfully Delivered & Signed',
        desc: `Handed to ${selectedOrder.address.fullName || 'Recipient'} at delivery address.`,
        date: selectedOrder.status === 'Delivered' ? orderDate : 'Estimated in 24-48 Hours',
        completed: selectedOrder.status === 'Delivered',
        current: false,
      },
    ];

    return steps;
  }, [selectedOrder]);

  const activeCourier = selectedOrder?.courierName || (selectedOrder?.address.cityDivision === 'Inside Dhaka' ? 'Pathao Express' : 'Steadfast Courier');
  const activeTrackingCode = selectedOrder?.trackingNumber || (selectedOrder ? `PT-${selectedOrder.id.replace(/\D/g, '')}BD` : 'PT-91823BD');

  // Simulated Rider Information
  const simulatedRider = {
    name: 'Md. Saiful Islam',
    phone: '01883-418309',
    bikeNumber: 'Dhaka Metro-Ha 38-9120',
    hubName: selectedOrder?.address.cityDivision === 'Inside Dhaka' ? 'Tejgaon Express Hub' : 'Agrabad Sorting Terminal',
    rating: 4.95,
    deliveriesToday: 24,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ================= 1. Top Header & Navigation ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToShop}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#4F46E5] hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer"
              aria-label="Back to store catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Live Parcel Tracker
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                  Real-Time GPS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track order journey across Pathao, Steadfast, and RedX logistics hubs nationwide.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenOrders && (
              <button
                onClick={onOpenOrders}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>My Orders ({orders.length})</span>
              </button>
            )}
            <button
              onClick={handleSimulateScan}
              disabled={isSimulatingLiveScan || !selectedOrder}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Ping courier hub API for real-time status update"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSimulatingLiveScan ? 'animate-spin' : ''}`} />
              <span>{isSimulatingLiveScan ? 'Checking Hub...' : 'Live GPS Refresh'}</span>
            </button>
          </div>
        </div>

        {/* ================= 2. Search & Filter Bar ================= */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order ID (e.g. PVZ-91823) or Mobile Number (e.g. 01712345678)..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none transition-all placeholder:text-slate-400 text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Track Parcel</span>
            </button>
          </form>

          {/* Quick Order Selection Chips */}
          {orders.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Your Recent Orders:</span>
              </span>
              {orders.map((o) => {
                const isCurrent = selectedOrder?.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrder(o);
                      setSearchInput(o.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono font-medium transition-all shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50 border-[#4F46E5] text-[#4F46E5] font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    #{o.id} • ৳{o.total.toLocaleString()}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= 3. Active Order Details & Stepper ================= */}
        {selectedOrder ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Columns: Live Progress Timeline & Map Simulation */}
            <div className="lg:col-span-2 space-y-6">

              {/* Status Header Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order ID:</span>
                      <span className="text-lg font-black font-mono text-slate-900">#{selectedOrder.id}</span>
                      <button
                        onClick={() => handleCopy(selectedOrder.id, 'orderId')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy Order ID"
                      >
                        {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Placed on {selectedOrder.date} • {selectedOrder.items.length} items
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.status === 'Shipped'
                        ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current" />
                      <span>{selectedOrder.status === 'Shipped' ? 'In Transit / Out for Delivery' : selectedOrder.status}</span>
                    </span>

                    <button
                      onClick={() => setIsInvoiceOpen(true)}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
                      <span>VAT Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Animated Interactive SVG Route Map Simulation */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-4 text-white">
                  <div className="flex items-center justify-between text-xs mb-3 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="font-bold text-white">Live Courier Transit Vector</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedOrder.status === 'Delivered' ? 'Destination Reached' : `ETA: ~${simulatedEtaMinutes} Minutes`}
                    </span>
                  </div>

                  {/* SVG Route Visualization */}
                  <div className="relative w-full h-24 sm:h-28 flex items-center justify-between px-4 sm:px-8">
                    {/* Background Route Path Line */}
                    <div className="absolute inset-x-8 sm:inset-x-12 top-1/2 -translate-y-1/2 h-1.5 bg-slate-700/80 rounded-full" />
                    
                    {/* Progress Colored Track */}
                    <div 
                      className="absolute left-8 sm:left-12 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-500 via-[#4F46E5] to-amber-400 rounded-full transition-all duration-700" 
                      style={{
                        width: selectedOrder.status === 'Delivered' ? 'calc(100% - 64px)' : '65%'
                      }}
                    />

                    {/* Point 1: Merchant Hub */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
                        <Store className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1">Merchant Hub</span>
                      <span className="text-[9px] text-slate-500">Dhaka Central</span>
                    </div>

                    {/* Point 2: Courier Sorting Center */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1">Sorting Hub</span>
                      <span className="text-[9px] text-slate-500">{activeCourier}</span>
                    </div>

                    {/* Point 3: Live Delivery Van / Bike */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${
                        selectedOrder.status === 'Delivered' ? 'bg-emerald-600' : 'bg-amber-500 animate-bounce'
                      }`}>
                        {selectedOrder.status === 'Delivered' ? (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                          <Bike className="w-5 h-5 text-slate-950" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 mt-1">
                        {selectedOrder.status === 'Delivered' ? 'Delivered' : 'On Bike'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {selectedOrder.status === 'Delivered' ? 'Signed' : 'Rider En-Route'}
                      </span>
                    </div>

                    {/* Point 4: Destination Address */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1">Recipient</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
                        {selectedOrder.address.cityDivision}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Assigned Dispatcher: <strong>{activeCourier}</strong></span>
                    <span>Consignment: <strong className="font-mono text-white">{activeTrackingCode}</strong></span>
                  </div>
                </div>

                {/* Milestone Stepper Timeline */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#4F46E5]" />
                    <span>Tracking Milestones & Timeline</span>
                  </h3>

                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {trackingSteps.map((step, idx) => (
                      <div key={step.id} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                          step.completed
                            ? 'bg-emerald-600 border-white text-white shadow-xs'
                            : step.current
                            ? 'bg-amber-500 border-white text-white shadow-xs ring-4 ring-amber-100 animate-pulse'
                            : 'bg-white border-slate-300 text-slate-300'
                        }`}>
                          {step.completed ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 transition-all hover:bg-slate-100/60">
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                            <h4 className={`text-xs sm:text-sm font-bold ${
                              step.completed ? 'text-slate-900' : step.current ? 'text-amber-900 font-extrabold' : 'text-slate-500'
                            }`}>
                              {step.title}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              {step.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Contents Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#4F46E5]" />
                  <span>Parcel Items ({selectedOrder.items.length})</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="min-w-0">
                          <h4 
                            onClick={() => onViewProduct && onViewProduct(item.product)}
                            className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-[#4F46E5] transition-colors cursor-pointer"
                          >
                            {item.product.title}
                          </h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Qty: {item.quantity}</span>
                            {item.selectedSize && <span>• Size: {item.selectedSize}</span>}
                            <span>• Sold by {item.storeName || item.product.storeName || 'ZeropicBD Official'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ৳{item.product.price.toLocaleString()} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Courier & Rider Info, Shipping Address, Payment Breakdown */}
            <div className="space-y-6">

              {/* Courier Partner & Assigned Rider Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#4F46E5]" />
                    <span className="text-sm font-bold text-slate-900">Courier Logistics</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Express Dispatch
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Courier Partner:</span>
                    <span className="font-bold text-slate-900">{activeCourier}</span>
                  </div>
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-slate-500">Tracking / CN:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-[#4F46E5]">{activeTrackingCode}</span>
                      <button
                        onClick={() => handleCopy(activeTrackingCode, 'tracking')}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                        title="Copy Tracking Number"
                      >
                        {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Transit Hub:</span>
                    <span className="font-medium text-slate-800">{simulatedRider.hubName}</span>
                  </div>
                </div>

                {/* Rider Info Widget */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      MS
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{simulatedRider.name}</span>
                        <span className="text-[10px] text-amber-700 font-bold">★ {simulatedRider.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Vehicle: {simulatedRider.bikeNumber}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${simulatedRider.phone}`}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Rider</span>
                    </a>
                    <a
                      href={`https://wa.me/8801883418309?text=Hello%20Rider%2C%20regarding%20ZeropicBD%20Order%20${selectedOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Contact Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-sm font-bold text-slate-900">Delivery Address</span>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="font-bold text-slate-900">{selectedOrder.address.fullName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedOrder.address.phone}</span>
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    {selectedOrder.address.fullAddress}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Division: <span className="text-[#4F46E5] font-semibold">{selectedOrder.address.cityDivision}</span>
                  </div>
                  {selectedOrder.address.notes && (
                    <div className="p-2 rounded bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                      Note: {selectedOrder.address.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-sm font-bold text-slate-900">Payment Breakdown</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">৳{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Coupon Discount:</span>
                      <span className="font-mono">-৳{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.walletDeducted > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>Wallet Bonus Applied:</span>
                      <span className="font-mono">-৳{selectedOrder.walletDeducted.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee:</span>
                    <span className="font-mono">৳{selectedOrder.deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#4F46E5]">৳{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="inline-block w-full text-center py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    Payment Method: {selectedOrder.paymentMethod.toUpperCase()} {selectedOrder.trxId ? `(TrxID: ${selectedOrder.trxId})` : '(COD)'}
                  </span>
                </div>
              </div>

              {/* Customer Support CTA */}
              {onOpenSupport && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#4F46E5]">Need Delivery Assistance?</h4>
                    <p className="text-[11px] text-slate-500">Our customer care desk is open 24/7.</p>
                  </div>
                  <button
                    onClick={onOpenSupport}
                    className="px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Help Desk
                  </button>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
            <div className="flex justify-center mb-1">
              <BrandLogo size="md" />
            </div>
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Order Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                We couldn't locate a consignment for "{searchInput}". Please double check your Order ID (e.g. ZBD-91823) or phone number.
              </p>
            </div>
            <button
              onClick={onBackToShop}
              className="px-5 py-2.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors cursor-pointer"
            >
              Browse Catalog
            </button>
          </div>
        )}

      </div>

      {/* VAT Invoice Modal */}
      {isInvoiceOpen && selectedOrder && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};
