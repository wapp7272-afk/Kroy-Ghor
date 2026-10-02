import React, { useState, useEffect } from 'react';
import {
  Youtube,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  AlertCircle,
  Coins,
  User,
  Mail
} from 'lucide-react';
import { YouTubeBonusClaim } from '../../types';
import {
  getAllYouTubeBonusClaims,
  approveYouTubeBonusClaim,
  rejectYouTubeBonusClaim
} from '../../services/youtubeBonusService';

interface AdminBonusRequestsManagerProps {
  showToast?: (msg: string) => void;
  onRefreshUserWallets?: () => void;
}

export const AdminBonusRequestsManager: React.FC<AdminBonusRequestsManagerProps> = ({
  showToast = () => {},
  onRefreshUserWallets
}) => {
  const [claims, setClaims] = useState<YouTubeBonusClaim[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const data = await getAllYouTubeBonusClaims();
      setClaims(data);
    } catch (e) {
      console.error('[AdminBonusRequestsManager] Error fetching claims:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async (claim: YouTubeBonusClaim) => {
    setProcessingId(claim.id);
    try {
      await approveYouTubeBonusClaim(claim, () => {
        if (onRefreshUserWallets) onRefreshUserWallets();
      });
      showToast(`✓ Approved ৳20 YouTube bonus for ${claim.userName || claim.userEmail}!`);
      await fetchClaims();
    } catch (err: any) {
      showToast(`❌ Error approving claim: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claim: YouTubeBonusClaim) => {
    const notes = window.prompt(
      'Optional rejection note (e.g. Handle not subscribed or not found):',
      'YouTube channel not subscribed or handle mismatch.'
    );
    if (notes === null) return; // User cancelled prompt

    setProcessingId(claim.id);
    try {
      await rejectYouTubeBonusClaim(claim, notes);
      showToast(`Rejected claim for ${claim.youtubeHandle}`);
      await fetchClaims();
    } catch (err: any) {
      showToast(`❌ Error rejecting claim: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredClaims = claims.filter((claim) => {
    if (filter !== 'all' && claim.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        claim.userName.toLowerCase().includes(q) ||
        claim.userEmail.toLowerCase().includes(q) ||
        claim.youtubeHandle.toLowerCase().includes(q) ||
        claim.uid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = claims.filter((c) => c.status === 'pending').length;
  const approvedCount = claims.filter((c) => c.status === 'approved').length;
  const rejectedCount = claims.filter((c) => c.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-[#0A1B3D] text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Youtube className="w-5 h-5 text-red-500 fill-current" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              YouTube ৳20 Bonus Claim Requests
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-900 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            Review user-submitted YouTube handles, verify subscriptions on <a href="https://www.youtube.com/@zeropicbd" target="_blank" rel="noopener noreferrer" className="underline text-red-400 font-bold hover:text-red-300">@zeropicbd</a>, and approve or reject claims.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClaims}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Claims</span>
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { key: 'pending', label: `Pending (${pendingCount})`, badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
            { key: 'approved', label: `Approved (${approvedCount})`, badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
            { key: 'rejected', label: `Rejected (${rejectedCount})`, badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
            { key: 'all', label: `All Requests (${claims.length})`, badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border ${
                filter === item.key
                  ? 'bg-[#007BFF] text-white border-[#007BFF] shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search handle, email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#007BFF] bg-slate-50"
          />
        </div>
      </div>

      {/* Claims List Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#007BFF] mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading YouTube bonus requests from Firestore...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No {filter !== 'all' ? filter : ''} YouTube bonus requests found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When users submit their YouTube handles on the customer wallet page, they will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3 relative overflow-hidden"
            >
              {/* Top Row: User & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <h4 className="text-sm font-extrabold text-[#0A1B3D]">
                      {claim.userName || 'ZeropicBD Member'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{claim.userEmail || 'No email registered'}</span>
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                    claim.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : claim.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {claim.status === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Approved (+৳20)</span>
                    </>
                  ) : claim.status === 'rejected' ? (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Rejected</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span>Pending Verification</span>
                    </>
                  )}
                </span>
              </div>

              {/* YouTube Handle Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Submitted YouTube Handle:
                  </span>
                  <a
                    href={`https://www.youtube.com/${claim.youtubeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-extrabold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Youtube className="w-3.5 h-3.5 fill-red-600 text-white" />
                    <span>{claim.youtubeHandle}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Bonus Reward:
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-600">
                    ৳20 BDT
                  </span>
                </div>
              </div>

              {/* Date & Admin Notes */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Submitted: {new Date(claim.createdAt).toLocaleDateString('en-GB')}</span>
                <a
                  href="https://www.youtube.com/@somethingmart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Verify Channel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {claim.adminNotes && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                  <strong>Admin Note:</strong> {claim.adminNotes}
                </div>
              )}

              {/* Actions for Pending Claims */}
              {claim.status === 'pending' && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={processingId === claim.id}
                    onClick={() => handleApprove(claim)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Credit ৳20</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingId === claim.id}
                    onClick={() => handleReject(claim)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all border border-slate-200 hover:border-rose-300 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
