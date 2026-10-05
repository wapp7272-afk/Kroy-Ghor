import React, { ReactNode, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { ShieldAlert, ArrowLeft, Lock, RefreshCw } from 'lucide-react';
import { AdminLockScreenModal } from './admin/AdminLockScreenModal';
import { isSuperAdminSessionUnlocked } from '../services/adminPasswordService';

interface AdminRouteProps {
  user: UserProfile;
  isOpen?: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  children: ReactNode;
}

/**
 * Secure Backend & Role-Based Route Protection Guard for Admin Access (/admin)
 * Strictly verifies user.role === 'admin' || user.role === 'super_admin' from Firestore
 * Automatically redirects unauthorized users to '/' with access denied notification
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({
  user,
  isOpen = true,
  onClose,
  onOpenAuth,
  children,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isSuperAdminSessionUnlocked());

  if (!isOpen) return null;

  // Role authorization check from Firestore backend profile
  const isAdmin =
    user.isLoggedIn &&
    (user.role === 'admin' || user.role === 'super_admin');

  // Automatic countdown redirect to home (/) for unauthorized visitors
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isAdmin) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAdmin, onClose]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 animate-fadeIn">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Access Denied
          </h2>

          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The <code className="font-mono text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded">/admin</code> route is strictly restricted to authorized administrators with <strong className="text-white">admin</strong> or <strong className="text-white">super_admin</strong> role in the backend Firestore database.
          </p>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono w-full text-left space-y-1">
            <p>
              Status: <strong className="text-rose-400">Unauthorized</strong>
            </p>
            <p>
              User: <strong className="text-slate-200">{user.isLoggedIn ? user.email || 'Member' : 'Guest (Unauthenticated)'}</strong>
            </p>
            <p>
              Role: <strong className="text-amber-400">{user.role || 'customer'}</strong>
            </p>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <RefreshCw className="w-3 h-3 animate-spin text-[#007BFF]" />
            <span>Redirecting to homepage in {countdown} seconds...</span>
          </div>

          <div className="mt-6 flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Home</span>
            </button>

            {!user.isLoggedIn && onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0056B3] text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Super Admin Lock Screen Modal if dashboard is locked
  if (!isUnlocked) {
    return (
      <AdminLockScreenModal
        userEmail={user.email || 'wapp7272@gmail.com'}
        onUnlocked={() => setIsUnlocked(true)}
        onCancel={onClose}
      />
    );
  }

  return <>{children}</>;
};
