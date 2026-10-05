import React, { useState } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { changeSuperAdminPassword } from '../../services/adminPasswordService';

interface AdminChangePasswordSectionProps {
  showToast?: (msg: string) => void;
}

export const AdminChangePasswordSection: React.FC<AdminChangePasswordSectionProps> = ({
  showToast = () => {},
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('⚠️ Please enter your current Super Admin password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('⚠️ New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('❌ New passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await changeSuperAdminPassword(currentPassword, newPassword);
      setIsLoading(false);

      if (res.success) {
        setSuccessMsg('✓ Super Admin password updated successfully in Firestore!');
        showToast('✓ Super Admin password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'An error occurred while updating password.');
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-4 shadow-md">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <ShieldCheck className="w-5 h-5 text-amber-400" />
        <div>
          <h4 className="text-sm font-bold text-white">
            Super Admin Lock Password Management
          </h4>
          <p className="text-xs text-slate-400">
            Update the security lock password required to access the Admin Dashboard (/admin).
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-lg">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Current Super Admin Password*
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            New Super Admin Password*
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Confirm New Password*
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password to confirm"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#007BFF] transition-all font-medium"
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
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-slate-950" />
          )}
          <span>{isLoading ? 'Updating Password...' : 'Update Super Admin Password'}</span>
        </button>
      </form>
    </div>
  );
};
