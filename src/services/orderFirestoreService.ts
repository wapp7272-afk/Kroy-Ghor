import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseAuth';
import { Order, CartItem, Address } from '../types';

const STORAGE_KEY = 'primevault_orders';

// Helper for local storage persistence fallback
export const getLocalOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('zeropicbd_orders');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalOrders = (orders: Order[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    localStorage.setItem('zeropicbd_orders', JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save local orders cache:', e);
  }
};

export const getOrderMillis = (o: any): number => {
  if (!o) return 0;
  if (o.createdAt) {
    if (typeof o.createdAt.toMillis === 'function') return o.createdAt.toMillis();
    if (typeof o.createdAt.seconds === 'number') return o.createdAt.seconds * 1000;
    const t = new Date(o.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (o.date) {
    const t = new Date(o.date).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
};

/**
 * Transforms a Firestore document back into our application's `Order` object
 */
export const docToOrder = (data: any, docId: string): Order => {
  if (!data) return null as any;

  const rawId = data.orderId || data.id || docId;
  const id = rawId ? (String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`) : `#KG-${Math.floor(1000 + Math.random() * 9000)}`;

  const items: CartItem[] = (data.items || []).map((item: any) => ({
    product: {
      id: item.productId || item.product?.id || `p-${Math.random()}`,
      title: item.title || item.product?.title || 'Kroyghor Authentic Product',
      price: Number(item.price || item.product?.price || 0),
      discountPrice: Number(item.discountPrice || item.price || item.product?.discountPrice || 0),
      image: item.image || item.product?.image || '/kroyghor-icon.svg',
      category: item.category || item.product?.category || 'Lifestyle',
      rating: 5,
      reviewsCount: 1,
      stockQuantity: 10,
      isBestSeller: true,
      description: 'Authentic product',
    },
    quantity: Number(item.quantity) || 1,
    selectedSize: item.selectedSize || item.size || 'Standard',
  }));

  const shippingAddr = data.shippingAddress || data.address || {};
  const addressObj: Address = {
    fullName: data.customerName || shippingAddr.fullName || 'Kroyghor Member',
    phone: data.customerPhone || shippingAddr.phone || '',
    cityDivision: shippingAddr.cityDivision || shippingAddr.City || 'Inside Dhaka',
    fullAddress: shippingAddr.fullAddress || shippingAddr.Street || shippingAddr.address || 'Dhaka',
    district: shippingAddr.district || 'Dhaka',
    notes: shippingAddr.notes || shippingAddr.Notes || '',
  };

  const rawCreatedAt = data.createdAt;
  const createdAtDate = rawCreatedAt
    ? new Date(
        typeof rawCreatedAt.toMillis === 'function'
          ? rawCreatedAt.toMillis()
          : typeof rawCreatedAt.seconds === 'number'
          ? rawCreatedAt.seconds * 1000
          : rawCreatedAt
      )
    : data.date
    ? new Date(data.date)
    : new Date();

  const formattedDate = !isNaN(createdAtDate.getTime())
    ? createdAtDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : data.date || new Date().toLocaleDateString('en-GB');

  return {
    id,
    userId: data.userId || '',
    customerName: data.customerName || addressObj.fullName,
    customerPhone: data.customerPhone || addressObj.phone,
    customerEmail: data.customerEmail || data.email || '',
    date: formattedDate,
    items,
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    walletDeducted: Number(data.walletDiscount || data.walletDeducted || 0),
    deliveryFee: Number(data.deliveryCharge || data.deliveryFee || 0),
    total: Number(data.totalAmount || data.total || 0),
    paymentMethod: (data.paymentMethod || 'cod').toLowerCase() as any,
    trxId: data.trxId || '',
    paymentStatus: data.paymentStatus || 'Pending',
    status: data.orderStatus || data.status || 'Pending',
    address: addressObj,
    courierName: data.courierName || '',
    trackingNumber: data.trackingNumber || '',
  };
};

/**
 * Saves a new order into Firestore backend:
 * Dual Write Strategy: Atomically writes to top-level root `/orders/{orderId}` AND
 * customer subcollection `/users/{userId}/orders/{orderId}` using writeBatch()
 */
export const saveOrderToFirestore = async (order: Order, currentUserId?: string): Promise<Order> => {
  const authUid = auth?.currentUser?.uid;
  const uid = authUid || (currentUserId && currentUserId !== 'guest' && !currentUserId.includes('@') ? currentUserId : order.userId && !order.userId.includes('@') ? order.userId : 'guest');
  const rawId = order.id || `#KG-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = rawId.startsWith('#') ? rawId : `#${rawId}`;
  const cleanDocId = orderId.replace(/^#/, '');

  const customerName = order.customerName || order.address?.fullName || 'Kroyghor Member';
  const customerEmail = order.customerEmail || auth?.currentUser?.email || '';
  const customerPhone = order.customerPhone || order.address?.phone || '';

  const mappedPaymentMethod: 'COD' | 'bKash' | 'Nagad' | 'Card' = (() => {
    const pm = (order.paymentMethod || 'cod').toLowerCase();
    if (pm.includes('bkash')) return 'bKash';
    if (pm.includes('nagad')) return 'Nagad';
    if (pm.includes('card')) return 'Card';
    return 'COD';
  })();

  const mappedPaymentStatus = (() => {
    if (order.paymentStatus === 'Paid') return 'Paid';
    if (mappedPaymentMethod === 'COD') return 'Pending (COD on Delivery)';
    return 'Pending Verification';
  })();

  const mappedOrderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' =
    (order.status as any) || 'Pending';

  // Calculate & validate normalized financial invariant values
  const validatedItems = order.items.map((i) => {
    const qty = Math.max(1, Math.min(20, Math.floor(Number(i.quantity) || 1)));
    const unitPrice = Math.max(0, Number(i.product?.price || (i as any).price || 0));
    return {
      productId: i.product?.id || `p-${Math.random()}`,
      title: i.product?.title || 'Product',
      price: unitPrice,
      quantity: qty,
      image: i.product?.image || '/kroyghor-icon.svg',
      selectedSize: i.selectedSize || '',
      product: {
        id: i.product?.id,
        title: i.product?.title,
        price: unitPrice,
        image: i.product?.image,
        category: i.product?.category,
      },
    };
  });

  const computedSubtotal = validatedItems.reduce((sum, itm) => sum + itm.price * itm.quantity, 0);
  const deliveryFee = Math.max(0, Number(order.deliveryFee) || (order.address?.cityDivision === 'Inside Dhaka' ? 60 : 120));
  const discount = Math.max(0, Math.min(computedSubtotal, Number(order.discount) || 0));
  const walletDeducted = Math.max(0, Math.min(computedSubtotal - discount, Number(order.walletDeducted) || 0));
  const authoritativeTotal = Math.max(0, computedSubtotal + deliveryFee - discount - walletDeducted);

  const firestoreDocPayload = {
    orderId,
    id: orderId,
    cleanId: cleanDocId,
    userId: uid,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: {
      Street: order.address?.fullAddress || '',
      City: order.address?.cityDivision || 'Inside Dhaka',
      Zip: (order.address as any)?.zip || '1200',
      Notes: order.address?.notes || '',
      fullName: order.address?.fullName || customerName,
      phone: order.address?.phone || customerPhone,
      cityDivision: order.address?.cityDivision || 'Inside Dhaka',
      fullAddress: order.address?.fullAddress || '',
      district: order.address?.district || 'Dhaka',
    },
    address: {
      fullName: order.address?.fullName || customerName,
      phone: order.address?.phone || customerPhone,
      cityDivision: order.address?.cityDivision || 'Inside Dhaka',
      fullAddress: order.address?.fullAddress || '',
      district: order.address?.district || 'Dhaka',
      notes: order.address?.notes || '',
    },
    items: validatedItems,
    subtotal: computedSubtotal,
    deliveryCharge: deliveryFee,
    deliveryFee: deliveryFee,
    discount: discount,
    walletDiscount: walletDeducted,
    walletDeducted: walletDeducted,
    totalAmount: authoritativeTotal,
    total: authoritativeTotal,
    paymentMethod: mappedPaymentMethod,
    paymentStatus: mappedPaymentStatus,
    orderStatus: mappedOrderStatus,
    status: mappedOrderStatus,
    trxId: order.trxId || '',
    date: order.date || new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const completedOrder: Order = {
    ...order,
    id: orderId,
    userId: uid,
    customerName,
    customerEmail,
    customerPhone,
    subtotal: computedSubtotal,
    deliveryFee: deliveryFee,
    discount: discount,
    walletDeducted: walletDeducted,
    total: authoritativeTotal,
    paymentStatus: mappedPaymentStatus as any,
    status: mappedOrderStatus as any,
  };

  // 1. Instant multi-channel broadcast across tabs and admin (< 10ms)
  broadcastNewOrder(completedOrder);

  // 2. Persist in local storage
  const localList = getLocalOrders();
  const filtered = localList.filter((o) => o.id !== orderId && o.id.replace(/^#/, '') !== cleanDocId);
  saveLocalOrders([completedOrder, ...filtered]);

  // 3. Atomically persist in Firestore (Root /orders/{orderId} AND Customer /users/{userId}/orders/{orderId})
  if (db) {
    try {
      const batch = writeBatch(db);

      // A. Primary Root Collection: /orders/{orderId}
      const rootOrderRef = doc(db, 'orders', orderId);
      batch.set(rootOrderRef, firestoreDocPayload, { merge: true });

      // Mirror to cleanDocId if different (without #) so queries without # succeed
      if (cleanDocId !== orderId) {
        const rootOrderRefClean = doc(db, 'orders', cleanDocId);
        batch.set(rootOrderRefClean, firestoreDocPayload, { merge: true });
      }

      // B. Customer Subcollection: /users/{userId}/orders/{orderId}
      if (uid && uid !== 'guest') {
        const userOrderRef = doc(db, 'users', uid, 'orders', orderId);
        batch.set(userOrderRef, firestoreDocPayload, { merge: true });

        if (cleanDocId !== orderId) {
          const userOrderRefClean = doc(db, 'users', uid, 'orders', cleanDocId);
          batch.set(userOrderRefClean, firestoreDocPayload, { merge: true });
        }

        // Update user metrics in /users/{uid}
        const userRef = doc(db, 'users', uid);
        batch.set(userRef, {
          hasPlacedOrders: true,
          lastOrderAt: serverTimestamp(),
          lastOrderAmount: order.total,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
      console.log(`[OrderFirestoreService] Atomic dual-write completed for Order ${orderId} directly to root /orders and /users/${uid}/orders`);
    } catch (err) {
      console.error('[OrderFirestoreService] Error saving order with batch to Firestore:', err);
      // Fallback single writes so the order is NEVER lost in root /orders
      try {
        await setDoc(doc(db, 'orders', orderId), firestoreDocPayload, { merge: true });
        if (cleanDocId !== orderId) {
          await setDoc(doc(db, 'orders', cleanDocId), firestoreDocPayload, { merge: true });
        }
        if (uid && uid !== 'guest') {
          await setDoc(doc(db, 'users', uid, 'orders', orderId), firestoreDocPayload, { merge: true }).catch(() => {});
        }
      } catch (fallbackErr) {
        console.error('[OrderFirestoreService] Fallback write to /orders also failed:', fallbackErr);
      }
    }
  }

  return completedOrder;
};

/**
 * Real-time subscription to customer lifetime orders from Firestore (`orders` collection)
 * Instant multi-channel updates (<10ms) across tabs and windows
 */
export const subscribeToUserOrdersFromFirestore = (
  uid: string | undefined,
  email: string | undefined,
  callback: (orders: Order[]) => void,
  phone?: string | undefined
): (() => void) => {
  const cleanupFns: Array<() => void> = [];

  const currentUid = uid || auth?.currentUser?.uid;
  const currentEmail = email || auth?.currentUser?.email;
  const currentPhone = phone;

  const isUserMatch = (o: Order) => {
    if (!o) return false;
    if (currentUid && (o.userId === currentUid || o.userId === currentUid.replace(/[^a-zA-Z0-9]/g, '_'))) return true;
    if (currentEmail && o.customerEmail && o.customerEmail.toLowerCase() === currentEmail.toLowerCase()) return true;
    if (currentPhone && (o.customerPhone === currentPhone || o.address?.phone === currentPhone)) return true;
    return false;
  };

  const notifyUserOrders = () => {
    const localList = getLocalOrders();
    const userList = localList.filter(isUserMatch);
    callback(userList);
  };

  notifyUserOrders();

  // 1. In-tab window event listener for instant local sync
  if (typeof window !== 'undefined') {
    const handleCustomEvent = (event: Event) => {
      const customEvt = event as CustomEvent<Order>;
      if (customEvt.detail && isUserMatch(customEvt.detail)) {
        notifyUserOrders();
      }
    };
    window.addEventListener('kroyghor:new_order', handleCustomEvent);
    cleanupFns.push(() => window.removeEventListener('kroyghor:new_order', handleCustomEvent));
  }

  // 2. Cross-tab BroadcastChannel listener
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(ORDER_BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order && isUserMatch(event.data.order)) {
          notifyUserOrders();
        }
      };
      cleanupFns.push(() => bc.close());
    } catch (e) {
      console.warn('[OrderFirestoreService] User BroadcastChannel init error:', e);
    }
  }

  // 3. Live Firestore Snapshot (Constrained to user's authorized orders)
  if (db && currentUid && currentUid !== 'guest') {
    try {
      const ordersCol = collection(db, 'orders');
      const userOrdersQuery = query(ordersCol, where('userId', '==', currentUid));
      const unsubscribe = onSnapshot(
        userOrdersQuery,
        (snapshot) => {
          const firestoreOrders: Order[] = [];
          snapshot.forEach((d) => {
            const orderObj = docToOrder(d.data(), d.id);
            if (orderObj) {
              firestoreOrders.push(orderObj);
            }
          });

          // Merge with local user orders
          const localList = getLocalOrders().filter(isUserMatch);
          const map = new Map<string, Order>();
          [...firestoreOrders, ...localList].forEach((o) => {
            if (o && o.id) {
              map.set(o.id, o);
            }
          });

          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          callback(sorted);
        },
        (error) => {
          console.warn('[OrderFirestoreService] Snapshot subscription error:', error);
          notifyUserOrders();
        }
      );

      cleanupFns.push(() => unsubscribe());
    } catch (err) {
      console.error('[OrderFirestoreService] Failed to subscribe to user orders:', err);
      notifyUserOrders();
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
};

const getUserOrdersFromLocal = (uid?: string, email?: string): Order[] => {
  const localList = getLocalOrders();
  const currentUid = uid || auth?.currentUser?.uid;
  const currentEmail = email || auth?.currentUser?.email;
  return localList.filter((o) => {
    if (currentUid && o.userId === currentUid) return true;
    if (currentEmail && o.customerEmail?.toLowerCase() === currentEmail.toLowerCase()) return true;
    return !currentUid && !currentEmail;
  });
};

/**
 * Fetches lifetime orders for a specific user from Firestore backend
 */
export const getUserOrdersFromFirestore = async (
  uid?: string,
  email?: string,
  phone?: string
): Promise<Order[]> => {
  const currentUid = uid || auth?.currentUser?.uid;
  const currentEmail = email || auth?.currentUser?.email;

  let firestoreOrders: Order[] = [];

  if (db) {
    try {
      if (currentUid) {
        const qUid = query(collection(db, 'orders'), where('userId', '==', currentUid));
        const snapUid = await getDocs(qUid);
        snapUid.forEach((d) => {
          firestoreOrders.push(docToOrder(d.data(), d.id));
        });
      }

      if (currentEmail && firestoreOrders.length === 0) {
        const qEmail = query(collection(db, 'orders'), where('customerEmail', '==', currentEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.forEach((d) => {
          firestoreOrders.push(docToOrder(d.data(), d.id));
        });
      }

      if (phone && firestoreOrders.length === 0) {
        const qPhone = query(collection(db, 'orders'), where('customerPhone', '==', phone));
        const snapPhone = await getDocs(qPhone);
        snapPhone.forEach((d) => {
          firestoreOrders.push(docToOrder(d.data(), d.id));
        });
      }
    } catch (e) {
      console.warn('[OrderFirestoreService] Error querying orders from Firestore:', e);
    }
  }

  // Fallback / merge local cache
  const localList = getLocalOrders();
  const map = new Map<string, Order>();

  [...firestoreOrders, ...localList].forEach((o) => {
    if (o && o.id) {
      const isUserOrder =
        (currentUid && o.userId === currentUid) ||
        (currentEmail && o.customerEmail?.toLowerCase() === currentEmail.toLowerCase()) ||
        (phone && o.customerPhone === phone) ||
        (!currentUid && !currentEmail && !phone);

      if (isUserOrder) {
        map.set(o.id, o);
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Fetches ALL orders across the entire store for Admin view
 */
export const getAllOrdersFromFirestore = async (): Promise<Order[]> => {
  let firestoreOrders: Order[] = [];

  if (db) {
    try {
      const q = query(collection(db, 'orders'));
      const querySnap = await getDocs(q);
      querySnap.forEach((d) => {
        firestoreOrders.push(docToOrder(d.data(), d.id));
      });
    } catch (e) {
      console.warn('[OrderFirestoreService] Error fetching all orders from Firestore:', e);
    }
  }

  const localList = getLocalOrders();
  const map = new Map<string, Order>();

  [...firestoreOrders, ...localList].forEach((o) => {
    if (o && o.id) {
      map.set(o.id, o);
    }
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Updates order status in Firestore backend
 */
export const updateOrderStatusInFirestore = async (
  orderId: string,
  status: Order['status']
): Promise<void> => {
  if (db && orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(orderRef, { orderStatus: status }, { merge: true });
      });
    } catch (e) {
      console.error('[OrderFirestoreService] Error updating order status:', e);
    }
  }

  const localList = getLocalOrders();
  const updated = localList.map((o) => (o.id === orderId ? { ...o, status } : o));
  saveLocalOrders(updated);
};

/**
 * Updates payment status in Firestore backend
 */
export const updateOrderPaymentStatusInFirestore = async (
  orderId: string,
  paymentStatus: Order['paymentStatus']
): Promise<void> => {
  if (db && orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: paymentStatus,
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(orderRef, { paymentStatus }, { merge: true });
      });
    } catch (e) {
      console.error('[OrderFirestoreService] Error updating order payment status:', e);
    }
  }

  const localList = getLocalOrders();
  const updated = localList.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o));
  saveLocalOrders(updated);
};

/**
 * Deduct wallet balance from user's Firestore document (users/{uid}) and record DEBIT entry in wallet_transactions
 * Uses atomic Firestore transaction to prevent double spending and race conditions
 */
export const deductUserWalletInFirestore = async (
  uid: string,
  amount: number,
  orderId: string,
  userEmail?: string
): Promise<number> => {
  if (!uid || amount <= 0 || !db) return 0;
  try {
    const userRef = doc(db, 'users', uid);

    const resultingBalance = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      let currentBalance = 0;
      if (snap.exists()) {
        currentBalance = Number(snap.data()?.walletBalance || 0);
      }

      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance: current ৳${currentBalance}, requested ৳${amount}`);
      }

      const newBalance = Math.max(0, currentBalance - amount);
      const now = new Date().toISOString();

      transaction.update(userRef, {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      const txRef = doc(collection(db!, 'wallet_transactions'));
      transaction.set(txRef, {
        uid,
        userEmail: userEmail || snap.data()?.email || '',
        amount,
        type: 'DEBIT',
        reason: 'ORDER_PAYMENT_DISCOUNT',
        orderId,
        description: `Applied ৳${amount} wallet balance to Order ${orderId}`,
        createdAt: now,
        timestamp: serverTimestamp(),
      });

      return newBalance;
    });

    return resultingBalance;
  } catch (e) {
    console.error('[OrderFirestoreService] Error deducting wallet with transaction in Firestore:', e);
    return 0;
  }
};

/**
 * Fetches current user's walletBalance from Firestore (users/{uid})
 */
export const getFirestoreUserWalletBalance = async (uid: string): Promise<number> => {
  if (!uid || !db) return 0;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return typeof snap.data()?.walletBalance === 'number' ? snap.data()?.walletBalance : 0;
    }
  } catch (e) {
    console.warn('[OrderFirestoreService] Error fetching user wallet balance:', e);
  }
  return 0;
};

/**
 * Refunds used wallet balance back to user's Firestore document (users/{uid}) and records CREDIT entry in wallet_transactions
 * Uses atomic transaction
 */
export const refundUserWalletInFirestore = async (
  uid: string,
  amount: number,
  orderId: string,
  userEmail?: string
): Promise<number> => {
  if (!uid || amount <= 0 || !db) return 0;
  try {
    const userRef = doc(db, 'users', uid);

    const resultingBalance = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      let currentBalance = 0;
      if (snap.exists()) {
        currentBalance = Number(snap.data()?.walletBalance || 0);
      }

      const newBalance = currentBalance + amount;
      const now = new Date().toISOString();

      transaction.update(userRef, {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      const txRef = doc(collection(db!, 'wallet_transactions'));
      transaction.set(txRef, {
        uid,
        userEmail: userEmail || snap.data()?.email || '',
        amount,
        type: 'CREDIT',
        reason: 'ORDER_CANCELLED_REFUND',
        orderId,
        description: `৳${amount} refunded for cancelled order ${orderId}`,
        createdAt: now,
        timestamp: serverTimestamp(),
      });

      return newBalance;
    });

    return resultingBalance;
  } catch (e) {
    console.error('[OrderFirestoreService] Error refunding wallet with transaction in Firestore:', e);
    return 0;
  }
};

/**
 * Updates courier tracking info and sets status to 'Shipped' in Firestore backend
 */
export const updateOrderCourierTrackingInFirestore = async (
  orderId: string,
  courierName: string,
  trackingNumber: string,
  trackingUrl?: string,
  trackingNotes?: string
): Promise<void> => {
  if (db && orderId) {
    const firestore = db;
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      const payload: any = {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        orderStatus: 'Shipped',
        updatedAt: serverTimestamp(),
      };
      if (trackingUrl) payload.trackingUrl = trackingUrl.trim();
      if (trackingNotes) payload.trackingNotes = trackingNotes.trim();

      await setDoc(orderRef, payload, { merge: true });
    } catch (e) {
      console.error('[OrderFirestoreService] Error updating courier tracking in Firestore:', e);
    }
  }

  const localList = getLocalOrders();
  const updated = localList.map((o) =>
    o.id === orderId
      ? {
          ...o,
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          trackingNotes: trackingNotes ? trackingNotes.trim() : o.trackingNotes,
          status: 'Shipped' as const,
        }
      : o
  );
  saveLocalOrders(updated);
};

// Multi-channel cross-tab / in-tab order sync channel
const ORDER_BROADCAST_CHANNEL_NAME = 'kroyghor_orders_realtime';

/**
 * Broadcasts newly created order instantly across tabs, windows, and local applet listeners (< 10ms latency)
 */
export const broadcastNewOrder = (order: Order) => {
  try {
    // 1. In-tab custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kroyghor:new_order', { detail: order }));
    }

    // 2. Cross-tab BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(ORDER_BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'NEW_ORDER', order });
      channel.close();
    }
  } catch (e) {
    console.warn('[OrderFirestoreService] broadcastNewOrder error:', e);
  }
};

/**
 * Real-time subscription to ALL orders for Admin panel (Firestore onSnapshot on root /orders + BroadcastChannel + Window Events)
 * Targeting the root /orders collection without any restrictive user filter.
 * Delivers newly placed orders in under 1 second without requiring page reload.
 */
export const subscribeToAllOrdersFromFirestore = (
  callback: (orders: Order[], newOrder?: Order) => void
): (() => void) => {
  const cleanupFns: Array<() => void> = [];

  // Track known order IDs to detect newly arrived live orders
  const knownOrderIds = new Set<string>();
  const initialLocal = getLocalOrders();
  initialLocal.forEach((o) => {
    if (o?.id) {
      knownOrderIds.add(o.id);
      knownOrderIds.add(o.id.replace(/^#/, ''));
    }
  });
  callback(initialLocal);

  const handleIncomingOrder = (newOrder: Order) => {
    if (!newOrder || !newOrder.id) return;
    const cleanId = newOrder.id.replace(/^#/, '');
    const isBrandNew = !knownOrderIds.has(newOrder.id) && !knownOrderIds.has(cleanId);
    knownOrderIds.add(newOrder.id);
    knownOrderIds.add(cleanId);

    const localList = getLocalOrders();
    const filtered = localList.filter((o) => o.id !== newOrder.id && o.id.replace(/^#/, '') !== cleanId);
    const updated = [newOrder, ...filtered];
    saveLocalOrders(updated);

    callback(updated, isBrandNew ? newOrder : undefined);
  };

  // 1. In-tab window event listener
  if (typeof window !== 'undefined') {
    const handleCustomEvent = (event: Event) => {
      const customEvt = event as CustomEvent<Order>;
      if (customEvt.detail) {
        handleIncomingOrder(customEvt.detail);
      }
    };
    window.addEventListener('kroyghor:new_order', handleCustomEvent);
    cleanupFns.push(() => window.removeEventListener('kroyghor:new_order', handleCustomEvent));
  }

  // 2. Cross-tab BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(ORDER_BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
          handleIncomingOrder(event.data.order);
        }
      };
      cleanupFns.push(() => bc.close());
    } catch (e) {
      console.warn('[OrderFirestoreService] BroadcastChannel init error:', e);
    }
  }

  // 3. Firestore Live onSnapshot Listener on Root /orders (No restrictive user query)
  if (db) {
    try {
      const ordersCol = collection(db, 'orders');
      const unsubscribeFirestore = onSnapshot(
        ordersCol,
        (snapshot) => {
          const firestoreOrders: Order[] = [];
          let freshlyArrivedOrder: Order | undefined = undefined;

          snapshot.forEach((d) => {
            const orderObj = docToOrder(d.data(), d.id);
            if (orderObj && orderObj.id) {
              firestoreOrders.push(orderObj);
              const cleanId = orderObj.id.replace(/^#/, '');
              if (!knownOrderIds.has(orderObj.id) && !knownOrderIds.has(cleanId)) {
                freshlyArrivedOrder = orderObj;
                knownOrderIds.add(orderObj.id);
                knownOrderIds.add(cleanId);
              }
            }
          });

          // Merge with local orders, deduplicating cleanKey and hashed IDs
          const localList = getLocalOrders();
          const map = new Map<string, Order>();

          // Priority 1: Firestore orders
          firestoreOrders.forEach((o) => {
            if (o && o.id) {
              const cleanKey = o.id.replace(/^#/, '');
              map.set(cleanKey, o);
            }
          });

          // Priority 2: Local orders not yet in firestore
          localList.forEach((o) => {
            if (o && o.id) {
              const cleanKey = o.id.replace(/^#/, '');
              if (!map.has(cleanKey)) {
                map.set(cleanKey, o);
              }
            }
          });

          const sorted = Array.from(map.values()).sort(
            (a, b) => getOrderMillis(b) - getOrderMillis(a)
          );
          saveLocalOrders(sorted);
          callback(sorted, freshlyArrivedOrder);
        },
        (err) => {
          console.warn('[OrderFirestoreService] Snapshot listener warning for all orders:', err);
          callback(getLocalOrders());
        }
      );
      cleanupFns.push(() => unsubscribeFirestore());
    } catch (err) {
      console.error('[OrderFirestoreService] Failed to subscribe to all orders:', err);
      callback(getLocalOrders());
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
};

/**
 * Scans all /users/{userId}/orders and local storage records, and copies any missing order
 * documents into the main root `/orders` collection so previously placed orders (e.g. #KG-8388) show up instantly.
 */
export const migrateMissingOrdersToRootFirestore = async (): Promise<{
  migratedCount: number;
  scannedSources: number;
  migratedOrderIds: string[];
}> => {
  let migratedCount = 0;
  const migratedOrderIds: string[] = [];

  const candidateOrders = new Map<string, Order>();

  // 1. Gather all local cache orders across legacy keys
  const localKeys = ['primevault_orders', 'zeropicbd_orders', 'local_orders', 'kroyghor_orders'];
  localKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (o && o.id) {
              const cleanKey = String(o.id).replace(/^#/, '');
              if (!candidateOrders.has(cleanKey)) {
                candidateOrders.set(cleanKey, o);
              }
            }
          });
        }
      }
    } catch {}
  });

  if (!db) {
    return {
      migratedCount: 0,
      scannedSources: candidateOrders.size,
      migratedOrderIds: [],
    };
  }

  try {
    // 2. Scan via collectionGroup('orders')
    try {
      const groupSnap = await getDocs(collectionGroup(db, 'orders'));
      groupSnap.forEach((orderDoc) => {
        const data = orderDoc.data();
        const orderObj = docToOrder(data, orderDoc.id);
        if (orderObj && orderObj.id) {
          const cleanKey = orderObj.id.replace(/^#/, '');
          if (!candidateOrders.has(cleanKey)) {
            candidateOrders.set(cleanKey, orderObj);
          }
        }
      });
    } catch (groupErr) {
      console.warn('[OrderFirestoreService] Notice during collectionGroup scan:', groupErr);
    }

    // 3. Scan individual /users/{userId}/orders subcollections
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        try {
          const userOrdersCol = collection(db, 'users', userDoc.id, 'orders');
          const userOrdersSnap = await getDocs(userOrdersCol);
          userOrdersSnap.forEach((orderDoc) => {
            const data = orderDoc.data();
            const orderObj = docToOrder(data, orderDoc.id);
            if (orderObj && orderObj.id) {
              const cleanKey = orderObj.id.replace(/^#/, '');
              if (!candidateOrders.has(cleanKey)) {
                candidateOrders.set(cleanKey, orderObj);
              }
            }
          });
        } catch {
          // Ignore individual user document subcollection access warnings
        }
      }
    } catch (usersErr) {
      console.warn('[OrderFirestoreService] Notice during user scan:', usersErr);
    }

    // 4. Check existing root /orders documents
    const rootSnap = await getDocs(collection(db, 'orders'));
    const existingRootKeys = new Set<string>();
    rootSnap.forEach((d) => {
      existingRootKeys.add(d.id);
      existingRootKeys.add(d.id.replace(/^#/, ''));
      const data = d.data();
      if (data.orderId) {
        existingRootKeys.add(String(data.orderId));
        existingRootKeys.add(String(data.orderId).replace(/^#/, ''));
      }
      if (data.id) {
        existingRootKeys.add(String(data.id));
        existingRootKeys.add(String(data.id).replace(/^#/, ''));
      }
    });

    // 5. Batch write any missing orders into root /orders
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const [cleanKey, order] of candidateOrders.entries()) {
      const orderIdWithHash = order.id.startsWith('#') ? order.id : `#${order.id}`;
      
      // If missing from root /orders, write it
      if (!existingRootKeys.has(cleanKey) || !existingRootKeys.has(orderIdWithHash)) {
        const rootOrderRefClean = doc(db, 'orders', cleanKey);
        const rootOrderRefHashed = doc(db, 'orders', orderIdWithHash);

        const payload = {
          orderId: orderIdWithHash,
          id: orderIdWithHash,
          cleanId: cleanKey,
          userId: order.userId || 'guest',
          customerName: order.customerName || order.address?.fullName || 'Customer',
          customerEmail: order.customerEmail || '',
          customerPhone: order.customerPhone || order.address?.phone || '',
          shippingAddress: order.address || {},
          address: order.address || {},
          items: (order.items || []).map((i) => ({
            productId: i.product?.id || `p-${Math.random()}`,
            title: i.product?.title || 'Product',
            price: Number(i.product?.price) || 0,
            quantity: Number(i.quantity) || 1,
            image: i.product?.image || '/kroyghor-icon.svg',
            selectedSize: i.selectedSize || '',
            product: {
              id: i.product?.id,
              title: i.product?.title,
              price: i.product?.price,
              image: i.product?.image,
              category: i.product?.category,
            },
          })),
          subtotal: Number(order.subtotal) || 0,
          deliveryCharge: Number(order.deliveryFee) || 0,
          deliveryFee: Number(order.deliveryFee) || 0,
          walletDiscount: Number(order.walletDeducted) || 0,
          walletDeducted: Number(order.walletDeducted) || 0,
          totalAmount: Number(order.total) || 0,
          total: Number(order.total) || 0,
          paymentMethod: order.paymentMethod || 'COD',
          paymentStatus: order.paymentStatus || 'Pending',
          orderStatus: order.status || 'Pending',
          status: order.status || 'Pending',
          trxId: order.trxId || '',
          date: order.date || new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        batch.set(rootOrderRefClean, payload, { merge: true });
        batch.set(rootOrderRefHashed, payload, { merge: true });
        batchCount += 2;
        migratedCount++;
        migratedOrderIds.push(orderIdWithHash);
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`[OrderFirestoreService] Migrated ${migratedCount} missing orders into root /orders collection:`, migratedOrderIds);
    }
  } catch (err) {
    console.error('[OrderFirestoreService] Error in migrateMissingOrdersToRootFirestore:', err);
  }

  return {
    migratedCount,
    scannedSources: candidateOrders.size,
    migratedOrderIds,
  };
};
