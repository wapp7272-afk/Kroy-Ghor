import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';
import { SUPER_ADMIN_EMAIL } from './authService';
import { saveLocalOrders } from './orderFirestoreService';
import { saveLocalProducts } from './productFirestoreService';

export interface DatabaseAuditMetrics {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalWalletTransactions: number;
  isCampaignBannerActive: boolean;
  lastCheckedAt: string;
}

// List of known demo email patterns or test markers
const DEMO_EMAIL_PATTERNS = [
  'demo@',
  'test@',
  'example.com',
  'john.doe@',
  'jane.doe@',
  'placeholder@'
];

/**
 * Checks whether an order is considered a demo/test order
 */
export const isDemoOrder = (orderData: any, docId: string): boolean => {
  if (orderData.isDemo === true) return true;
  if (docId.startsWith('DEMO-') || docId.startsWith('ORD-DEMO') || docId.startsWith('TEST-')) return true;
  
  const email = (orderData.customerEmail || orderData.email || '').toLowerCase();
  if (email && DEMO_EMAIL_PATTERNS.some((pattern) => email.includes(pattern))) {
    return true;
  }

  const name = (orderData.customerName || '').toLowerCase();
  if (name.includes('demo user') || name.includes('test customer') || name.includes('sample order')) {
    return true;
  }

  return false;
};

/**
 * Checks whether a product is considered a demo product
 */
export const isDemoProduct = (productData: any, docId: string): boolean => {
  if (productData.isDemo === true) return true;
  if (docId.startsWith('demo-') || docId.startsWith('test-')) return true;
  const title = (productData.title || '').toLowerCase();
  if (title.includes('[demo]') || title.includes('[test]')) return true;
  return false;
};

/**
 * Fetches real-time count metrics from all core Firestore collections
 */
export const fetchDatabaseMetrics = async (): Promise<DatabaseAuditMetrics> => {
  const result: DatabaseAuditMetrics = {
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalWalletTransactions: 0,
    isCampaignBannerActive: false,
    lastCheckedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  if (!db) {
    return result;
  }

  try {
    // 1. Users collection count
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      result.totalUsers = usersSnap.size;
    } catch (e) {
      console.warn('[MaintenanceService] Users count failed:', e);
    }

    // 2. Orders collection count
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      result.totalOrders = ordersSnap.size;
    } catch (e) {
      console.warn('[MaintenanceService] Orders count failed:', e);
    }

    // 3. Products collection count
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      result.totalProducts = productsSnap.size;
    } catch (e) {
      console.warn('[MaintenanceService] Products count failed:', e);
    }

    // 4. Wallet transactions count
    try {
      const walletSnap = await getDocs(collection(db, 'wallet_transactions'));
      result.totalWalletTransactions = walletSnap.size;
    } catch (e) {
      console.warn('[MaintenanceService] Wallet transactions count failed:', e);
    }

    // 5. Campaign banner status
    try {
      const bannerSnap = await getDoc(doc(db, 'settings', 'campaign_banner'));
      if (bannerSnap.exists()) {
        const data = bannerSnap.data();
        result.isCampaignBannerActive = Boolean(data?.isEnabled);
      }
    } catch (e) {
      console.warn('[MaintenanceService] Campaign banner check failed:', e);
    }

    result.lastCheckedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (err) {
    console.error('[MaintenanceService] Global audit metrics error:', err);
  }

  return result;
};

/**
 * Purges demo/test orders from Firestore while preserving real customer orders.
 */
export const purgeDemoOrdersFromFirestore = async (): Promise<{ deletedCount: number; preservedCount: number }> => {
  if (!db) {
    throw new Error('Firestore database is not initialized.');
  }

  const ordersSnap = await getDocs(collection(db, 'orders'));
  let deletedCount = 0;
  let preservedCount = 0;

  const batch = writeBatch(db);
  let batchCount = 0;

  ordersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const docId = docSnap.id;

    if (isDemoOrder(data, docId)) {
      batch.delete(docSnap.ref);
      batchCount++;
      deletedCount++;
    } else {
      preservedCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }

  // Update local cache removing demo orders
  try {
    const raw = localStorage.getItem('primevault_orders') || localStorage.getItem('zeropicbd_orders');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((o) => !isDemoOrder(o, o.id));
        saveLocalOrders(filtered);
      }
    }
  } catch (e) {
    console.warn('[MaintenanceService] Error syncing local orders cache:', e);
  }

  return { deletedCount, preservedCount };
};

/**
 * Purges demo/placeholder products from Firestore while preserving newly added and real catalog items.
 */
export const purgeDemoProductsFromFirestore = async (): Promise<{ deletedCount: number; preservedCount: number }> => {
  if (!db) {
    throw new Error('Firestore database is not initialized.');
  }

  const productsSnap = await getDocs(collection(db, 'products'));
  let deletedCount = 0;
  let preservedCount = 0;

  const batch = writeBatch(db);
  let batchCount = 0;

  productsSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const docId = docSnap.id;

    if (isDemoProduct(data, docId)) {
      batch.delete(docSnap.ref);
      batchCount++;
      deletedCount++;
    } else {
      preservedCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }

  // Clean local cache
  try {
    const raw = localStorage.getItem('zeropicbd_products') || localStorage.getItem('primevault_products');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((p) => !isDemoProduct(p, p.id));
        saveLocalProducts(filtered);
      }
    }
  } catch (e) {
    console.warn('[MaintenanceService] Error syncing local products cache:', e);
  }

  return { deletedCount, preservedCount };
};

/**
 * Resets test wallet transactions while keeping actual customer wallet balances intact.
 */
export const resetTestWalletLedgerFromFirestore = async (): Promise<{ deletedCount: number; preservedCount: number }> => {
  if (!db) {
    throw new Error('Firestore database is not initialized.');
  }

  const walletSnap = await getDocs(collection(db, 'wallet_transactions'));
  let deletedCount = 0;
  let preservedCount = 0;

  const batch = writeBatch(db);
  let batchCount = 0;

  walletSnap.forEach((docSnap) => {
    const data = docSnap.data();
    const uid = (data.uid || data.userId || '').toLowerCase();
    const reason = (data.reason || data.description || '').toLowerCase();

    // Preserve real user transactions; delete demo/test records
    const isTest = data.isDemo === true || uid.includes('demo') || uid.includes('test') || reason.includes('demo_test');

    if (isTest) {
      batch.delete(docSnap.ref);
      batchCount++;
      deletedCount++;
    } else {
      preservedCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }

  return { deletedCount, preservedCount };
};
