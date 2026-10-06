import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  setLogLevel, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Firestore 
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Read Firebase configuration from active Vercel environment variables
const envApiKey = ((import.meta as any).env?.VITE_FIREBASE_API_KEY || '').trim();
const envProjectId = ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '').trim();
const envAuthDomain = ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
const envStorageBucket = ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
const envMessagingSenderId = ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
const envAppId = ((import.meta as any).env?.VITE_FIREBASE_APP_ID || '').trim();

export const getAuthDomain = (): string => {
  if (envAuthDomain && !envAuthDomain.includes('zeropic') && !envAuthDomain.includes('undefined')) {
    // If set to naked kroyghor.vercel.app, route to official firebaseapp domain where auth handler lives
    if (envAuthDomain === 'kroyghor.vercel.app') {
      return envProjectId ? `${envProjectId}.firebaseapp.com` : (appletConfig.authDomain || 'gen-lang-client-0150585131.firebaseapp.com');
    }
    return envAuthDomain;
  }
  if (envProjectId) {
    return `${envProjectId}.firebaseapp.com`;
  }
  return appletConfig.authDomain || 'gen-lang-client-0150585131.firebaseapp.com';
};

export const firebaseConfig = {
  apiKey: envApiKey || appletConfig.apiKey || '',
  authDomain: getAuthDomain(),
  projectId: envProjectId || appletConfig.projectId || '',
  storageBucket: envStorageBucket || (envProjectId ? `${envProjectId}.firebasestorage.app` : appletConfig.storageBucket || ''),
  messagingSenderId: envMessagingSenderId || appletConfig.messagingSenderId || '',
  appId: envAppId || appletConfig.appId || '',
};

/**
 * Checks if Firebase environment variables are provided
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== 'undefined' && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== 'undefined'
  );
};

// Initialize Firebase App singleton
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Explicitly configure browserLocalPersistence to guarantee auth state persists across redirects and refreshes
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[FirebaseAuth] Persistence configuration notice:', err);
    });

    try {
      setLogLevel('silent');
    } catch {}

    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      try {
        db = initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        });
      } catch {
        db = getFirestore(app);
      }
    }

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.warn('[FirebaseAuth] Initialization notice:', error);
  }
}

export { app, auth, db };

/**
 * Syncs user document in Firestore (`users/{uid}`) upon login/signup
 * Creates permanent doc with default fields if new user, or updates lastLoginAt if existing user
 * Non-blocking: Uses a 2-second timeout fallback so network latency never blocks UI
 */
export const syncUserDocumentInFirestore = async (
  fUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'customer' | 'seller' | 'admin' | 'super_admin';
  walletBalance: number;
  hasClaimedYouTubeBonus: boolean;
}> => {
  const uid = fUser.uid;
  const email = (fUser.email || '').trim();
  const displayName = fUser.displayName || (email ? email.split('@')[0] : 'Kroyghor Member');
  const photoURL = fUser.photoURL || '';

  const isOwner = email.toLowerCase() === 'wapp7272@gmail.com';
  const defaultRole = isOwner ? 'super_admin' : 'customer';

  const defaultResult = {
    uid,
    email,
    displayName,
    photoURL,
    role: defaultRole as 'customer' | 'seller' | 'admin' | 'super_admin',
    walletBalance: 0,
    hasClaimedYouTubeBonus: false,
  };

  if (!db || !uid) {
    return defaultResult;
  }

  try {
    const userDocRef = doc(db, 'users', uid);

    // Fast 2-second timeout fallback so slow Firestore queries never stall authentication
    const getDocPromise = getDoc(userDocRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));

    const userDocSnap = await Promise.race([getDocPromise, timeoutPromise]);

    if (userDocSnap && userDocSnap.exists()) {
      const data = userDocSnap.data();

      // Update lastLoginAt in non-blocking background
      updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        ...(displayName && !data.displayName ? { displayName } : {}),
        ...(photoURL && !data.photoURL ? { photoURL } : {}),
      }).catch(() => {
        setDoc(userDocRef, { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      });

      const role = (data.role || defaultRole) as 'customer' | 'seller' | 'admin' | 'super_admin';
      const walletBalance = typeof data.walletBalance === 'number' ? data.walletBalance : 0;
      const hasClaimedYouTubeBonus = Boolean(data.hasClaimedYouTubeBonus || data.hasReceivedBonus);

      return {
        uid,
        email: data.email || email,
        displayName: data.displayName || displayName,
        photoURL: data.photoURL || photoURL,
        role,
        walletBalance,
        hasClaimedYouTubeBonus,
      };
    } else {
      // New user doc payload created and confirmed in Firestore
      const newDocPayload = {
        uid,
        email,
        displayName,
        photoURL,
        role: defaultRole,
        walletBalance: 0,
        hasClaimedYouTubeBonus: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      try {
        await setDoc(userDocRef, newDocPayload);
        console.log('[FirestoreSync] Successfully written new customer profile to Firestore users/', uid);
      } catch (err) {
        console.warn('[FirestoreSync] Error writing customer profile to Firestore:', err);
      }

      return defaultResult;
    }
  } catch (error) {
    console.error('[FirestoreSync] Error syncing user document in users/{uid}:', error);
    return defaultResult;
  }
};

