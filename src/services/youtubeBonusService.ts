import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';
import { YouTubeBonusClaim } from '../types';

const STORAGE_KEY = 'kroyghor_youtube_bonus_claims';
const LEGACY_STORAGE_KEY = 'zeropicbd_youtube_bonus_claims';

// Helper for local storage persistence fallback when offline
const getLocalClaims = (): YouTubeBonusClaim[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalClaims = (claims: YouTubeBonusClaim[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(claims));
  } catch (e) {
    console.warn('Failed to save local YouTube bonus claims:', e);
  }
};

/**
 * Submit a YouTube Bonus verification request to Firestore backend
 * Enforces strict anti-duplication: checks user.hasClaimedYouTubeBonus in Firestore
 */
export const submitYouTubeBonusClaim = async (
  uid: string,
  userName: string,
  userEmail: string,
  youtubeHandle: string
): Promise<YouTubeBonusClaim> => {
  const handleClean = youtubeHandle.trim().startsWith('@')
    ? youtubeHandle.trim()
    : `@${youtubeHandle.trim()}`;

  // 1. Strict backend check on user document in Firestore
  if (db && uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.hasClaimedYouTubeBonus === true) {
          throw new Error('You have already claimed the ৳20 YouTube subscription bonus.');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('already claimed')) {
        throw err;
      }
      console.warn('[YouTubeBonusService] User doc check warning:', err);
    }
  }

  const claimId = `yt_claim_${uid || Date.now()}`;
  const now = new Date().toISOString();

  const claimData: YouTubeBonusClaim = {
    id: claimId,
    uid: uid || `guest_${Date.now()}`,
    userName: userName || 'Kroy Ghor Member',
    userEmail: userEmail || '',
    youtubeHandle: handleClean,
    amount: 20,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // 2. Save to Firestore backend `youtube_bonus_requests`
  if (db) {
    try {
      const claimRef = doc(db, 'youtube_bonus_requests', claimId);
      await setDoc(claimRef, claimData, { merge: true });

      // Update user document with handle & status
      if (uid) {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            youtubeHandle: handleClean,
            youtubeBonusStatus: 'pending',
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch (e: any) {
      console.error('[YouTubeBonusService] Error saving to Firestore:', e);
    }
  }

  // Fallback to local storage cache
  const claims = getLocalClaims();
  const existingIdx = claims.findIndex((c) => c.uid === claimData.uid || c.id === claimId);
  if (existingIdx >= 0) {
    claims[existingIdx] = claimData;
  } else {
    claims.unshift(claimData);
  }
  saveLocalClaims(claims);

  return claimData;
};

/**
 * Fetch YouTube Bonus Claim status for a specific user from Firestore
 */
export const getUserYouTubeBonusClaim = async (uid: string): Promise<YouTubeBonusClaim | null> => {
  if (!uid) return null;

  if (db) {
    try {
      const claimRef = doc(db, 'youtube_bonus_requests', `yt_claim_${uid}`);
      const claimSnap = await getDoc(claimRef);
      if (claimSnap.exists()) {
        return claimSnap.data() as YouTubeBonusClaim;
      }
    } catch (e) {
      console.warn('[YouTubeBonusService] Error fetching user claim from Firestore:', e);
    }
  }

  // Local fallback
  const claims = getLocalClaims();
  return claims.find((c) => c.uid === uid) || null;
};

/**
 * Fetch all YouTube Bonus Claims for Admin review panel
 */
export const getAllYouTubeBonusClaims = async (): Promise<YouTubeBonusClaim[]> => {
  let firestoreClaims: YouTubeBonusClaim[] = [];

  if (db) {
    try {
      const q = query(collection(db, 'youtube_bonus_requests'));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        firestoreClaims.push(docSnap.data() as YouTubeBonusClaim);
      });
    } catch (e) {
      console.warn('[YouTubeBonusService] Error fetching claims list from Firestore:', e);
    }
  }

  // Merge with local claims
  const localClaims = getLocalClaims();
  const map = new Map<string, YouTubeBonusClaim>();

  [...firestoreClaims, ...localClaims].forEach((c) => {
    if (c && c.id) {
      map.set(c.id, c);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Approve YouTube Bonus claim by Admin
 * Uses atomic Firestore transaction to guarantee anti-duplication:
 * checks hasClaimedYouTubeBonus, prevents race-conditions and repeated credits
 */
export const approveYouTubeBonusClaim = async (
  claim: YouTubeBonusClaim,
  onUserUpdate?: (uid: string, newBalance: number) => void
): Promise<void> => {
  const now = new Date().toISOString();
  const updatedClaim: YouTubeBonusClaim = {
    ...claim,
    status: 'approved',
    updatedAt: now,
  };

  // 1. Atomic Transaction in Firestore
  if (db && claim.uid) {
    try {
      const claimRef = doc(db, 'youtube_bonus_requests', claim.id);
      const userRef = doc(db, 'users', claim.uid);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const claimDoc = await transaction.get(claimRef);

        const userData = userDoc.exists() ? userDoc.data() : null;
        const claimData = claimDoc.exists() ? claimDoc.data() : null;

        // Duplicate protection check
        if (claimData?.status === 'approved' || userData?.hasClaimedYouTubeBonus === true) {
          console.warn('[YouTubeBonusService] Duplicate approval blocked: User already received bonus.');
          return;
        }

        const currentBalance = Number(userData?.walletBalance || 0);
        const newBalance = currentBalance + 20;

        // Atomically set claim status
        transaction.set(claimRef, updatedClaim, { merge: true });

        // Atomically update user profile & wallet
        transaction.set(
          userRef,
          {
            walletBalance: newBalance,
            hasClaimedYouTubeBonus: true,
            hasReceivedBonus: true,
            youtubeBonusStatus: 'approved',
            updatedAt: now,
          },
          { merge: true }
        );

        // Record transaction ledger entry
        const txRef = doc(collection(db!, 'wallet_transactions'));
        transaction.set(txRef, {
          uid: claim.uid,
          userEmail: claim.userEmail || userData?.email || '',
          amount: 20,
          type: 'CREDIT',
          reason: 'YOUTUBE_SUBSCRIPTION_BONUS',
          description: `৳20 YouTube Subscription Bonus Approved (${claim.youtubeHandle})`,
          createdAt: now,
        });

        if (onUserUpdate) {
          onUserUpdate(claim.uid, newBalance);
        }
      });
    } catch (e) {
      console.error('[YouTubeBonusService] Transaction error approving claim in Firestore:', e);
      throw e;
    }
  }

  // Update local storage
  const localClaims = getLocalClaims();
  const idx = localClaims.findIndex((c) => c.id === claim.id);
  if (idx >= 0) {
    localClaims[idx] = updatedClaim;
  } else {
    localClaims.unshift(updatedClaim);
  }
  saveLocalClaims(localClaims);
};

/**
 * Reject YouTube Bonus claim by Admin
 */
export const rejectYouTubeBonusClaim = async (
  claim: YouTubeBonusClaim,
  adminNotes?: string
): Promise<void> => {
  const now = new Date().toISOString();
  const updatedClaim: YouTubeBonusClaim = {
    ...claim,
    status: 'rejected',
    adminNotes: adminNotes || 'Verification failed. Handle not found or not subscribed.',
    updatedAt: now,
  };

  if (db) {
    try {
      const claimRef = doc(db, 'youtube_bonus_requests', claim.id);
      await setDoc(claimRef, updatedClaim, { merge: true });

      if (claim.uid) {
        const userRef = doc(db, 'users', claim.uid);
        await setDoc(
          userRef,
          {
            youtubeBonusStatus: 'rejected',
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.error('[YouTubeBonusService] Error rejecting claim in Firestore:', e);
    }
  }

  const localClaims = getLocalClaims();
  const idx = localClaims.findIndex((c) => c.id === claim.id);
  if (idx >= 0) {
    localClaims[idx] = updatedClaim;
  } else {
    localClaims.unshift(updatedClaim);
  }
  saveLocalClaims(localClaims);
};
