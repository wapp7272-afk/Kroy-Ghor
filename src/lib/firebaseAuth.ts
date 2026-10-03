import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
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

// Read Firebase configuration from environment variables with import.meta.env
const getAuthDomain = () => {
  const envDomain = (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN;
  if (envDomain) return envDomain;
  const projectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
  if (projectId) return `${projectId}.firebaseapp.com`;
  return 'zeropic-bd.vercel.app';
};

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: getAuthDomain(),
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
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
  const displayName = fUser.displayName || (email ? email.split('@')[0] : 'ZeropicBD Member');
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
      // New user doc payload created in non-blocking background
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

      setDoc(userDocRef, newDocPayload).catch((err) => {
        console.warn('[FirestoreSync] Background setDoc error:', err);
      });

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
}

/**
 * Initiates real Google OAuth Sign-In using Firebase Auth
 * Supports signInWithPopup on desktop and falls back to signInWithRedirect on mobile / popup blocked
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error(
      'Firebase Authentication is not configured. Please add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID in your environment variables.'
    );
  }

  // Safety 10-second timeout promise so Google OAuth never hangs UI permanently
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Google Sign-In connection timed out. Please try clicking again.'));
    }, 10000);
  });

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  try {
    let result;
    if (isMobile) {
      try {
        result = await Promise.race([signInWithPopup(auth, googleProvider), timeoutPromise]);
      } catch (popupErr: any) {
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, googleProvider);
          throw new Error('Redirecting to Google Sign-In...');
        }
        throw popupErr;
      }
    } else {
      result = await Promise.race([signInWithPopup(auth, googleProvider), timeoutPromise]);
    }

    const user = result.user;
    const idToken = await user.getIdToken().catch(() => undefined);

    // Non-blocking background sync with Firestore (fire-and-forget: do NOT await!)
    syncUserDocumentInFirestore({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }).catch((err) => {
      console.warn('[FirebaseAuth] Non-fatal background Firestore sync error:', err);
    });

    const displayName = user.displayName || user.email?.split('@')[0] || 'ZeropicBD Member';

    return {
      uid: user.uid,
      displayName,
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      idToken,
    };
  } catch (error: any) {
    console.error('[FirebaseAuth] Google Sign-In error:', error);

    // Provide clear, actionable error messages
    if (error?.code === 'auth/unauthorized-domain') {
      const customErr: any = new Error(
        `This domain (${window.location.hostname}) is not authorized in your Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${window.location.hostname}".`
      );
      customErr.code = 'auth/unauthorized-domain';
      customErr.domain = window.location.hostname;
      throw customErr;
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google Sign-In was cancelled.');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
    }
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network connection failed. Please check your internet connection.');
    }

    throw new Error(error.message || 'Google Sign-In failed. Please try again.');
  }
};

/**
 * Checks for any redirect result when app reloads on mobile
 */
export const checkGoogleRedirectResult = async (): Promise<GoogleAuthResult | null> => {
  if (!isFirebaseConfigured() || !auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const idToken = await user.getIdToken().catch(() => undefined);
      return {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Zeropicbd Member',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        idToken,
      };
    }
  } catch (error) {
    console.error('[FirebaseAuth] Redirect result check error:', error);
  }
  return null;
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
