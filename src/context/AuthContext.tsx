import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  auth,
  isFirebaseConfigured,
  getUserRoleFromFirestore,
  syncUserDocumentInFirestore,
  subscribeToFirebaseAuthState,
  checkGoogleRedirectResult,
  firebaseSignOut,
} from '../lib/firebaseAuth';
import { createSession, setStoredSession } from '../services/authService';
import { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  refreshRoleFromFirestore: (uid?: string, email?: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  isLoggedIn: false,
  name: '',
  email: '',
  phone: '',
  role: 'customer',
  walletBalance: 0,
  hasReceivedBonus: false,
  isPhoneVerified: false,
  authProvider: 'google',
  walletHistory: [],
  address: {
    fullName: '',
    phone: '',
    cityDivision: 'Inside Dhaka',
    fullAddress: '',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; userState: UserProfile; onUpdateUser: (u: UserProfile) => void }> = ({
  children,
  userState,
  onUpdateUser,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Detect whether browser just returned from Google OAuth redirect
  const isRedirectPending = (() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const pending = sessionStorage.getItem('kroyghor_google_redirect_in_progress') === 'true';
      const ts = parseInt(sessionStorage.getItem('kroyghor_google_redirect_timestamp') || '0', 10);
      if (pending && Date.now() - ts < 5 * 60 * 1000) {
        return true;
      }
    }
    return false;
  })();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirectResolving, setIsRedirectResolving] = useState<boolean>(isRedirectPending);

  // Keep references to prevent stale closures inside async auth listeners
  const onUpdateUserRef = useRef(onUpdateUser);
  onUpdateUserRef.current = onUpdateUser;
  const userStateRef = useRef(userState);
  userStateRef.current = userState;

  // Sync profile, role, and wallet balance with Firestore database (`users/{uid}`)
  const refreshRoleFromFirestore = async (uid?: string, email?: string): Promise<UserRole> => {
    const targetUid = uid || firebaseUser?.uid || userStateRef.current.email || 'guest';
    const targetEmail = email || firebaseUser?.email || userStateRef.current.email;

    const synced = await syncUserDocumentInFirestore({
      uid: targetUid,
      email: targetEmail,
      displayName: userStateRef.current.name,
      photoURL: userStateRef.current.avatar,
    });

    onUpdateUserRef.current({
      ...userStateRef.current,
      role: synced.role,
      walletBalance: synced.walletBalance,
      hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus,
    });

    return synced.role;
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Explicitly check getRedirectResult upon application mount
    const handleRedirectResult = async () => {
      if (!isFirebaseConfigured() || !auth) {
        if (isMounted) {
          setIsLoading(false);
          setIsRedirectResolving(false);
        }
        return;
      }

      try {
        console.log('[AuthContext] Processing getRedirectResult check...');
        const redirectResult = await checkGoogleRedirectResult();
        if (redirectResult && isMounted) {
          console.log('[AuthContext] Redirect login confirmed for:', redirectResult.email, redirectResult.uid);

          const synced = await syncUserDocumentInFirestore({
            uid: redirectResult.uid,
            email: redirectResult.email,
            displayName: redirectResult.displayName,
            photoURL: redirectResult.photoURL,
          });

          const isOwner = (redirectResult.email || '').toLowerCase() === 'wapp7272@gmail.com';
          const resolvedRole: UserRole = isOwner ? 'super_admin' : (synced.role || 'customer');
          const session = userStateRef.current.session || createSession(redirectResult.email, '', resolvedRole);
          setStoredSession(session);

          const updated: UserProfile = {
            ...userStateRef.current,
            uid: redirectResult.uid,
            isLoggedIn: true,
            name: synced.displayName || redirectResult.displayName || 'Kroy Ghor Member',
            email: synced.email || redirectResult.email,
            role: resolvedRole,
            session,
            walletBalance: synced.walletBalance ?? 0,
            hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus ?? false,
            isPhoneVerified: true,
            authProvider: 'google',
            avatar: synced.photoURL || redirectResult.photoURL || userStateRef.current.avatar,
          };

          onUpdateUserRef.current(updated);
          localStorage.setItem('zeropicbd_user', JSON.stringify(updated));
          localStorage.setItem('primevault_user', JSON.stringify(updated));
        }
      } catch (err) {
        console.error('[AuthContext] Error handling redirect result:', err);
      } finally {
        if (isMounted) {
          setIsRedirectResolving(false);
        }
      }
    };

    handleRedirectResult();

    // 2. Persistent onAuthStateChanged listener across all page routes and re-renders
    const unsubscribe = subscribeToFirebaseAuthState(async (fUser) => {
      if (!isMounted) return;
      setFirebaseUser(fUser);

      if (fUser) {
        console.log('[AuthContext] onAuthStateChanged user detected:', fUser.email, fUser.uid);
        try {
          const synced = await syncUserDocumentInFirestore({
            uid: fUser.uid,
            email: fUser.email,
            displayName: fUser.displayName,
            photoURL: fUser.photoURL,
          });

          const isOwner = (fUser.email || '').toLowerCase() === 'wapp7272@gmail.com';
          const resolvedRole: UserRole = isOwner ? 'super_admin' : (synced.role || 'customer');
          const session = userStateRef.current.session || createSession(fUser.email || '', '', resolvedRole);
          setStoredSession(session);

          const updated: UserProfile = {
            ...userStateRef.current,
            uid: fUser.uid,
            isLoggedIn: true,
            name: synced.displayName || fUser.displayName || userStateRef.current.name || 'Kroy Ghor Member',
            email: synced.email || fUser.email || userStateRef.current.email,
            role: resolvedRole,
            session,
            walletBalance: synced.walletBalance ?? 0,
            hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus ?? false,
            avatar: synced.photoURL || fUser.photoURL || userStateRef.current.avatar,
          };

          onUpdateUserRef.current(updated);
          localStorage.setItem('zeropicbd_user', JSON.stringify(updated));
          localStorage.setItem('primevault_user', JSON.stringify(updated));
        } catch (e) {
          console.warn('[AuthContext] Background firestore sync error:', e);
        }
      }

      setIsLoading(false);
    });

    // Safety timeout: ensure loading screen resolves even on spotty networks
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        setIsRedirectResolving(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await firebaseSignOut();
    onUpdateUserRef.current({
      ...defaultUser,
    });
    localStorage.removeItem('primevault_auth_session');
    localStorage.removeItem('zeropicbd_user');
    localStorage.removeItem('primevault_user');
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    const updatedState = {
      ...userStateRef.current,
      ...updated,
    };
    onUpdateUserRef.current(updatedState);
    localStorage.setItem('zeropicbd_user', JSON.stringify(updatedState));
    localStorage.setItem('primevault_user', JSON.stringify(updatedState));
  };

  const isAdmin = Boolean(
    userState.isLoggedIn && (userState.role === 'admin' || userState.role === 'super_admin')
  );

  // If redirect from Google accounts is currently resolving, render dedicated loading overlay
  if (isRedirectResolving) {
    return (
      <AuthContext.Provider
        value={{
          user: userState,
          firebaseUser,
          role: userState.role,
          isLoading: true,
          isAdmin,
          refreshRoleFromFirestore,
          logout,
          updateUser,
        }}
      >
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-800 font-bold text-base">গুগল অ্যাকাউন্টে লগইন যাচাই করা হচ্ছে...</p>
          <p className="text-slate-500 text-sm mt-1">Completing your Google sign-in. Please wait a moment.</p>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        firebaseUser,
        role: userState.role,
        isLoading,
        isAdmin,
        refreshRoleFromFirestore,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
