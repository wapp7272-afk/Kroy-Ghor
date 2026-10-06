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
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Coins,
  ExternalLink,
  Youtube,
  Gift
} from 'lucide-react';
import { UserProfile, Address, WalletTransaction } from '../types';
import { 
  isFirebaseConfigured, 
  signInWithGoogle, 
  signUpWithEmailAndPassword, 
  signInUserWithEmailAndPassword 
} from '../lib/firebaseAuth';
import { BrandLogo } from './BrandLogo';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogin: (
    name: string, 
    email: string, 
    phone: string, 
    isPhoneVerified?: boolean, 
    authProvider?: 'google' | 'phone' | 'email', 
    avatar?: string,
    uid?: string
  ) => void;
  onSignup: (
    name: string, 
    email: string, 
    phone: string, 
    address: Address, 
    isPhoneVerified?: boolean, 
    authProvider?: 'google' | 'phone' | 'email', 
    avatar?: string,
    uid?: string
  ) => void;
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
    user.isLoggedIn ? 'profile' : 'login'
  );

  // Form states
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'phone' | 'email'>('email');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(user.avatar);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [cityDivision, setCityDivision] = useState<'Inside Dhaka' | 'Outside Dhaka'>(
    user.address?.cityDivision || 'Inside Dhaka'
  );
  const [fullAddress, setFullAddress] = useState(user.address?.fullAddress || '');

  // Login Form states
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Phone Verification Engine states
  const [verificationPhone, setVerificationPhone] = useState(user.phone || '');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [smsToast, setSmsToast] = useState<{ code: string; phone: string } | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Reward Celebration Modal for ৳20 Welcome Bonus
  const [rewardCelebration, setRewardCelebration] = useState<{
    amount: number;
    phone: string;
    accountName: string;
  } | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

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
      if (isOpen && (tab === 'login' || tab === 'signup')) {
        setIsGoogleLoading(false);
        onClose();
        return;
      }
      setTab('profile');
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      if (user.address) {
        setCityDivision(user.address.cityDivision || 'Inside Dhaka');
        setFullAddress(user.address.fullAddress || '');
      }
    } else {
      if (tab === 'profile') {
        setTab('login');
      }
    }
  }, [user.isLoggedIn, isOpen, tab, onClose]);

  if (!isOpen) return null;

  // Retrieve accounts permanently from localStorage
  const getRegisteredAccounts = (): any[] => {
    try {
      const stored = localStorage.getItem('zeropicbd_registered_accounts') || 
                     localStorage.getItem('kroyghor_registered_accounts') || 
                     localStorage.getItem('primevault_registered_accounts');
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

  // High-Performance Real Firebase Google OAuth Handler (1-Click Login)
  const handleGoogleSignInClick = async () => {
    setErrorMsg(null);
    setUnauthorizedDomain(null);

    if (!isFirebaseConfigured()) {
      setErrorMsg('❌ Firebase Authentication is not configured for this project.');
      return;
    }

    setIsGoogleLoading(true);

    try {
      const googleUser = await signInWithGoogle();

      // If mobile or desktop fallback triggered redirect, maintain loading state while navigating
      if (googleUser?.redirecting) {
        setIsGoogleLoading(true);
        setErrorMsg('🔄 গুগল সাইন-ইন পেজে নিয়ে যাওয়া হচ্ছে...');
        return;
      }

      setIsGoogleLoading(false);

      const userDisplayName = googleUser.displayName || googleUser.email.split('@')[0] || 'Kroy Ghor Member';
      setName(userDisplayName);
      setEmail(googleUser.email);
      setUserAvatar(googleUser.photoURL);
      setAuthProvider('google');

      const accounts = getRegisteredAccounts();
      const existing = accounts.find(
        (a: any) =>
          (a.email && a.email.toLowerCase() === googleUser.email.toLowerCase()) ||
          (a.uid && a.uid === googleUser.uid)
      );

      const isVerified = existing ? Boolean(existing.isPhoneVerified) : true;
      const userPhone = existing ? existing.phone || '' : '';

      onLogin(
        existing?.name || userDisplayName,
        googleUser.email,
        userPhone,
        isVerified,
        'google',
        googleUser.photoURL || existing?.avatar,
        googleUser.uid
      );

      onClose();
    } catch (err: any) {
      setIsGoogleLoading(false);
      console.warn('[AuthModal] Google Sign-In notice:', err);

      if (err?.code === 'auth/unauthorized-domain' || err?.domain) {
        const domain = err.domain || window.location.hostname;
        setUnauthorizedDomain(domain);
        setErrorMsg(`❌ Domain Authorization Required: Please add "${domain}" in Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.message?.toLowerCase().includes('cancelled')) {
        setErrorMsg('ℹ️ Google Sign-In বাতিল করা হয়েছে। আবার চেষ্টা করতে বাটনে ক্লিক করুন।');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('⚠️ ব্রাউজারে পপ-আপ ব্লক করা হয়েছিল। গুগল সাইন-ইন পেজে রিডাইরেক্ট করা হচ্ছে...');
      } else if (err?.code === 'auth/network-request-failed' || err?.code === 'auth/timeout' || err?.message?.includes('timed out')) {
        setErrorMsg('⚠️ কানেকশন টাইমআউট হয়েছে। আপনার ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMsg('❌ Google Sign-In is disabled in Firebase Console > Authentication > Sign-in method.');
      } else {
        setErrorMsg(`❌ ${err.message || 'সাইন-ইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'}`);
      }
    }
  };

  // Direct Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('⚠️ অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setErrorMsg('⚠️ অনুগ্রহ করে আপনার ইমেইল অথবা মোবাইল নম্বর লিখুন।');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('⚠️ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const accounts = getRegisteredAccounts();
    if (cleanEmail) {
      const emailExists = accounts.some((acc: any) => acc.email && acc.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        setErrorMsg('❌ This email address has already been registered. Please Log In.');
        return;
      }
    }

    const newAddress: Address = {
      fullName: name.trim(),
      phone: cleanPhone || '',
      cityDivision,
      fullAddress,
    };

    const effectiveEmail = cleanEmail || (cleanPhone ? `${cleanPhone}@kroyghor.com` : `${Date.now()}@kroyghor.com`);
    const effectivePass = regPassword;

    let createdUid: string | undefined = undefined;

    // Guarantee Firebase Auth user creation for every customer registration
    if (isFirebaseConfigured()) {
      try {
        const fAuthRes = await signUpWithEmailAndPassword(effectiveEmail, effectivePass, name.trim());
        createdUid = fAuthRes.uid;
      } catch (fErr: any) {
        if (fErr?.code === 'auth/email-already-in-use') {
          try {
            const signInRes = await signInUserWithEmailAndPassword(effectiveEmail, effectivePass);
            createdUid = signInRes.uid;
          } catch (sErr: any) {
            let msg = '❌ এই ইমেইল/ফোন নম্বর দিয়ে ইতোমধ্যেই অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।';
            if (sErr?.code === 'auth/wrong-password' || sErr?.code === 'auth/invalid-credential') {
              msg = '❌ এই ইমেইল/ফোন দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে লগইন করুন।';
            }
            setErrorMsg(msg);
            return;
          }
        } else {
          let msg = '❌ সাইনআপ ব্যর্থ হয়েছে।';
          if (fErr?.code === 'auth/weak-password') {
            msg = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
          } else if (fErr?.code === 'auth/invalid-email') {
            msg = '❌ অকার্যকর ইমেইল ঠিকানা।';
          } else if (fErr?.code === 'auth/operation-not-allowed') {
            msg = '❌ Firebase Console-এ Email/Password Provider টি Enable করা নেই।';
          } else if (fErr?.message) {
            msg = `❌ ${fErr.message}`;
          }
          setErrorMsg(msg);
          return;
        }
      }
    }

    onSignup(
      name.trim(),
      effectiveEmail,
      cleanPhone,
      newAddress,
      true,
      cleanEmail ? 'email' : 'phone',
      userAvatar,
      createdUid
    );

    setSuccessMsg(`✓ Welcome ${name.trim()}! Account registered successfully.`);
    setTimeout(() => {
      onClose();
    }, 600);
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

  // Verification Completion & Save Phone Number
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

    const accounts = getRegisteredAccounts();
    const cleanPhone = verificationPhone.replace(/[^0-9]/g, '');

    const accountData = {
      name: name || 'Kroyghor Member',
      email: email.trim().toLowerCase() || `${cleanPhone}@kroyghor.com`,
      phone: cleanPhone,
      password: regPassword || 'google-auth-verified',
      isPhoneVerified: true,
      authProvider: authProvider,
      avatar: userAvatar,
      address: {
        fullName: name || 'Kroyghor Member',
        phone: cleanPhone,
        cityDivision,
        fullAddress,
      },
      registeredAt: new Date().toISOString(),
    };

    const existingIndex = accounts.findIndex((a: any) => a.phone === cleanPhone || (email && a.email === email.toLowerCase()));
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...accountData };
    } else {
      accounts.push(accountData);
    }
    localStorage.setItem('kroyghor_registered_accounts', JSON.stringify(accounts));
    localStorage.setItem('zeropicbd_registered_accounts', JSON.stringify(accounts));

    const newAddress: Address = {
      fullName: name || 'Kroyghor Member',
      phone: cleanPhone,
      cityDivision,
      fullAddress,
    };

    onSignup(name || 'Kroyghor Member', email, cleanPhone, newAddress, true, authProvider, userAvatar);

    if (onVerifyPhoneSuccess) {
      onVerifyPhoneSuccess(cleanPhone);
    }

    setSmsToast(null);
    setSuccessMsg(`✓ Mobile number ${cleanPhone} verified successfully.`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  // Traditional Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const inputVal = loginEmailOrPhone.trim().toLowerCase();
    const cleanPhone = inputVal.replace(/[^0-9]/g, '');

    if (!inputVal) {
      setErrorMsg('⚠️ অনুগ্রহ করে ইমেইল অথবা মোবাইল নম্বর লিখুন।');
      return;
    }

    if (!loginPassword) {
      setErrorMsg('⚠️ অনুগ্রহ করে পাসওয়ার্ড দিন।');
      return;
    }

    // Determine target email for Firebase Auth
    const targetEmail = inputVal.includes('@')
      ? inputVal
      : cleanPhone && cleanPhone.length === 11
        ? `${cleanPhone}@kroyghor.com`
        : inputVal;

    let authUid: string | undefined = undefined;

    if (isFirebaseConfigured()) {
      try {
        const authRes = await signInUserWithEmailAndPassword(targetEmail, loginPassword);
        authUid = authRes.uid;
      } catch (fErr: any) {
        console.error('[AuthModal] Firebase Auth sign in error:', fErr);
        let userFriendlyMsg = '❌ পাসওয়ার্ড বা ইমেইল ভুল হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিয়ে চেষ্টা করুন।';
        if (fErr?.code === 'auth/invalid-credential' || fErr?.code === 'auth/wrong-password') {
          userFriendlyMsg = '❌ পাসওয়ার্ড বা ইমেইল ভুল হয়েছে। অনুগ্রহ করে সঠিক তথ্য দিয়ে চেষ্টা করুন।';
        } else if (fErr?.code === 'auth/user-not-found') {
          userFriendlyMsg = '❌ এই ইমেইল/ফোন নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে রেজিস্টার করুন।';
        } else if (fErr?.code === 'auth/invalid-email') {
          userFriendlyMsg = '❌ অকার্যকর ইমেইল ঠিকানা। অনুগ্রহ করে সঠিক ইমেইল দিন।';
        } else if (fErr?.code === 'auth/too-many-requests') {
          userFriendlyMsg = '❌ অনেকবার ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        } else if (fErr?.code === 'auth/operation-not-allowed') {
          userFriendlyMsg = '❌ Firebase Console-এ Email/Password Authentication সক্রিয় করা নেই।';
        } else if (fErr?.message) {
          userFriendlyMsg = `❌ Login Error: ${fErr.message}`;
        }
        setErrorMsg(userFriendlyMsg);
        return; // Stop! Do not proceed with fake local login if Firebase Auth fails!
      }
    }

    const accounts = getRegisteredAccounts();
    const matched = accounts.find((acc: any) => 
      (cleanPhone && acc.phone === cleanPhone) || 
      (acc.email && acc.email.toLowerCase() === inputVal) ||
      (acc.email && acc.email.toLowerCase() === targetEmail.toLowerCase())
    );

    const displayName = matched?.name || (inputVal.includes('@') ? inputVal.split('@')[0] : 'Kroyghor Member');
    const userPhone = matched?.phone || cleanPhone;
    const userEmail = matched?.email || targetEmail;

    onLogin(
      displayName,
      userEmail,
      userPhone,
      matched?.isPhoneVerified ?? true,
      matched?.authProvider || 'email',
      matched?.avatar,
      authUid || matched?.uid
    );

    setSuccessMsg(`স্বাগতম ${displayName}! সফলভাবে লগইন হয়েছে।`);
    setTimeout(() => {
      setSuccessMsg(null);
      setTab('profile');
    }, 600);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
        <div 
          id="auth-modal"
          className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 hover:border-orange-200 p-6 sm:p-8 shadow-2xl text-slate-900 transition-colors animate-modalEnter"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer z-10"
            aria-label="Close auth modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Badge ("KROYGHOR ACCOUNT") */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-xs font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                KROYGHOR ACCOUNT
              </span>
            </div>
            
            <div className="mb-2">
              <BrandLogo size="md" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {user.isLoggedIn 
                ? 'Your Account & Wallet' 
                : tab === 'login' 
                  ? 'Welcome Back to Kroyghor' 
                  : 'Create Your Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {user.isLoggedIn 
                ? 'Manage your wallet balance & delivery address'
                : 'Sign in with Google or create an account with Email & Password.'}
            </p>
          </div>

          {/* Simulated Live SMS Alert Toast Banner */}
          {smsToast && (
            <div className="mb-4 p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-orange-950 text-xs shadow-xs flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-900 uppercase text-[10px] tracking-wider">
                    💬 SMS OTP Delivery
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(smsToast.code.split(''));
                    }}
                    className="text-[10px] bg-orange-600 text-white font-bold px-2 py-0.5 rounded hover:bg-orange-700 cursor-pointer transition-colors"
                  >
                    Auto Fill
                  </button>
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  Verification code for <strong className="font-mono text-slate-900">{smsToast.phone}</strong> is:
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-white border border-orange-300 font-mono font-black text-orange-600 text-base tracking-widest shadow-2xs">
                    {smsToast.code}
                  </span>
                  <span className="text-[10px] text-slate-500">Valid for 5 mins</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Login / Register) */}
          {!user.isLoggedIn && tab !== 'otp' && tab !== 'phone_verify' && (
            <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(null); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setErrorMsg(null); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Firebase Unauthorized Domain Notice */}
          {unauthorizedDomain && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <span>Firebase Domain Authorization Required</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Domain <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">{unauthorizedDomain}</code> must be authorized in Firebase Console to enable Google OAuth login.
              </p>
              <p className="text-[10px] text-amber-700 font-mono font-semibold">
                Steps: Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains &gt; Add Domain "{unauthorizedDomain}"
              </p>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {!user.isLoggedIn && tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email or Phone Number*
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="login-email-phone"
                    type="text"
                    required
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX or user@gmail.com"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password*
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Vibrant Orange LOGIN CTA */}
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] mt-2"
              >
                <span>LOGIN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Sleek Continue with Google Button */}
              <button
                type="button"
                id="google-signin-btn-login"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignInClick}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-orange-300 font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                ) : (
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                )}
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </form>
          )}

          {/* ================= REGISTER FORM ================= */}
          {!user.isLoggedIn && tab === 'signup' && (
            <div className="space-y-4">
              {/* Clear YouTube Signup Bonus Banner Notice */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-orange-500/10 border border-red-200/90 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Youtube className="w-4.5 h-4.5 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      Get 20 BDT Signup Bonus after subscribing to our YouTube channel
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      রেজিস্ট্রেশন করে আমাদের অফিশিয়াল YouTube চ্যানেল সাবস্ক্রাইব করলেই সাথে সাথে ওয়ালেটে ৳২০ বোনাস যুক্ত হবে।
                    </p>
                    <a
                      href="https://www.youtube.com/@kroy-ghor-office"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                    >
                      <span>Visit Channel (@kroy-ghor-office)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name*
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional - can add anytime in profile or at checkout)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX (Optional)"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-mono font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password*
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Vibrant Orange CREATE ACCOUNT CTA */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] mt-3"
              >
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                id="google-signin-btn-signup"
                disabled={isGoogleLoading}
                onClick={handleGoogleSignInClick}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-orange-300 font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                ) : (
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                )}
                <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </form>
          </div>
        )}

          {/* ================= PHONE VERIFICATION STEP ================= */}
          {!user.isLoggedIn && tab === 'phone_verify' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-950">
                <p className="font-bold">Connect Mobile Number</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Verify your 11-digit mobile number for faster checkout and order tracking.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  11-digit Phone Number*
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    maxLength={11}
                    value={verificationPhone}
                    onChange={(e) => setVerificationPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerSendOtp(verificationPhone, name)}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>SEND OTP CODE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================= OTP INPUT SCREEN ================= */}
          {!user.isLoggedIn && tab === 'otp' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 mx-auto flex items-center justify-center text-2xl shadow-xs">
                📱
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Mobile SMS OTP Verification</h3>
                <p className="text-xs text-slate-500 mt-1">
                  4-digit verification code sent to:<br />
                  <span className="text-orange-600 font-mono font-bold">{verificationPhone}</span>
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
                    className="w-12 h-14 text-center text-2xl font-black text-orange-600 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-orange-500 font-mono"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all cursor-pointer"
              >
                Verify Code & Save Phone
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={() => triggerSendOtp(verificationPhone, name)}
                  className={`text-xs flex items-center gap-1 cursor-pointer ${
                    resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab(authProvider === 'google' ? 'phone_verify' : 'signup')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  ← Edit Number
                </button>
              </div>
            </div>
          )}

          {/* ================= LOGGED IN QUICK PROFILE & WALLET ================= */}
          {user.isLoggedIn && (
            <div className="space-y-5">
              {/* Wallet Card */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-md text-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-orange-400 font-bold">
                        Kroyghor Wallet
                      </span>
                      {user.isPhoneVerified && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-1">{user.name}</h3>
                    <p className="text-xs text-slate-300 font-mono">{user.phone || user.email}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-amber-300 border border-orange-400/30">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                  <div>
                    <span className="text-xs text-slate-300 block">Live Wallet Balance</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">
                        ৳{user.walletBalance || 0}
                      </span>
                      <span className="text-xs text-slate-300">BDT</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold inline-block">
                      ✓ Instant Discount
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Access to Full Customer Portal */}
              {onOpenCustomerPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomerPortal();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-950 font-bold text-xs flex items-center justify-center gap-2 border border-orange-200 shadow-2xs transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-orange-600" />
                  <span>Open Full Customer Account & Orders Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* Saved Address */}
              <form onSubmit={handleSaveAddressOnly} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    Delivery Address
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-fills at checkout</span>
                </div>

                <div>
                  <select
                    value={cityDivision}
                    onChange={(e) => setCityDivision(e.target.value as 'Inside Dhaka' | 'Outside Dhaka')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="Inside Dhaka">Inside Dhaka (Delivery ৳60)</option>
                    <option value="Outside Dhaka">Outside Dhaka (Delivery ৳120)</option>
                  </select>
                </div>

                <textarea
                  rows={2}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="House no, Road no, Area, Thana..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Update Address
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* ================= ৳20 WELCOME BONUS REWARD CELEBRATION MODAL ================= */}
      {rewardCelebration && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 border border-orange-200">
            <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-300 mx-auto flex items-center justify-center text-amber-600 shadow-md">
              <Coins className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700 uppercase tracking-wider">
                🎉 Welcome Bonus Credited!
              </span>
              <h3 className="text-xl font-black text-slate-900 pt-1">
                Congratulations, {rewardCelebration.accountName}!
              </h3>
              <p className="text-xs text-slate-600">
                Mobile number <strong className="font-mono text-orange-700">{rewardCelebration.phone}</strong> verified successfully.
              </p>
            </div>

            {/* Bonus Display Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border border-orange-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                New Wallet Balance
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-400 line-through font-mono text-sm">৳0</span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
                <span className="text-3xl font-black font-mono text-orange-600">
                  ৳{rewardCelebration.amount}
                </span>
                <span className="text-xs font-bold text-slate-500">BDT</span>
              </div>
              <p className="text-[11px] text-orange-700 font-semibold pt-1 border-t border-orange-200/60">
                ✓ Use this ৳20 directly at checkout on your next order!
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
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                View Customer Dashboard & Orders
              </button>

              <button
                onClick={() => {
                  setRewardCelebration(null);
                  onClose();
                }}
                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthModal;
