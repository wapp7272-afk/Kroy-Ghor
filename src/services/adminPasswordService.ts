import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';

const ADMIN_LOCK_DOC = 'admin_lock';
const SESSION_UNLOCK_KEY = 'kroyghor_admin_unlocked_session';

/**
 * Simple, fast hash for client-side password verification
 */
export const hashPassword = async (plainText: string): Promise<string> => {
  if (!plainText) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`kroyghor_admin_salt_${plainText}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('[AdminPassword] SHA-256 unavailable, fallback encoding:', e);
  }
  // Simple fallback hash
  let hash = 0;
  const str = `kroyghor_salt_${plainText}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `kg_hash_${Math.abs(hash)}`;
};

/**
 * Checks if a Super Admin password has already been set in Firestore
 */
export const checkSuperAdminPasswordStatus = async (): Promise<{
  hasPassword: boolean;
  passwordHash?: string;
}> => {
  // Check local storage session cache first
  try {
    const cachedHash = localStorage.getItem('kroyghor_admin_pass_hash');
    if (cachedHash) {
      return { hasPassword: true, passwordHash: cachedHash };
    }
  } catch {}

  if (!db) {
    return { hasPassword: false };
  }

  try {
    const lockRef = doc(db, 'settings', ADMIN_LOCK_DOC);
    const snap = await getDoc(lockRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data && data.passwordHash) {
        try {
          localStorage.setItem('kroyghor_admin_pass_hash', data.passwordHash);
        } catch {}
        return { hasPassword: true, passwordHash: data.passwordHash };
      }
    }
  } catch (err) {
    console.warn('[AdminPassword] Error checking password status in Firestore:', err);
  }

  return { hasPassword: false };
};

/**
 * Sets initial Super Admin Password in Firestore settings/admin_lock
 */
export const setInitialSuperAdminPassword = async (
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const hashed = await hashPassword(newPassword);

  try {
    localStorage.setItem('kroyghor_admin_pass_hash', hashed);
    sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
  } catch {}

  if (db) {
    try {
      const lockRef = doc(db, 'settings', ADMIN_LOCK_DOC);
      await setDoc(
        lockRef,
        {
          passwordHash: hashed,
          isSet: true,
          updatedAt: serverTimestamp(),
          updatedBy: 'wapp7272@gmail.com',
        },
        { merge: true }
      );
      console.log('[AdminPassword] Successfully saved initial Super Admin password hash in Firestore settings/admin_lock');
    } catch (err: any) {
      console.error('[AdminPassword] Firestore save error:', err);
      // Saved in localStorage cache so setup still succeeds
    }
  }

  return { success: true };
};

/**
 * Verifies entered password against Firestore / localStorage Super Admin password
 */
export const verifySuperAdminPassword = async (
  enteredPassword: string
): Promise<{ isValid: boolean; error?: string }> => {
  if (!enteredPassword) {
    return { isValid: false, error: 'Please enter your Super Admin password.' };
  }

  const enteredHash = await hashPassword(enteredPassword);
  const status = await checkSuperAdminPasswordStatus();

  if (!status.hasPassword) {
    return { isValid: false, error: 'Super Admin password has not been set yet.' };
  }

  if (status.passwordHash === enteredHash) {
    try {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
    } catch {}
    return { isValid: true };
  }

  return { isValid: false, error: 'Incorrect password. Access denied.' };
};

/**
 * Changes Super Admin Password in Firestore
 */
export const changeSuperAdminPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  if (!currentPassword) {
    return { success: false, error: 'Please enter your current password.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const verification = await verifySuperAdminPassword(currentPassword);
  if (!verification.isValid) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  return setInitialSuperAdminPassword(newPassword);
};

/**
 * Checks if current browser session has unlocked Super Admin dashboard
 */
export const isSuperAdminSessionUnlocked = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Locks Super Admin session
 */
export const lockSuperAdminSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  } catch {}
};