/**
 * Fetches user profile directly from backend Firestore database (`users/{uid}`)
 */
export const getUserProfileFromFirestore = async (uid: string) => {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
  } catch (err) {
    console.error('[Firestore] Error fetching user profile from users/{uid}:', err);
  }
  return null;
};

/**
 * Fetches user role directly from backend Firestore database (`users/{uid}` document -> `role` field)
 */
export const getUserRoleFromFirestore = async (
  uid: string,
  email?: string
): Promise<'admin' | 'super_admin' | 'seller' | 'customer'> => {
  const isOwnerEmail = email && email.toLowerCase() === 'wapp7272@gmail.com';
  const fallbackRole = isOwnerEmail ? 'super_admin' : 'customer';

  if (!db || !uid) {
    return fallbackRole;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      if (data?.role) {
        return data.role as 'admin' | 'super_admin' | 'seller' | 'customer';
      }
    }

    // Initialize/sync user document in Firestore if doc does not exist yet
    await setDoc(
      userDocRef,
      {
        uid,
        email: email || '',
        role: fallbackRole,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});

    return fallbackRole;
  } catch (error) {
    console.error('[Firestore] Error fetching user role from users/{uid}:', error);
    return fallbackRole;
  }
};

/**
 * Sets or updates user role in backend Firestore database (`users/{uid}`)
 */
export const setUserRoleInFirestore = async (
  uid: string,
  role: 'admin' | 'super_admin' | 'seller' | 'customer',
  email?: string
): Promise<void> => {
  if (!db || !uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        uid,
        email: email || '',
        role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[Firestore] Error updating user role in users/{uid}:', error);
  }
};

export interface GoogleAuthResult {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  idToken?: string;
  redirecting?: boolean;
}

/**
 * Accurately detects whether the client is a mobile device/browser
 */
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  const isNarrowScreen = window.innerWidth <= 768;
  return isMobileUA || (isTouchDevice && isNarrowScreen);
};

/**
 * Initiates real Google OAuth Sign-In using Firebase Auth
 * Uses signInWithPopup on both mobile and desktop by default (avoiding mobile browser cross-domain cookie drop)
 * Falls back to signInWithRedirect ONLY if popup is blocked by the mobile browser
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  console.log('[FirebaseAuth] signInWithGoogle initiated');

  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    const configError = new Error(
      'Firebase Authentication is not configured. Please add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your environment variables.'
    );
    console.error('[FirebaseAuth] Configuration error:', configError);
    throw configError;
  }

  // Ensure local persistence is active across domains without yielding synchronous user gesture loop
  setPersistence(auth, browserLocalPersistence).catch((persistenceErr) => {
    console.warn('[FirebaseAuth] Persistence setup notice:', persistenceErr);
  });

  try {
    console.log('[FirebaseAuth] Opening Google Auth popup with signInWithPopup...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[FirebaseAuth] signInWithPopup SUCCESS! User:', result.user.email, 'UID:', result.user.uid);

    const user = result.user;
    const idToken = await user.getIdToken().catch(() => undefined);

    // Non-blocking background sync with Firestore
    syncUserDocumentInFirestore({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }).catch((err) => {
      console.warn('[FirebaseAuth] Non-fatal background Firestore sync notice:', err);
    });

    const displayName = user.displayName || user.email?.split('@')[0] || 'Kroy Ghor Member';

    return {
      uid: user.uid,
      displayName,
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      idToken,
    };
  } catch (popupErr: any) {
    const errCode = popupErr?.code || '';
    const errMsg = popupErr?.message || '';
    console.warn('[FirebaseAuth] signInWithPopup encountered error. Code:', errCode, 'Message:', errMsg, popupErr);

    // User explicitly cancelled or closed popup - do NOT redirect
    if (errCode === 'auth/popup-closed-by-user') {
      const cancelErr: any = new Error('Google Sign-In was cancelled.');
      cancelErr.code = 'auth/popup-closed-by-user';
      throw cancelErr;
    }

    // ONLY fallback to signInWithRedirect if popup was blocked by browser
    if (errCode === 'auth/popup-blocked') {
      console.log('[FirebaseAuth] Pop-up was blocked by browser. Falling back to signInWithRedirect...');
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('kroyghor_google_redirect_in_progress', 'true');
          sessionStorage.setItem('kroyghor_google_redirect_timestamp', Date.now().toString());
        }
        await signInWithRedirect(auth, googleProvider);
        return {
          uid: '',
          displayName: '',
          email: '',
          redirecting: true,
        };
      } catch (redirectErr: any) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('kroyghor_google_redirect_in_progress');
          sessionStorage.removeItem('kroyghor_google_redirect_timestamp');
        }
        console.error('[FirebaseAuth] Fallback signInWithRedirect failed:', redirectErr?.code, redirectErr?.message);
        throw redirectErr;
      }
    }

    // Rethrow error with detailed code logging
    throw popupErr;
  }
};

// Singleton redirect promise so multiple component subscribers share the exact same getRedirectResult
let pendingRedirectCheck: Promise<GoogleAuthResult | null> | null = null;

/**
 * Checks for any redirect result when app reloads on mobile
 */
