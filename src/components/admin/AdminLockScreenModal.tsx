import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  checkSuperAdminPasswordStatus,
  setInitialSuperAdminPassword,
  verifySuperAdminPassword,
} from '../../services/adminPasswordService';
import { BrandLogo } from '../BrandLogo';

interface AdminLockScreenModalProps {
  userEmail?: string;
  onUnlocked: () => void;
  onCancel?: () => void;
}

export const AdminLockScreenModal: React.FC<AdminLockScreenModalProps> = ({
  userEmail = 'wapp7272@gmail.com',
  onUnlocked,
  onCancel,
}) => {
  const [mode, setMode] = useState<'checking' | 'setup' | 'lock'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initCheck = async () => {
      try {
        const status = await checkSuperAdminPasswordStatus();
        if (isMounted) {
          if (!status.hasPassword) {
            setMode('setup');
          } else {
            setMode('lock');
          }
        }
      } catch (e) {
        if (isMounted) setMode('setup');
      }
    };
    initCheck();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle First-Time Setup
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg('⚠️ Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('❌ Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await setInitialSuperAdminPassword(password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('✓ Super Admin Password set successfully! Unlocking Admin Panel...');
        setTimeout(() => {
          onUnlocked();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Failed to save password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Error setting initial password.');
    }
  };

  // Handle Verification / Lock Screen Unlock
  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password) {
      setErrorMsg('⚠️ Please enter your Super Admin password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifySuperAdminPassword(password);
      setIsLoading(false);

      if (res.isValid) {
        setSuccessMsg('✓ Password verified! Unlocking Admin Panel...');
        setTimeout(() => {
          onUnlocked();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Incorrect password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Verification error.');
    }
  };

  if (mode === 'checking') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#007BFF] animate-spin" />
          <span className="text-xs font-bold text-slate-300">Checking Super Admin Security Lock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 animate-modalEnter">
        
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-extrabold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              SUPER ADMIN SECURITY LOCK
            </span>
          </div>

          <div className="mb-2">
            <BrandLogo size="md" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'setup' ? 'First-Time Password Setup' : 'Super Admin Lock Screen'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'setup'
              ? 'Set an initial password to secure the Super Admin Panel.'
              : `Enter your password to unlock Admin Dashboard (${userEmail}).`}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= MODE 1: FIRST-TIME SETUP ================= */}
        {mode === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                New Super Admin Password*
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Confirm Password*
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-slate-950" />
              )}
              <span>{isLoading ? 'Saving Password...' : 'Save Password & Unlock Dashboard'}</span>
            </button>
          </form>
        )}

        {/* ================= MODE 2: LOCK SCREEN UNLOCK ================= */}
        {mode === 'lock' && (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Enter Password*
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Super Admin Password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#007BFF] hover:bg-[#0056B3] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Unlock className="w-4 h-4 text-white" />
              )}
              <span>{isLoading ? 'Verifying...' : 'Unlock Admin Dashboard'}</span>
            </button>
          </form>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 font-medium cursor-pointer transition-colors"
            >
              ← Return to Main Storefront
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
