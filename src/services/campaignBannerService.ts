import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';
import { CampaignBannerConfig } from '../types';

const STORAGE_KEY = 'zeropicbd_campaign_banner';

export const DEFAULT_CAMPAIGN_BANNER: CampaignBannerConfig = {
  isEnabled: true,
  title: 'Seasonal Super Festival 2026',
  subtitle: 'Get up to 40% OFF + ৳20 Instant Wallet Credit across all premium departments!',
  promoCode: 'ZEROPICBD',
  bgColor: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #E11D48 100%)',
  bgImageUrl: '',
  buttonText: 'Explore Super Deals',
  linkTarget: '#explore',
  badgeText: '🎉 FESTIVE OFFER',
};

// Read local cache fallback
export const getLocalCampaignBanner = (): CampaignBannerConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_CAMPAIGN_BANNER, ...parsed };
      }
    }
  } catch (e) {
    console.warn('[CampaignBannerService] Error reading local banner cache:', e);
  }
  return DEFAULT_CAMPAIGN_BANNER;
};

// Save local cache
export const saveLocalCampaignBanner = (config: CampaignBannerConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('[CampaignBannerService] Error saving local banner cache:', e);
  }
};

/**
 * Fetch campaign banner from Firestore settings/campaign_banner
 */
export const getCampaignBannerFromFirestore = async (): Promise<CampaignBannerConfig> => {
  try {
    if (!db) return getLocalCampaignBanner();
    const bannerDocRef = doc(db, 'settings', 'campaign_banner');
    const snap = await getDoc(bannerDocRef);
    if (snap.exists()) {
      const data = snap.data() as CampaignBannerConfig;
      saveLocalCampaignBanner(data);
      return data;
    }
  } catch (e) {
    console.warn('[CampaignBannerService] Error fetching banner from Firestore:', e);
  }
  return getLocalCampaignBanner();
};

/**
 * Real-time listener for settings/campaign_banner in Firestore
 */
export const subscribeCampaignBanner = (
  callback: (config: CampaignBannerConfig) => void
): (() => void) => {
  // Initial local state delivery
  callback(getLocalCampaignBanner());

  if (!db) {
    return () => {};
  }

  try {
    const bannerDocRef = doc(db, 'settings', 'campaign_banner');
    const unsubscribe = onSnapshot(
      bannerDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CampaignBannerConfig;
          saveLocalCampaignBanner(data);
          callback(data);
        } else {
          // If document doesn't exist yet, push default
          saveCampaignBannerToFirestore(DEFAULT_CAMPAIGN_BANNER).catch(() => {});
          callback(DEFAULT_CAMPAIGN_BANNER);
        }
      },
      (error) => {
        console.warn('[CampaignBannerService] Firestore snapshot error:', error);
        callback(getLocalCampaignBanner());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[CampaignBannerService] Subscription setup failed:', err);
    return () => {};
  }
};

/**
 * Save / Update campaign banner in Firestore settings/campaign_banner
 */
export const saveCampaignBannerToFirestore = async (
  config: CampaignBannerConfig
): Promise<void> => {
  saveLocalCampaignBanner(config);

  if (!db) {
    console.log('[CampaignBannerService] Local update saved (no db instance).');
    return;
  }

  try {
    const bannerDocRef = doc(db, 'settings', 'campaign_banner');
    await setDoc(
      bannerDocRef,
      {
        ...config,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error('[CampaignBannerService] Error saving banner to Firestore:', e);
    throw e;
  }
};