export const checkGoogleRedirectResult = async (): Promise<GoogleAuthResult | null> => {
  if (!isFirebaseConfigured() || !auth) return null;

  if (pendingRedirectCheck) {
    return pendingRedirectCheck;
  }

  pendingRedirectCheck = (async () => {
    try {
      console.log('[FirebaseAuth] Processing getRedirectResult(auth)...');
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const user = result.user;
        console.log('[FirebaseAuth] getRedirectResult successfully returned user:', user.email, user.uid);
        const idToken = await user.getIdToken().catch(() => undefined);
        const displayName = user.displayName || user.email?.split('@')[0] || 'Kroy Ghor Member';

        // Ensure Firestore customer profile is created/updated in /users/{uid}
        await syncUserDocumentInFirestore({
          uid: user.uid,
          email: user.email,
          displayName,
          photoURL: user.photoURL,
        }).catch((err) => {
          console.warn('[FirebaseAuth] Firestore sync on redirect result error:', err);
        });

        return {
          uid: user.uid,
          displayName,
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          idToken,
        };
      }
      return null;
    } catch (error: any) {
      console.error('[FirebaseAuth] Redirect result check error:', error);
      throw error;
    } finally {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('kroyghor_google_redirect_in_progress');
        sessionStorage.removeItem('kroyghor_google_redirect_timestamp');
      }
    }
  })();

  return pendingRedirectCheck;
};

/**
 * Signs out from Firebase Auth
 */
export const firebaseSignOut = async (): Promise<void> => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('[FirebaseAuth] Sign-out error:', e);
  }
};

/**
 * Subscribes to Firebase onAuthStateChanged
 */
export const subscribeToFirebaseAuthState = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  if (!isFirebaseConfigured() || !auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Signs up a new user with Email & Password in Firebase Authentication
 */
export const signUpWithEmailAndPassword = async (
  email: string,
  pass: string,
  displayName?: string
): Promise<{ uid: string; email: string; displayName: string }> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  await setPersistence(auth, browserLocalPersistence).catch(() => {});
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  const name = displayName || email.split('@')[0] || 'Kroy Ghor Member';

  await syncUserDocumentInFirestore({
    uid: user.uid,
    email: user.email || email,
    displayName: name,
  });

  return {
    uid: user.uid,
    email: user.email || email,
    displayName: name,
  };
};

/**
 * Signs in an existing user with Email & Password in Firebase Authentication
 */
export const signInUserWithEmailAndPassword = async (
  email: string,
  pass: string
): Promise<{ uid: string; email: string; displayName: string }> => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  await setPersistence(auth, browserLocalPersistence).catch(() => {});
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  const displayName = user.displayName || email.split('@')[0] || 'Kroy Ghor Member';

  await syncUserDocumentInFirestore({
    uid: user.uid,
    email: user.email || email,
    displayName,
  });

  return {
    uid: user.uid,
    email: user.email || email,
    displayName,
  };
};
