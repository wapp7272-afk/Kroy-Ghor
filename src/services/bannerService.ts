import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';

export interface PromoSlideBanner {
  id: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkType?: 'category' | 'product' | 'external' | 'deal';
  linkTarget?: string;
  order: number;
  isActive: boolean;
  accentColor?: string;
  createdAt?: string;
}

export const INITIAL_SLIDER_BANNERS: PromoSlideBanner[] = [
  {
    id: 'banner-durga-puja',
    title: 'Durga Puja & Festive Grand Offer',
    subtitle: 'Get up to 50% Flat Discount + Instant ৳20 Welcome Bonus on all categories!',
    badge: '🎉 SPECIAL FESTIVE OFFER',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1200',
    linkType: 'deal',
    linkTarget: 'Flash Sale',
    order: 1,
    isActive: true,
    accentColor: '#F97316'
  },
  {
    id: 'banner-perfume-luxury',
    title: 'Exquisite French EDPs & Pure Attars',
    subtitle: '100% Authentic imported fragrances with verified batch codes and long-lasting sillage.',
    badge: '✨ SIGNATURE FRAGRANCES',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200',
    linkType: 'category',
    linkTarget: 'Perfumes & Attars',
    order: 2,
    isActive: true,
    accentColor: '#8B5CF6'
  },
  {
    id: 'banner-youtube-channel',
    title: 'Watch Product Reviews & Unboxing',
    subtitle: 'Subscribe to our official YouTube channel @zeropicbd for exclusive discounts!',
    badge: '📺 YOUTUBE OFFICIAL',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1200',
    linkType: 'external',
    linkTarget: 'https://www.youtube.com/@zeropicbd',
    order: 3,
    isActive: true,
    accentColor: '#EF4444'
  }
];

const LOCAL_STORAGE_KEY = 'kroyghor_slider_banners';

export const getLocalSliderBanners = (): PromoSlideBanner[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('zeropicbd_slider_banners');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[BannerService] Error reading local banners:', err);
  }
  return INITIAL_SLIDER_BANNERS;
};

export const saveLocalSliderBanners = (banners: PromoSlideBanner[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(banners));
    localStorage.setItem('zeropicbd_slider_banners', JSON.stringify(banners));
  } catch (err) {
    console.warn('[BannerService] Error saving local banners:', err);
  }
};

export const subscribeBannersFromFirestore = (callback: (banners: PromoSlideBanner[]) => void) => {
  if (!db) {
    callback(getLocalSliderBanners());
    return () => {};
  }

  try {
    const colRef = collection(db, 'banners');
    const q = query(colRef, orderBy('order', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(getLocalSliderBanners());
          return;
        }

        const items: PromoSlideBanner[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PromoSlideBanner[];

        saveLocalSliderBanners(items);
        callback(items);
      },
      (error) => {
        console.warn('[BannerService] Firestore listener fallback to local:', error);
        callback(getLocalSliderBanners());
      }
    );
  } catch (e) {
    console.warn('[BannerService] Subscription failed, using local cache:', e);
    callback(getLocalSliderBanners());
    return () => {};
  }
};

export const saveBannerToFirestore = async (banner: PromoSlideBanner): Promise<void> => {
  const localBanners = getLocalSliderBanners();
  const existingIdx = localBanners.findIndex((b) => b.id === banner.id);
  
  if (existingIdx >= 0) {
    localBanners[existingIdx] = banner;
  } else {
    localBanners.push(banner);
  }
  saveLocalSliderBanners(localBanners);

  if (!db) return;

  try {
    const docRef = doc(db, 'banners', banner.id);
    await setDoc(docRef, { ...banner, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('[BannerService] Error saving banner to Firestore:', err);
  }
};

export const deleteBannerFromFirestore = async (bannerId: string): Promise<void> => {
  const localBanners = getLocalSliderBanners().filter((b) => b.id !== bannerId);
  saveLocalSliderBanners(localBanners);

  if (!db) return;

  try {
    const docRef = doc(db, 'banners', bannerId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[BannerService] Error deleting banner from Firestore:', err);
  }
};

export const toggleBannerActiveInFirestore = async (bannerId: string, isActive: boolean): Promise<void> => {
  const localBanners = getLocalSliderBanners().map((b) => (b.id === bannerId ? { ...b, isActive } : b));
  saveLocalSliderBanners(localBanners);

  if (!db) return;

  try {
    const docRef = doc(db, 'banners', bannerId);
    await updateDoc(docRef, { isActive, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('[BannerService] Error toggling banner active:', err);
  }
};
