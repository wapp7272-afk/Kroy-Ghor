import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebaseAuth';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';

const STORAGE_KEY = 'zeropicbd_products';

// Local storage fallback helper
export const getLocalProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('primevault_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ProductFirestoreService] Error reading local products:', e);
  }
  return PRODUCTS;
};

export const saveLocalProducts = (products: Product[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    localStorage.setItem('primevault_products', JSON.stringify(products));
  } catch (e) {
    console.warn('[ProductFirestoreService] Error saving local products:', e);
  }
};

/**
 * Transforms a Firestore doc to a validated Product object
 */
export const docToProduct = (data: any, docId: string): Product => {
  const stockQty = typeof data.stockQuantity === 'number' ? data.stockQuantity : (data.inStock === false ? 0 : 25);
  const inStock = data.inStock !== undefined ? Boolean(data.inStock) : stockQty > 0;
  const stockStatus = data.stockStatus || (stockQty === 0 ? 'out_of_stock' : 'in_stock');

  return {
    id: docId || data.id,
    title: data.title || data.name || 'Kroyghor Product',
    name: data.name || data.title || 'Kroyghor Product',
    category: data.category || 'Perfume',
    subCategory: data.subCategory || '',
    price: Number(data.price) || 0,
    regularPrice: data.regularPrice ? Number(data.regularPrice) : (data.originalPrice ? Number(data.originalPrice) : undefined),
    originalPrice: data.originalPrice ? Number(data.originalPrice) : (data.regularPrice ? Number(data.regularPrice) : undefined),
    discount: data.discount || '',
    rating: Number(data.rating) || 5.0,
    reviewsCount: Number(data.reviewsCount) || 12,
    image: data.image || (data.images && data.images[0]) || '/kroyghor-icon.svg',
    images: Array.isArray(data.images) && data.images.length > 0 ? data.images : (data.image ? [data.image] : []),
    videoUrl: data.videoUrl || '',
    videoPoster: data.videoPoster || '',
    description: data.description || 'Authentic quality product from Kroyghor marketplace.',
    tag: data.tag || (data.tags && data.tags[0]) || 'Trending',
    tags: Array.isArray(data.tags) ? data.tags : (data.tag ? [data.tag] : ['Trending']),
    sku: data.sku || `KG-${docId}`,
    isFeatured: Boolean(data.isFeatured),
    inStock: inStock && stockQty > 0,
    stockStatus: stockQty === 0 ? 'out_of_stock' : stockStatus,
    stockQuantity: stockQty,
    lowStockThreshold: typeof data.lowStockThreshold === 'number' ? data.lowStockThreshold : 5,
    storeName: data.storeName || data.sellerName || 'Kroyghor Official',
    sellerName: data.sellerName || data.storeName || 'Kroyghor Official',
    features: Array.isArray(data.features) ? data.features : ['100% Authentic Quality', 'Cash on Delivery Nationwide'],
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
  };
};

/**
 * Transforms a Product object into a clean Firestore document payload
 */
export const productToFirestoreDoc = (product: Product) => {
  const stockQty = typeof product.stockQuantity === 'number' ? product.stockQuantity : (product.inStock === false ? 0 : 25);
  const inStock = product.inStock !== false && stockQty > 0;
  const stockStatus = stockQty === 0 ? 'out_of_stock' : (product.stockStatus || 'in_stock');

  return {
    id: product.id,
    title: product.title,
    name: product.name || product.title,
    category: product.category || 'Perfume',
    subCategory: product.subCategory || '',
    price: Number(product.price) || 0,
    regularPrice: product.regularPrice ? Number(product.regularPrice) : null,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    discount: product.discount || '',
    rating: Number(product.rating) || 5.0,
    reviewsCount: Number(product.reviewsCount) || 12,
    image: product.image,
    images: product.images || [product.image],
    videoUrl: product.videoUrl || '',
    videoPoster: product.videoPoster || '',
    description: product.description || '',
    tag: product.tag || 'Trending',
    tags: product.tags || (product.tag ? [product.tag] : ['Trending']),
    sku: product.sku || `KG-${product.id}`,
    isFeatured: Boolean(product.isFeatured),
    inStock,
    stockStatus,
    stockQuantity: stockQty,
    lowStockThreshold: product.lowStockThreshold || 5,
    storeName: product.storeName || 'Kroyghor Official',
    sellerName: product.sellerName || 'Kroyghor Official',
    features: product.features || ['100% Authentic Quality'],
    sizes: product.sizes || [],
    updatedAt: serverTimestamp(),
  };
};

/**
 * Subscribe to real-time updates from Firestore `products` collection.
 * Automatically seeds default products into Firestore if the collection is empty.
 */
