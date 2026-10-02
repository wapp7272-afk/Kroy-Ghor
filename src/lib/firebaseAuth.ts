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

// Read Firebase configuration from environment variables with import.meta.env
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'zeropic-bd.vercel.app',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

/**
 * Checks if Firebase environment variables are provided
 */
export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && (firebaseConfig.projectId || firebaseConfig.authDomain));
};

// Initialize Firebase App singleton
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.error('[FirebaseAuth] Initialization error:', error);
  }
}

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

  // Detect mobile user agent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  try {
    if (isMobile) {
      // Use redirect on mobile for seamless mobile browser support
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken().catch(() => undefined);
        return {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Zeropicbd Member',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          idToken,
        };
      } catch (popupErr: any) {
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/popup-closed-by-user') {
          // Fallback to redirect
          await signInWithRedirect(auth, googleProvider);
          throw new Error('Redirecting to Google Sign-In...');
        }
        throw popupErr;
      }
    } else {
      // Desktop: Popup flow
      const result = await signInWithPopup(auth, googleProvider);
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
  } catch (error: any) {
    console.error('[FirebaseAuth] Google Sign-In error:', error);

    // Provide clear, actionable error messages
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error(
        `This domain (${window.location.hostname}) is not authorized in your Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${window.location.hostname}".`
      );
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
