import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  auth,
  isFirebaseConfigured,
  getUserRoleFromFirestore,
  syncUserDocumentInFirestore,
  subscribeToFirebaseAuthState,
  checkGoogleRedirectResult,
  signInWithGoogle,
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
  signInWithGooglePopup: () => Promise<any>;
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

export const AuthProvider: React.FC<{
  children: ReactNode;
  userState: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onCloseAuthModal?: () => void;
}> = ({
  children,
  userState,
  onUpdateUser,
  onCloseAuthModal,
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
  const [isInitialAuthChecked, setIsInitialAuthChecked] = useState<boolean>(() => {
    return Boolean(userState.isLoggedIn && userState.email);
  });

  // Keep references to prevent stale closures inside async auth listeners
  const onUpdateUserRef = useRef(onUpdateUser);
  onUpdateUserRef.current = onUpdateUser;
  const userStateRef = useRef(userState);
  userStateRef.current = userState;
  const onCloseAuthModalRef = useRef(onCloseAuthModal);
  onCloseAuthModalRef.current = onCloseAuthModal;

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
          setIsInitialAuthChecked(true);
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

          // Immediately close auth modal upon verified redirect login
          if (onCloseAuthModalRef.current) {
            onCloseAuthModalRef.current();
          }
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
      console.log('[AuthContext] onAuthStateChanged fired. User:', fUser ? { email: fUser.email, uid: fUser.uid, displayName: fUser.displayName } : 'No active user');
      if (!isMounted) return;

      if (fUser) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('kroyghor_google_redirect_in_progress');
          sessionStorage.removeItem('kroyghor_google_redirect_timestamp');
        }

        const isOwner = (fUser.email || '').toLowerCase() === 'wapp7272@gmail.com';
        const defaultRole: UserRole = isOwner ? 'super_admin' : 'customer';
        const session = userStateRef.current.session || createSession(fUser.email || '', '', defaultRole);
        setStoredSession(session);

        // Immediate state update so UI and login state update without any delay BEFORE rendering children
        const immediateUser: UserProfile = {
          ...userStateRef.current,
          uid: fUser.uid,
          isLoggedIn: true,
          name: fUser.displayName || userStateRef.current.name || 'Kroy Ghor Member',
          email: fUser.email || userStateRef.current.email,
          role: defaultRole,
          session,
          walletBalance: userStateRef.current.walletBalance ?? 0,
          hasClaimedYouTubeBonus: userStateRef.current.hasClaimedYouTubeBonus ?? false,
          isPhoneVerified: true,
          authProvider: 'google',
          avatar: fUser.photoURL || userStateRef.current.avatar,
        };

        onUpdateUserRef.current(immediateUser);
        localStorage.setItem('zeropicbd_user', JSON.stringify(immediateUser));
        localStorage.setItem('primevault_user', JSON.stringify(immediateUser));
        setFirebaseUser(fUser);

        // Immediately close the login modal once user is authenticated
        if (onCloseAuthModalRef.current) {
          onCloseAuthModalRef.current();
        }

        // Auto-sync Firestore User Document immediately upon auth state change
        syncUserDocumentInFirestore({
          uid: fUser.uid,
          email: fUser.email,
          displayName: fUser.displayName,
          photoURL: fUser.photoURL,
        }).then((synced) => {
          if (!isMounted) return;
          console.log('[AuthContext] onAuthStateChanged Firestore document sync completed for:', synced.email, synced.role);
          const finalRole: UserRole = isOwner ? 'super_admin' : (synced.role || 'customer');
          const finalUser: UserProfile = {
            ...userStateRef.current,
            uid: fUser.uid,
            isLoggedIn: true,
            name: synced.displayName || fUser.displayName || 'Kroy Ghor Member',
            email: synced.email || fUser.email || '',
            role: finalRole,
            walletBalance: synced.walletBalance ?? 0,
            hasClaimedYouTubeBonus: synced.hasClaimedYouTubeBonus ?? false,
            avatar: synced.photoURL || fUser.photoURL || userStateRef.current.avatar,
          };
          onUpdateUserRef.current(finalUser);
          localStorage.setItem('zeropicbd_user', JSON.stringify(finalUser));
          localStorage.setItem('primevault_user', JSON.stringify(finalUser));
        }).catch((e: any) => {
          console.error('[AuthContext] onAuthStateChanged Firestore sync error (check rules):', e?.code, e?.message, e);
        });
      } else {
        setFirebaseUser(null);
      }

      // Resolve loading and initial check state AFTER user state is updated
      setIsLoading(false);
      setIsRedirectResolving(false);
      setIsInitialAuthChecked(true);
    });

    // Fast failsafe to ensure initial check resolves
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        setIsRedirectResolving(false);
        setIsInitialAuthChecked(true);
      }
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGooglePopup = async () => {
    const result = await signInWithGoogle();
    if (!result.redirecting && result.email) {
      if (onCloseAuthModalRef.current) {
        onCloseAuthModalRef.current();
      }
    }
    return result;
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {
      console.warn('[AuthContext] Sign-out notice:', e);
    }
    localStorage.removeItem('primevault_auth_session');
    localStorage.removeItem('zeropicbd_user');
    localStorage.removeItem('primevault_user');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('kroyghor_google_redirect_in_progress');
      sessionStorage.removeItem('kroyghor_google_redirect_timestamp');
    }
    setFirebaseUser(null);
    onUpdateUserRef.current({
      ...defaultUser,
    });
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

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        firebaseUser,
        role: userState.role,
        isLoading,
        isAdmin,
        signInWithGooglePopup,
        refreshRoleFromFirestore,
        logout,
        updateUser,
      }}
    >
      {isRedirectResolving && !userState.isLoggedIn && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-[9999] animate-pulse" />
      )}
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
