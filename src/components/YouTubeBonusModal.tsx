import React, { useState } from 'react';
import { 
  X, 
  Youtube, 
  Gift, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { UserProfile, YouTubeBonusClaim, WalletTransaction } from '../types';
import { auth } from '../lib/firebaseAuth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { approveYouTubeBonusClaim, submitYouTubeBonusClaim } from '../services/youtubeBonusService';

interface YouTubeBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUserWallet: (newBalance: number, newHistory: WalletTransaction[]) => void;
  showToast: (msg: string) => void;
}

export const YouTubeBonusModal: React.FC<YouTubeBonusModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUserWallet,
  showToast,
}) => {
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'success' | 'failed' | 'manual_pending'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualHandle, setManualHandle] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  if (!isOpen) return null;

  const channelUrl = 'https://www.youtube.com/@kroy-ghor';

  const handleVerifyAutomatic = async () => {
    setVerificationState('loading');
    setErrorMessage(null);

    try {
      // 1. Initialize Google Auth Provider with read-only YouTube Scope
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      if (!auth) {
        throw new Error('Firebase Auth is not initialized properly.');
      }

      // 2. Trigger OAuth pop-up requesting YouTube permissions
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Could not retrieve Google OAuth access token. Please check permission settings.');
      }

      // 3. Query YouTube Subscriptions API
      // We check if the user is subscribed to @kroy-ghor.
      // Note: Because Google API returns the subscriptions of the authenticated user, we query mine=true.
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions from YouTube. Ensure your YouTube channel is active.');
      }

      const data = await response.json();
      
      // 4. Inspect subscription items list for any channel related to kroyghor/zeropic
      const isSubscribed = data.items?.some((item: any) => {
        const channelId = item.snippet?.resourceId?.channelId;
        const channelTitle = (item.snippet?.title || '').toLowerCase();
        const customUrl = (item.snippet?.customUrl || '').toLowerCase();
        
        // Match by known channel handles, titles or substrings
        return (
          channelTitle.includes('kroyghor') ||
          channelTitle.includes('kroy-ghor') ||
          channelTitle.includes('kroy ghor') ||
          channelTitle.includes('zeropic') ||
          customUrl.includes('kroy-ghor') ||
          customUrl.includes('kroyghor')
        );
      });

      // 5. Subscription verification resolution
      if (isSubscribed) {
        // Automatically approve and credit ৳20 wallet balance!
        const claimId = `yt_claim_${user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'user_' + Date.now()}`;
        const automaticClaim: YouTubeBonusClaim = {
          id: claimId,
          uid: user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'user',
          userName: user.name || 'Member',
          userEmail: user.email || '',
          youtubeHandle: '@verified_auto',
          amount: 20,
          status: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newHistoryItem: WalletTransaction = {
          id: `tx-yt-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: 20,
          type: 'credit',
          description: 'YouTube Subscription Bonus (Auto-Verified)'
        };

        const updatedHistory = user.walletHistory ? [newHistoryItem, ...user.walletHistory] : [newHistoryItem];
        const newBalance = user.walletBalance + 20;

        // Persist to backend Firestore and state
        await approveYouTubeBonusClaim(automaticClaim);
        
        // Update parent React state
        onUpdateUserWallet(newBalance, updatedHistory);
        setVerificationState('success');
        showToast('🎉 ৳20 bonus credited to your wallet!');
      } else {
        // If not found, throw error to block payout
        setVerificationState('failed');
        setErrorMessage('Please subscribe to @kroy-ghor on YouTube first to unlock your ৳20 bonus!');
      }
    } catch (err: any) {
      console.error('[YouTubeVerify] Error:', err);
      setVerificationState('failed');
      setErrorMessage(
        err.message || 'Google verification was cancelled or failed to load. Please try again.'
      );
    }
  };

  const handleManualClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHandle.trim()) return;

    setIsSubmittingManual(true);
    try {
      const uid = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'user';
      await submitYouTubeBonusClaim(
        uid,
        user.name,
        user.email,
        manualHandle.trim()
      );
      setVerificationState('manual_pending');
      showToast('✓ Manual review request submitted successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit manual review. Please try again.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* iOS Glassmorphic Card Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-white/20 shadow-2xl p-6 sm:p-8 animate-slideUp">
        
        {/* Decorative Top Amber Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <Youtube className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              YouTube Subscription Bonus
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subscribe & Claim ৳20 Instant Wallet Bonus
            </p>
          </div>
        </div>

        {/* Dynamic Verification Content states */}
        <div className="py-6 space-y-5">
          {verificationState === 'idle' && (
            <div className="space-y-5">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Join our premium community on YouTube at <strong className="text-red-500">@kroy-ghor</strong>. Check out original batch test videos, technology unboxings, and claim an instant <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">৳20</span> credit directly to your digital shopping wallet!
              </p>

              {/* Steps Layout */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Subscribe to YouTube Channel</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click the link below and subscribe to the channel.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Connect & Auto-Verify</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Authorize Google OAuth to instantly verify and credit ৳20.</p>
                  </div>
                </div>
              </div>

              {/* Call-to-Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  <span>Subscribe to @kroy-ghor</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                </a>

                <button
                  type="button"
                  onClick={handleVerifyAutomatic}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
                >
                  <Gift className="w-4 h-4 text-slate-950" />
                  <span>Verify & Claim ৳20</span>
                </button>
              </div>
            </div>
          )}

          {verificationState === 'loading' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <Youtube className="w-6 h-6 fill-red-500 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Connecting Google Account...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Please complete the authorization in the Google OAuth pop-up to check your subscription status.
                </p>
              </div>
            </div>
          )}

          {verificationState === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">৳২০ ইউটিউব বোনাস ক্লেইম সফল!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  আপনার সাবস্ক্রিপশন সফলভাবে যাচাই করা হয়েছে। আপনার ডিজিটাল ওয়ালেটে ৳২০ যুক্ত করা হয়েছে যা যেকোনো চেকআউটে সরাসরি ব্যবহার করতে পারবেন!
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  অপূর্ব! ধন্যবাদ
                </button>
              </div>
            </div>
          )}

          {verificationState === 'failed' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex gap-3 text-rose-800 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black">Verification Failed / সাবস্ক্রিপশন মেলেনি</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    {errorMessage || 'Please ensure you are subscribed to @kroy-ghor on YouTube. If your subscriptions are set to Private, we are unable to verify them automatically.'}
                  </p>
                </div>
              </div>

              {/* Subscriptions Private Info Card */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/50 text-amber-800 dark:text-amber-400 text-[11px] leading-relaxed">
                💡 <span className="font-bold">টিপস:</span> আপনার ইউটিউব সাবস্ক্রিপশন লিস্ট যদি <strong>Private</strong> করা থাকে, তবে অটো-ভেরিফাই কাজ করবে না। নিচে আপনার YouTube হ্যান্ডেল লিখে ম্যানুয়াল রিভিউ রিকোয়েস্ট জমা দিন।
              </div>

              {/* Manual Submission Fallback Form */}
              <form onSubmit={handleManualClaimSubmit} className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ম্যানুয়াল ক্লেইম করুন (Submit Manual Review):
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Youtube className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="যেমন: @yourhandle বা আপনার চ্যানেলের নাম"
                      value={manualHandle}
                      onChange={(e) => setManualHandle(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingManual || !manualHandle.trim()}
                    className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSubmittingManual ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>রিকোয়েস্ট পাঠান</span>
                  </button>
                </div>
              </form>

              {/* Return to automatic/retry option */}
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setVerificationState('idle')}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer"
                >
                  পুনরায় চেষ্টা করুন (Retry Auto-Verify)
                </button>
              </div>
            </div>
          )}

          {verificationState === 'manual_pending' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Clock className="w-10 h-10" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">ম্যানুয়াল রিভিউ রিকোয়েস্ট জমা হয়েছে!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  আপনার সাবমিট করা YouTube হ্যান্ডেলটি (<span className="font-mono font-bold text-red-500">{manualHandle}</span>) আমাদের অ্যাডমিন টিম ২৪ ঘণ্টার মধ্যে ম্যানুয়ালি রিভিউ করবে। আপনার সাবস্ক্রিপশন নিশ্চিত হওয়ার পর আপনার ওয়ালেটে ৳২০ যুক্ত করে দেওয়া হবে।
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Channel Footnote */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Free digital wallet credit
          </span>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-0.5 text-red-500 hover:text-red-600 font-medium"
          >
            <span>Visit YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