export const subscribeToProductsFromFirestore = (
  callback: (products: Product[]) => void
): (() => void) => {
  if (!db) {
    callback(getLocalProducts());
    return () => {};
  }

  try {
    const productsCol = collection(db, 'products');
    const unsub = onSnapshot(
      productsCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Fallback to local products and seed Firestore asynchronously
          const localList = getLocalProducts();
          callback(localList);
          seedInitialProductsToFirestore(localList).catch(() => {});
        } else {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docToProduct(docSnap.data(), docSnap.id));
          });
          // Update local cache
          saveLocalProducts(list);
          callback(list);
        }
      },
      (err) => {
        console.warn('[ProductFirestoreService] Snapshot listener warning:', err);
        callback(getLocalProducts());
      }
    );

    return unsub;
  } catch (e) {
    console.error('[ProductFirestoreService] Subscription error:', e);
    callback(getLocalProducts());
    return () => {};
  }
};

/**
 * Seeds initial products into Firestore `products` collection
 */
export const seedInitialProductsToFirestore = async (items: Product[] = PRODUCTS): Promise<void> => {
  if (!db || items.length === 0) return;
  const firestore = db;
  try {
    const batch = writeBatch(firestore);
    items.forEach((p) => {
      const ref = doc(firestore, 'products', p.id);
      batch.set(ref, productToFirestoreDoc(p), { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.warn('[ProductFirestoreService] Error seeding products to Firestore:', e);
  }
};

/**
 * Save or update a product in Firestore `products/{id}`
 */
export const saveProductToFirestore = async (product: Product): Promise<Product> => {
  const stockQty = typeof product.stockQuantity === 'number' ? product.stockQuantity : (product.inStock === false ? 0 : 25);
  const inStock = product.inStock !== false && stockQty > 0;
  const stockStatus: 'in_stock' | 'out_of_stock' | 'pre_order' = stockQty === 0 ? 'out_of_stock' : (product.stockStatus || 'in_stock');

  const cleanProduct: Product = {
    ...product,
    inStock,
    stockStatus,
    stockQuantity: stockQty,
  };

  if (db && cleanProduct.id) {
    const firestore = db;
    try {
      const ref = doc(firestore, 'products', cleanProduct.id);
      await setDoc(ref, productToFirestoreDoc(cleanProduct), { merge: true });
    } catch (e) {
      console.error('[ProductFirestoreService] Error saving product to Firestore:', e);
    }
  }

  // Update local cache
  const localList = getLocalProducts();
  const idx = localList.findIndex((p) => p.id === cleanProduct.id);
  if (idx >= 0) {
    localList[idx] = cleanProduct;
  } else {
    localList.unshift(cleanProduct);
  }
  saveLocalProducts(localList);

  return cleanProduct;
};

/**
 * Delete a product from Firestore `products/{id}`
 */
export const deleteProductFromFirestore = async (productId: string): Promise<void> => {
  if (!productId) return;

  if (db) {
    const firestore = db;
    try {
      const ref = doc(firestore, 'products', productId);
      await deleteDoc(ref);
    } catch (e) {
      console.error('[ProductFirestoreService] Error deleting product from Firestore:', e);
    }
  }

  const localList = getLocalProducts().filter((p) => p.id !== productId);
  saveLocalProducts(localList);
};

/**
 * Bulk delete products from Firestore
 */
export const bulkDeleteProductsFromFirestore = async (productIds: string[]): Promise<void> => {
  if (!productIds || productIds.length === 0) return;

  if (db) {
    const firestore = db;
    try {
      const batch = writeBatch(firestore);
      productIds.forEach((id) => {
        const ref = doc(firestore, 'products', id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (e) {
      console.error('[ProductFirestoreService] Error bulk deleting products from Firestore:', e);
    }
  }

  const set = new Set(productIds);
  const localList = getLocalProducts().filter((p) => !set.has(p.id));
  saveLocalProducts(localList);
};

/**
 * Update stock level for a product in Firestore
 */
export const updateProductStockInFirestore = async (
  productId: string,
  newStockQuantity: number
): Promise<void> => {
  const stock = Math.max(0, newStockQuantity);
  const inStock = stock > 0;
  const stockStatus: 'in_stock' | 'out_of_stock' | 'pre_order' = stock === 0 ? 'out_of_stock' : 'in_stock';

  if (db && productId) {
    const firestore = db;
    try {
      const ref = doc(firestore, 'products', productId);
      await setDoc(
        ref,
        {
          stockQuantity: stock,
          inStock,
          stockStatus,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('[ProductFirestoreService] Error updating stock in Firestore:', e);
    }
  }

  const localList = getLocalProducts().map((p) =>
    p.id === productId
      ? {
          ...p,
          stockQuantity: stock,
          inStock,
          stockStatus,
        }
      : p
  );
  saveLocalProducts(localList);
};
