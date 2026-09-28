import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  Sparkles, 
  MapPin, 
  CheckCircle, 
  User, 
  Phone, 
  Mail, 
  LogOut, 
  Gift, 
  Lock, 
  Key, 
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Coins,
  History,
  PartyPopper,
  ExternalLink
} from 'lucide-react';
import { UserProfile, Address, WalletTransaction } from '../types';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogin: (name: string, email: string, phone: string, isPhoneVerified?: boolean, authProvider?: 'google' | 'phone' | 'email', avatar?: string) => void;
  onSignup: (name: string, email: string, phone: string, address: Address, isPhoneVerified?: boolean, authProvider?: 'google' | 'phone' | 'email', avatar?: string) => void;
  onVerifyPhoneSuccess?: (phone: string) => void;
  onUpdateAddress: (address: Address) => void;
  onLogout: () => void;
  onOpenCustomerPortal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onSignup,
  onVerifyPhoneSuccess,
  onUpdateAddress,
  onLogout,
  onOpenCustomerPortal,
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'phone_verify' | 'otp' | 'profile'>(
    user.isLoggedIn ? 'profile' : 'signup'
  );

  // Form states
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [regPassword, setRegPassword] = useState('');
  const [authProvider, setAuthProvider] = useState<'google' | 'phone' | 'email'>('google');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(user.avatar);

  const [cityDivision, setCityDivision] = useState<'Inside Dhaka' | 'Outside Dhaka'>(
    user.address?.cityDivision || 'Inside Dhaka'
  );
  const [fullAddress, setFullAddress] = useState(user.address?.fullAddress || '');

  // Login Form states
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Phone Verification Engine states
  const [verificationPhone, setVerificationPhone] = useState(user.phone || '');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [smsToast, setSmsToast] = useState<{ code: string; phone: string } | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Google OAuth Dialog Modal Simulator
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Reward Celebration Modal for ৳20 Welcome Bonus
  const [rewardCelebration, setRewardCelebration] = useState<{
    amount: number;
    phone: string;
    accountName: string;
  } | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timer for resend
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (user.isLoggedIn) {
      setTab('profile');
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      if (user.address) {
        setCityDivision(user.address.cityDivision || 'Inside Dhaka');
        setFullAddress(user.address.fullAddress || '');
      }
    }
  }, [user]);

  if (!isOpen) return null;

  // Retrieve accounts permanently from localStorage
  const getRegisteredAccounts = (): any[] => {
    try {
      const stored = localStorage.getItem('primevault_registered_accounts') || localStorage.getItem('zestflick_registered_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Trigger Phone Verification Code Generation
  const triggerSendOtp = (targetPhone: string, userName: string) => {
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setErrorMsg('⚠️ অনুগ্রহ করে সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX বা 018XXXXXXXX)।');
      return false;
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);
    setOtpDigits(['', '', '', '']);
    setVerificationPhone(cleanPhone);
    setResendTimer(60);
    setTab('otp');
    setErrorMsg(null);

    // Show instant, non-blocking simulated SMS notification banner
    setSmsToast({ code: otpCode, phone: cleanPhone });
    setTimeout(() => {
      document.getElementById('phone-otp-0')?.focus();
    }, 150);

    return true;
  };

  // Google Sign-In Handler
  const handleGoogleSignInClick = () => {
    setErrorMsg(null);
    setShowGoogleChooser(true);
  };

  const handleSelectGoogleAccount = (googleUser: { name: string; email: string; avatar: string }) => {
    setShowGoogleChooser(false);
    setName(googleUser.name);
    setEmail(googleUser.email);
    setUserAvatar(googleUser.avatar);
    setAuthProvider('google');

    // Check if account already registered and verified
    const accounts = getRegisteredAccounts();
    const existing = accounts.find((a: any) => a.email && a.email.toLowerCase() === googleUser.email.toLowerCase());

    if (existing && existing.isPhoneVerified) {
      // Already verified, log in directly!
      onLogin(existing.name, existing.email, existing.phone, true, 'google', googleUser.avatar);
      setSuccessMsg(`✓ Welcome back, ${existing.name}! Logged in with Google.`);
      setTimeout(() => {
        setSuccessMsg(null);
        setTab('profile');
      }, 700);
    } else {
      // Needs phone verification to claim the ৳20 bonus!
      setTab('phone_verify');
      setSuccessMsg(`✓ Google Authenticated: ${googleUser.email}. Please verify your phone to claim ৳20 bonus.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Direct Sign Up Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setErrorMsg('⚠️ অনুগ্রহ করে সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('⚠️ অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('⚠️ পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    // Check LocalStorage uniqueness
    const accounts = getRegisteredAccounts();
    const phoneExists = accounts.some((acc: any) => acc.phone === cleanPhone);
    if (phoneExists) {
      setErrorMsg('❌ This phone number has already been registered. Please Log In.');
      return;
    }

    triggerSendOtp(cleanPhone, name.trim());
  };

  const handleOtpChange = (index: number, val: string) => {
    const updated = [...otpDigits];
    updated[index] = val.slice(-1);
    setOtpDigits(updated);

    if (val && index < 3) {
      const nextInput = document.getElementById(`phone-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prev = document.getElementById(`phone-otp-${index - 1}`);
      prev?.focus();
    }
  };

  // Verification Completion & ৳20 Bonus Award
  const handleVerifyOtp = () => {
    setErrorMsg(null);
    const entered = otpDigits.join('');
    if (entered.length !== 4) {
      setErrorMsg('⚠️ অনুগ্রহ করে ৪-ডিজিটের সম্পূর্ণ OTP কোড লিখুন।');
      return;
    }

    if (entered !== generatedOtp) {
      setErrorMsg('❌ ভুল OTP কোড! আবার সঠিক ৪-ডিজিট কোড লিখুন।');
      return;
    }

    // Success! Save to registered accounts with ৳20 welcome bonus
    const accounts = getRegisteredAccounts();
    const cleanPhone = verificationPhone.replace(/[^0-9]/g, '');

    const initialWalletHistory: WalletTransaction[] = [
      {
        id: `tx-welcome-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: 20,
        type: 'credit',
        description: 'Welcome Sign-up & Phone Verification Bonus'
      }
    ];

    const accountData = {
      name: name || 'Prime Member',
      email: email.trim().toLowerCase() || `${cleanPhone}@primevault.zone`,
      phone: cleanPhone,
      password: regPassword || 'google-auth-verified',
      isPhoneVerified: true,
      authProvider: authProvider,
      avatar: userAvatar,
      address: {
        fullName: name || 'Prime Member',
        phone: cleanPhone,
        cityDivision,
        fullAddress,
      },
      registeredAt: new Date().toISOString(),
      walletBalance: 20,
      hasReceivedBonus: true,
      walletHistory: initialWalletHistory
    };

    const existingIndex = accounts.findIndex((a: any) => a.phone === cleanPhone || (email && a.email === email.toLowerCase()));
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...accountData };
    } else {
      accounts.push(accountData);
    }
    localStorage.setItem('primevault_registered_accounts', JSON.stringify(accounts));

    const newAddress: Address = {
      fullName: name || 'Prime Member',
      phone: cleanPhone,
      cityDivision,
      fullAddress,
    };

    onSignup(name || 'Prime Member', email, cleanPhone, newAddress, true, authProvider, userAvatar);

    if (onVerifyPhoneSuccess) {
      onVerifyPhoneSuccess(cleanPhone);
    }

    setSmsToast(null);

    // Show Reward Celebration Popup Modal
    setRewardCelebration({
      amount: 20,
      phone: cleanPhone,
      accountName: name || 'Prime Member',
    });
  };

  // Traditional Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = loginPhone.replace(/[^0-9]/g, '');

    const accounts = getRegisteredAccounts();
    const matched = accounts.find((acc: any) => acc.phone === cleanPhone);

    if (!matched) {
      setErrorMsg('❌ এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে Sign Up করুন।');
      return;
    }

    if (matched.password !== loginPassword && matched.password !== 'google-auth-verified') {
      setErrorMsg('❌ পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      return;
    }

    onLogin(matched.name, matched.email, matched.phone, matched.isPhoneVerified ?? true, matched.authProvider || 'phone', matched.avatar);
    setSuccessMsg(`স্বাগতম ${matched.name}! সফলভাবে লগইন হয়েছে।`);
    setTimeout(() => {
      setSuccessMsg(null);
      setTab('profile');
    }, 800);
  };

  const handleSaveAddressOnly = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Address = {
      fullName: name || user.name,
      phone: phone || user.phone,
      cityDivision,
      fullAddress,
    };
    onUpdateAddress(updated);
    setSuccessMsg('✓ ডেলিভারি ঠিকানা সফলভাবে সংরক্ষিত হয়েছে।');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
        <div 
          id="auth-modal"
          className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0d1020] rounded-3xl border border-purple-500/40 p-5 sm:p-7 shadow-2xl text-[#f8fafc]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-[#5B21B6] p-[1px] mx-auto mb-3 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0d0f22] rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {user.isLoggedIn ? 'Customer Profile & Wallet' : 'PRIME VAULT ZONE Member Club'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {user.isLoggedIn 
                ? 'লাইভ ওয়ালেট ব্যালেন্স ও ডেলিভারি ঠিকানা ম্যানেজ করুন'
                : 'Google Sign-In ও মোবাইল ভেরিফিকেশনে পাচ্ছেন ৳২০ ইনস্ট্যান্ট ওয়েলকাম বোনাস!'}
            </p>
          </div>

          {/* Simulated Live SMS Alert Toast Banner */}
          {smsToast && (
            <div className="mb-4 p-3.5 rounded-xl bg-purple-950/90 border border-purple-400 text-purple-200 text-xs shadow-lg flex items-start gap-2.5 animate-slideDown">
              <Smartphone className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                    💬 SMS Delivery Simulation (Instant)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(smsToast.code.split(''));
                    }}
                    className="text-[10px] bg-white text-purple-950 font-bold px-1.5 py-0.5 rounded hover:bg-purple-100"
                  >
                    Auto Fill
                  </button>
                </div>
                <p className="text-[11px] text-purple-100 mt-0.5">
                  Prime Vault Verification OTP for <strong className="font-mono text-white">{smsToast.phone}</strong> is:
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-purple-900 border border-purple-400 font-mono font-black text-white text-base tracking-widest">
                    {smsToast.code}
                  </span>
                  <span className="text-[10px] text-slate-300">Valid for 5 minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Only if not logged in) */}
          {!user.isLoggedIn && tab !== 'otp' && tab !== 'phone_verify' && (
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-white/5 mb-5">
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-[#5B21B6] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up (+৳20 Bonus)
              </button>
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-[#5B21B6] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= 1. GOOGLE SIGN-IN HERO BUTTON ================= */}
          {!user.isLoggedIn && (tab === 'signup' || tab === 'login') && (
            <div className="mb-5 space-y-3">
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleSignInClick}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-[#1f2937] font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-gray-200 cursor-pointer active:scale-98"
              >
                {/* Google G Multi-Color SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (1-Tap Login)</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  +৳20 Bonus
                </span>
              </button>

              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <div className="flex-1 h-px bg-slate-800" />
                <span>or sign in with phone</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </div>
          )}

          {/* ================= 2. SIGN UP FORM ================= */}
          {!user.isLoggedIn && tab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  আপনার পূর্ণ নাম (Full Name)*
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  বাংলাদেশি মোবাইল নম্বর (01XXXXXXXXX)*
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={11}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX (11 digits)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  মোবাইল নম্বর ভেরিফিকেশনের সাথে সাথেই আপনার ওয়ালেটে ৳২০ জমা হবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ইমেইল অ্যাড্রেস (Email Address - Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পাসওয়ার্ড (Password)*
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-lg transition-all mt-4 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>পরবর্তী: OTP কোড পাঠান (+৳২০ বোনাস)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================= 3. PHONE VERIFICATION STEP ================= */}
          {!user.isLoggedIn && tab === 'phone_verify' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs text-purple-200">
                <p className="font-bold">Google অ্যাকাউন্টের সাথে মোবাইল নম্বর সংযুক্ত করুন</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  আপনার ওয়ালেটে ৳২০ ওয়েলকাম বোনাস সক্রিয় করার জন্য ১১ ডিজিটের মোবাইল নম্বরটি ভেরিফাই করুন।
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ১১ ডিজিটের মোবাইল নম্বর (Phone Number)*
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={11}
                    value={verificationPhone}
                    onChange={(e) => setVerificationPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerSendOtp(verificationPhone, name)}
                className="w-full py-3 rounded-xl font-bold text-xs bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>ভেরিফিকেশন OTP কোড পাঠান</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= 4. OTP INPUT SCREEN ================= */}
          {!user.isLoggedIn && tab === 'otp' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-400 mx-auto flex items-center justify-center text-2xl">
                📱
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mobile SMS OTP Verification</h3>
                <p className="text-xs text-slate-300 mt-1">
                  ৪-সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে:<br />
                  <span className="text-purple-400 font-mono font-bold">{verificationPhone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 my-4">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`phone-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-black text-purple-300 bg-slate-900 border-2 border-purple-500/40 rounded-xl focus:outline-none focus:border-purple-400 font-mono"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-lg transition-all cursor-pointer"
              >
                Verify Code & Activate ৳20 Bonus
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={() => triggerSendOtp(verificationPhone, name)}
                  className={`text-xs flex items-center gap-1 cursor-pointer ${
                    resendTimer > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab(authProvider === 'google' ? 'phone_verify' : 'signup')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Edit Number
                </button>
              </div>
            </div>
          )}

          {/* ================= 5. LOGIN FORM ================= */}
          {!user.isLoggedIn && tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  রেজিস্টার্ড মোবাইল নম্বর (Phone Number)*
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-phone"
                    type="tel"
                    maxLength={11}
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">পাসওয়ার্ড (Password)*</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-lg transition-all mt-4 cursor-pointer"
              >
                লগইন করুন (Log In)
              </button>
            </form>
          )}

          {/* ================= 6. LOGGED IN QUICK PROFILE & WALLET ================= */}
          {user.isLoggedIn && (
            <div className="space-y-5">
              {/* Wallet Card */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#1b1238] via-[#0f172a] to-[#171717] border border-purple-500/40 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-purple-300 font-bold">
                        Prime Vault Wallet
                      </span>
                      {user.isPhoneVerified && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{user.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{user.phone || user.email}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Coins className="w-5 h-5 text-amber-300" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                  <div>
                    <span className="text-xs text-slate-400 block">বর্তমান লাইভ ওয়ালেট ব্যালেন্স</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-purple-300 font-mono">
                        ৳{user.walletBalance || 0}
                      </span>
                      <span className="text-xs text-slate-400">BDT</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold inline-block">
                      ✓ চেকআউটে সরাসরি ছাড়
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Access to Full Customer Portal */}
              {onOpenCustomerPortal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCustomerPortal();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#5B21B6]" />
                  <span>Open Full Customer Account & Order History Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}

              {/* Saved Address in LocalStorage */}
              <form onSubmit={handleSaveAddressOnly} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    সংরক্ষিত ডেলিভারি ঠিকানা
                  </span>
                  <span className="text-[10px] text-slate-400">চেকআউটে অটো-ফিল হবে</span>
                </div>

                <div>
                  <select
                    value={cityDivision}
                    onChange={(e) => setCityDivision(e.target.value as 'Inside Dhaka' | 'Outside Dhaka')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Inside Dhaka">ঢাকার ভিতরে (Inside Dhaka - Delivery ৳60)</option>
                    <option value="Outside Dhaka">ঢাকার বাইরে (Outside Dhaka - Delivery ৳120)</option>
                  </select>
                </div>

                <textarea
                  rows={2}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ঠিকানা আপডেট করুন
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= GOOGLE ACCOUNT CHOOSER POPUP DIALOG SIMULATOR ================= */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Google Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-bold text-gray-700">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleChooser(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 font-medium">
                Choose an account to continue to <strong className="text-gray-900">PRIME VAULT ZONE</strong>
              </p>

              {/* Primary Google Account Choice */}
              <button
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Tanvir Ahmed',
                    email: 'wapp7272@gmail.com',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                  })
                }
                className="w-full p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  T
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Tanvir Ahmed</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">wapp7272@gmail.com</p>
                </div>
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Default
                </span>
              </button>

              {/* Secondary Account Choice */}
              <button
                onClick={() =>
                  handleSelectGoogleAccount({
                    name: 'Farhan Kabir',
                    email: 'customer.vault@gmail.com',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                  })
                }
                className="w-full p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  F
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Farhan Kabir</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">customer.vault@gmail.com</p>
                </div>
              </button>

              {/* Custom Google Account Option */}
              {!showCustomGoogleInput ? (
                <button
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full p-2.5 rounded-xl border border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50/50 transition-colors flex items-center gap-3 text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-lg shrink-0">
                    +
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">Use another Google account</p>
                    <p className="text-[11px] text-gray-500">Sign in with any custom Gmail ID</p>
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-purple-200 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">Custom Google Account</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleInput(false)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:border-purple-600"
                  />
                  <input
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-900 font-mono focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.trim()}
                    onClick={() => {
                      const emailInput = customGoogleEmail.trim().toLowerCase();
                      const finalEmail = emailInput.includes('@') ? emailInput : `${emailInput}@gmail.com`;
                      const finalName = customGoogleName.trim() || finalEmail.split('@')[0];
                      handleSelectGoogleAccount({
                        name: finalName,
                        email: finalEmail,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=5B21B6&color=fff`
                      });
                    }}
                    className="w-full py-2 rounded-lg bg-[#5B21B6] hover:bg-[#4C1D95] disabled:bg-gray-300 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Sign In with this Google Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ৳20 WELCOME BONUS REWARD CELEBRATION MODAL ================= */}
      {rewardCelebration && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-white text-gray-900 rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 border border-purple-200 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 mx-auto flex items-center justify-center text-amber-600 shadow-lg animate-bounce">
              <Coins className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-[#5B21B6] uppercase tracking-wider">
                🎉 Welcome Bonus Credited!
              </span>
              <h3 className="text-xl font-black text-[#171717] pt-1">
                অভিনন্দন, {rewardCelebration.accountName}!
              </h3>
              <p className="text-xs text-gray-600">
                মোবাইল নম্বর <strong className="font-mono text-purple-700">{rewardCelebration.phone}</strong> সফলভাবে ভেরিফাইড হয়েছে।
              </p>
            </div>

            {/* Bonus Display Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase">
                New Live Wallet Balance
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-400 line-through font-mono text-sm">৳0</span>
                <ArrowRight className="w-4 h-4 text-[#5B21B6]" />
                <span className="text-3xl font-black font-mono text-[#5B21B6]">
                  ৳{rewardCelebration.amount}
                </span>
                <span className="text-xs font-bold text-gray-500">BDT</span>
              </div>
              <p className="text-[11px] text-purple-700 font-semibold pt-1 border-t border-purple-200/60">
                ✓ আপনার পরবর্তী যে কোনো অর্ডারে এই ৳২০ চেকআউটে সরাসরি মাইনাস হবে!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setRewardCelebration(null);
                  setTab('profile');
                  if (onOpenCustomerPortal) {
                    onClose();
                    onOpenCustomerPortal();
                  }
                }}
                className="w-full py-3 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                View Customer Dashboard & Orders
              </button>

              <button
                onClick={() => {
                  setRewardCelebration(null);
                  onClose();
                }}
                className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
              >
                শপিং শুরু করুন (Start Shopping)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
