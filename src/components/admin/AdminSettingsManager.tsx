import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Truck,
  Percent,
  Phone,
  Building,
  Save,
  CheckCircle2,
  RefreshCw,
  Shield,
  HelpCircle,
  Database,
  Trash2,
  AlertTriangle,
  Users,
  Package,
  ShoppingBag,
  Wallet,
  Sparkles,
  Lock,
  Unlock,
  Activity,
  Check
} from 'lucide-react';
import { SystemBannerSettings, UserProfile } from '../../types';
import { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from '../../services/authService';
import {
  fetchDatabaseMetrics,
  purgeDemoOrdersFromFirestore,
  purgeDemoProductsFromFirestore,
  resetTestWalletLedgerFromFirestore,
  DatabaseAuditMetrics
} from '../../services/maintenanceService';

interface AdminSettingsManagerProps {
  user?: UserProfile;
  commissionRate: number;
  onUpdateCommissionRate?: (rate: number) => void;
  bannerSettings?: SystemBannerSettings;
  onUpdateBannerSettings?: (settings: SystemBannerSettings) => void;
  showToast?: (msg: string) => void;
}

type PurgeActionType = 'orders' | 'products' | 'wallet' | null;

export const AdminSettingsManager: React.FC<AdminSettingsManagerProps> = ({
  user,
  commissionRate,
  onUpdateCommissionRate,
  bannerSettings,
  onUpdateBannerSettings,
  showToast = () => {},
}) => {
  // Store delivery settings
  const [rateInput, setRateInput] = useState(commissionRate.toString());
  const [helplineInput, setHelplineInput] = useState(bannerSettings?.helplineNumber || '01883-418309');
  const [insideDhakaFee, setInsideDhakaFee] = useState('60');
  const [outsideDhakaFee, setOutsideDhakaFee] = useState('120');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('2500');
  const [isSaving, setIsSaving] = useState(false);

  // Health Metrics State
  const [metrics, setMetrics] = useState<DatabaseAuditMetrics>({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalWalletTransactions: 0,
    isCampaignBannerActive: false,
    lastCheckedAt: '--:--',
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Purge Modal State
  const [activePurgeModal, setActivePurgeModal] = useState<PurgeActionType>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isExecutingPurge, setIsExecutingPurge] = useState(false);
  const [purgeResultMsg, setPurgeResultMsg] = useState<string | null>(null);

  // Check if current user is Super Admin
  const isSuperAdmin = Boolean(
    user?.email && isSuperAdminEmail(user.email)
  );

  const loadMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await fetchDatabaseMetrics();
      setMetrics(data);
    } catch (e) {
      console.warn('Failed to fetch metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const parsedRate = parseFloat(rateInput);
    if (!isNaN(parsedRate) && onUpdateCommissionRate) {
      onUpdateCommissionRate(parsedRate);
    }

    if (bannerSettings && onUpdateBannerSettings) {
      onUpdateBannerSettings({
        ...bannerSettings,
        helplineNumber: helplineInput.trim(),
      });
    }

    try {
      localStorage.setItem('zeropicbd_delivery_inside', insideDhakaFee);
      localStorage.setItem('zeropicbd_delivery_outside', outsideDhakaFee);
      localStorage.setItem('zeropicbd_free_shipping_threshold', freeShippingThreshold);
    } catch {}

    setTimeout(() => {
      setIsSaving(false);
      showToast('✓ Store configuration and delivery settings saved successfully!');
    }, 400);
  };

  const handleOpenPurgeModal = (type: PurgeActionType) => {
    setActivePurgeModal(type);
    setConfirmationInput('');
    setPurgeResultMsg(null);
  };

  const handleExecutePurge = async () => {
    if (confirmationInput.trim() !== 'PURGE') {
      showToast('⚠️ Please type "PURGE" exactly to confirm.');
      return;
    }

    setIsExecutingPurge(true);
    try {
      if (activePurgeModal === 'orders') {
        const res = await purgeDemoOrdersFromFirestore();
        showToast(`🗑️ Purged ${res.deletedCount} demo orders. Preserved ${res.preservedCount} customer orders.`);
      } else if (activePurgeModal === 'products') {
        const res = await purgeDemoProductsFromFirestore();
        showToast(`🗑️ Purged ${res.deletedCount} demo products. Preserved ${res.preservedCount} catalog products.`);
      } else if (activePurgeModal === 'wallet') {
        const res = await resetTestWalletLedgerFromFirestore();
        showToast(`🗑️ Reset ${res.deletedCount} test ledger entries. Customer balances preserved.`);
      }

      await loadMetrics();
      setActivePurgeModal(null);
      setConfirmationInput('');
    } catch (err: any) {
      console.error('Purge error:', err);
      showToast(`❌ Purge operation failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExecutingPurge(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-[#007BFF]" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              System Settings, Health Check & Production Migration
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Configure platform fees, delivery rules, monitor live database audit counters, and safely manage production data.
          </p>
        </div>

        {/* Super Admin Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
            isSuperAdmin
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSuperAdmin ? 'Super Admin Mode' : 'Standard Admin Mode'}</span>
          </span>
        </div>
      </div>

      {/* ================= SECTION 1: DATABASE AUDIT METRICS & HEALTH CHECK ================= */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">
              Live Firestore Database Audit & Health Counters
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Last checked: <strong className="text-slate-300 font-mono">{metrics.lastCheckedAt}</strong>
            </span>

            <button
              type="button"
              onClick={loadMetrics}
              disabled={isLoadingMetrics}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMetrics ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Active Users */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Active Users</p>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {metrics.totalUsers.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Firestore users</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Real Orders */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Real Orders</p>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {metrics.totalOrders.toLocaleString()}
              </p>
              <p className="text-[10px] text-cyan-400 font-semibold mt-0.5">Firestore orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Real Products */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Total Real Products</p>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                {metrics.totalProducts.toLocaleString()}
              </p>
              <p className="text-[10px] text-purple-400 font-semibold mt-0.5">Active Catalog</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Campaign Banner Status */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">Campaign Banner</p>
              <p className={`text-base sm:text-lg font-black mt-1 ${metrics.isCampaignBannerActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {metrics.isCampaignBannerActive ? 'ACTIVE LIVE' : 'DISABLED'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">settings/campaign_banner</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              metrics.isCampaignBannerActive
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

        </div>
      </div>

      {/* ================= SECTION 2: PRODUCTION MAINTENANCE & DATA PURGE TOOLS ================= */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-rose-900/40 text-white space-y-4 shadow-lg relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Production Maintenance & Demo Data Purge Tools
                <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-600/30 font-mono">
                  Super Admin Restricted
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Safe cleanup utilities to prepare your store for live customer transactions without losing real users or registered accounts.
              </p>
            </div>
          </div>
        </div>

        {/* Security Invariant Callout */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Absolute Safety & Account Protection Invariant:</p>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Super Admin account (<code className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded">{SUPER_ADMIN_EMAIL}</code>) and verified customer profiles in <code className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded">users</code> collection are <strong>permanently protected</strong> and will NEVER be deleted or modified during purge operations.
            </p>
          </div>
        </div>

        {/* Purge Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* 1. Purge Demo Orders */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-rose-400" />
                  Purge Demo Orders
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                  Preserves Real Orders
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clears mock sample orders created during testing while preserving orders placed by real customer accounts.
              </p>
            </div>

            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => handleOpenPurgeModal('orders')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSuperAdmin
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSuperAdmin ? 'Purge Demo Orders' : 'Super Admin Required'}</span>
            </button>
          </div>

          {/* 2. Purge Demo Products */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  Purge Demo Products
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                  Keeps Active Catalog
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Removes placeholder/test items flagged with test tags while preserving newly added vendor and active marketplace inventory.
              </p>
            </div>

            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => handleOpenPurgeModal('products')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSuperAdmin
                  ? 'bg-amber-600 hover:bg-amber-700 text-slate-950 font-extrabold shadow-md active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSuperAdmin ? 'Purge Demo Products' : 'Super Admin Required'}</span>
            </button>
          </div>

          {/* 3. Reset Test Wallet Ledger */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  Reset Test Ledger
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                  Protects Balances
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cleans mock development transactions in wallet ledger while keeping authentic customer wallet balances fully intact.
              </p>
            </div>

            <button
              type="button"
              disabled={!isSuperAdmin}
              onClick={() => handleOpenPurgeModal('wallet')}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSuperAdmin
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isSuperAdmin ? 'Reset Test Ledger' : 'Super Admin Required'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ================= SECTION 3: STOREFRONT DELIVERY CONFIG & COMMISSION ================= */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Delivery Rates Config */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-5 h-5 text-indigo-600" />
            <h4 className="font-extrabold text-sm text-[#0A1B3D]">Nationwide Delivery Fees</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inside Dhaka Standard Delivery (৳)
              </label>
              <input
                type="number"
                value={insideDhakaFee}
                onChange={(e) => setInsideDhakaFee(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF] bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default fee charged for delivery inside Dhaka district</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Outside Dhaka Express Delivery (৳)
              </label>
              <input
                type="number"
                value={outsideDhakaFee}
                onChange={(e) => setOutsideDhakaFee(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF] bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Applied across remaining 63 districts nationwide</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Free Shipping Cart Threshold (৳)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF] bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Orders exceeding this amount automatically receive Free Delivery</span>
            </div>
          </div>
        </div>

        {/* Platform Commission & Helpline */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-sm text-[#0A1B3D]">Platform Commission & Support</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Platform Marketplace Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-[#007BFF] bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Platform fee deducted from merchant GMV settlements</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Helpline & WhatsApp Number
              </label>
              <input
                type="text"
                value={helplineInput}
                onChange={(e) => setHelplineInput(e.target.value)}
                placeholder="01883-418309"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#007BFF] bg-slate-50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Displayed prominently on homepage header & customer support</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Security & Role Notice:</p>
              <p>Platform settings can only be altered by authorized <strong className="font-mono text-indigo-700">admin</strong> and <strong className="font-mono text-indigo-700">super_admin</strong> accounts.</p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <span className="text-xs text-slate-500">
            Changes will be applied immediately across storefront and checkout.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* ================= DOUBLE CONFIRMATION PURGE MODAL ================= */}
      {activePurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl animate-scaleUp">
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm Dangerous Purge Action
                </h3>
                <p className="text-xs text-rose-300">
                  {activePurgeModal === 'orders' && 'Purging Test/Demo Orders from Firestore'}
                  {activePurgeModal === 'products' && 'Purging Test/Demo Products from Firestore'}
                  {activePurgeModal === 'wallet' && 'Resetting Test Wallet Transactions'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                This action will delete test records from Firestore. Real customer accounts, verified orders, and the Super Admin account (<strong className="text-white font-mono">{SUPER_ADMIN_EMAIL}</strong>) will remain untouched.
              </p>
              <p className="text-rose-300 font-semibold">
                To proceed, type <span className="font-mono text-white bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/50">PURGE</span> below:
              </p>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type PURGE to confirm"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl text-center text-sm font-mono font-bold text-white tracking-widest focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePurgeModal(null)}
                disabled={isExecutingPurge}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={confirmationInput.trim() !== 'PURGE' || isExecutingPurge}
                onClick={handleExecutePurge}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  confirmationInput.trim() === 'PURGE' && !isExecutingPurge
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {isExecutingPurge ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging from Firestore...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Execute Purge</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
