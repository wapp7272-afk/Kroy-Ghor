import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc
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

/**
 * Transforms a Firestore document back into our application's `Order` object
 */
export const docToOrder = (data: any, docId: string): Order => {
  const items: CartItem[] = (data.items || []).map((item: any) => ({
    product: {
      id: item.productId || item.product?.id || `p-${Math.random()}`,
      title: item.title || item.product?.title || 'Kroyghor Authentic Product',
      price: item.price || item.product?.price || 0,
      discountPrice: item.price || item.product?.discountPrice,
      image: item.image || item.product?.image || '/kroyghor-icon.svg',
      category: item.category || item.product?.category || 'Lifestyle',
      rating: 5,
      reviewsCount: 1,
      stockQuantity: 10,
      isBestSeller: true,
      description: 'Authentic product',
    },
    quantity: item.quantity || 1,
    selectedSize: item.selectedSize || item.size || 'Standard',
  }));

  const shippingAddr = data.shippingAddress || data.address || {};
  const addressObj: Address = {
    fullName: data.customerName || shippingAddr.fullName || 'Kroyghor Member',
    phone: data.customerPhone || shippingAddr.phone || '01883418309',
    cityDivision: shippingAddr.cityDivision || 'Inside Dhaka',
    fullAddress: shippingAddr.fullAddress || shippingAddr.address || 'Dhaka',
    district: shippingAddr.district || 'Dhaka',
    notes: shippingAddr.notes || '',
  };

  const id = data.orderId || docId || data.id || `KG-${Math.floor(10000 + Math.random() * 90000)}`;

  return {
    id,
    userId: data.userId || '',
    customerName: data.customerName || addressObj.fullName,
    customerPhone: data.customerPhone || addressObj.phone,
    customerEmail: data.customerEmail || data.email || '',
    date: data.createdAt
      ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : data.date || new Date().toLocaleDateString('en-GB'),
    items,
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    walletDeducted: data.walletDiscount || data.walletDeducted || 0,
    deliveryFee: data.deliveryCharge || data.deliveryFee || 0,
    total: data.totalAmount || data.total || 0,
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
 * Saves a new order into Firestore backend (`orders/{orderId}`)
 */
export const saveOrderToFirestore = async (order: Order, currentUserId?: string): Promise<Order> => {
  const uid = currentUserId || auth?.currentUser?.uid || order.userId || 'guest';
  const orderId = order.id || `#KG-${Math.floor(1000 + Math.random() * 9000)}`;

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

  const mappedPaymentStatus: 'Pending' | 'Paid' =
    order.paymentStatus === 'Paid' || (order.paymentMethod !== 'cod' && Boolean(order.trxId))
      ? 'Paid'
      : 'Pending';

  const mappedOrderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' =
    (order.status as any) || 'Pending';

  const firestoreDocPayload = {
    orderId,
    userId: uid,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress: {
      Street: order.address.fullAddress,
      City: order.address.cityDivision,
      Zip: (order.address as any).zip || '1200',
      Notes: order.address.notes || '',
      fullName: order.address.fullName,
      phone: order.address.phone,
      cityDivision: order.address.cityDivision,
      fullAddress: order.address.fullAddress,
      district: order.address.district || 'Dhaka',
    },
    items: order.items.map((i) => ({
      productId: i.product.id,
      title: i.product.title,
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.image,
      selectedSize: i.selectedSize || '',
    })),
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryFee,
    walletDiscount: order.walletDeducted || 0,
    totalAmount: order.total,
    paymentMethod: mappedPaymentMethod,
    paymentStatus: mappedPaymentStatus,
    orderStatus: mappedOrderStatus,
    trxId: order.trxId || '',
    createdAt: serverTimestamp(),
  };

  const completedOrder: Order = {
    ...order,
    id: orderId,
    userId: uid,
    customerName,
    customerEmail,
    customerPhone,
  };

  // 1. Instant multi-channel broadcast across tabs and admin (< 10ms)
  broadcastNewOrder(completedOrder);

  // 2. Persist in local storage
  const localList = getLocalOrders();
  const filtered = localList.filter((o) => o.id !== orderId);
  saveLocalOrders([completedOrder, ...filtered]);

  // 3. Persist in Firestore (both /orders and /users collections)
  if (db) {
    try {
      const cleanDocId = orderId.replace('#', '');
      const orderRef = doc(db, 'orders', cleanDocId);
      await setDoc(orderRef, firestoreDocPayload, { merge: true });

      // Update user record in /users collection with hasPlacedOrders: true
      const userDocIds = new Set<string>();
      if (uid && uid !== 'guest') userDocIds.add(uid);
      if (customerEmail) userDocIds.add(customerEmail.replace(/[^a-zA-Z0-9]/g, '_'));

      for (const targetUserDocId of userDocIds) {
        try {
          const userRef = doc(db, 'users', targetUserDocId);
          await setDoc(userRef, {
            hasPlacedOrders: true,
            lastOrderAt: serverTimestamp(),
            lastOrderAmount: order.total,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          console.warn('[OrderFirestoreService] Minor error updating user hasPlacedOrders flag:', e);
        }
      }
    } catch (err) {
      console.error('[OrderFirestoreService] Error saving order to Firestore:', err);
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

  // 3. Live Firestore Snapshot
  if (db && (currentUid || currentEmail)) {
    try {
      const ordersCol = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        ordersCol,
        (snapshot) => {
          const firestoreOrders: Order[] = [];
          snapshot.forEach((d) => {
            const orderObj = docToOrder(d.data(), d.id);
            if (isUserMatch(orderObj)) {
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
    const snap = await getDoc(userRef);
    let currentBalance = 0;
    if (snap.exists()) {
      currentBalance = snap.data()?.walletBalance || 0;
    }
    const newBalance = Math.max(0, currentBalance - amount);
    const now = new Date().toISOString();

    await setDoc(
      userRef,
      {
        walletBalance: newBalance,
        updatedAt: now,
      },
      { merge: true }
    );

    // Record DEBIT entry in wallet_transactions collection
    const transactionsCol = collection(db, 'wallet_transactions');
    await addDoc(transactionsCol, {
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
  } catch (e) {
    console.error('[OrderFirestoreService] Error deducting wallet in Firestore:', e);
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
 */
export const refundUserWalletInFirestore = async (
  uid: string,
  amount: number,
  orderId: string,
  userEmail?: string
): Promise<number> => {
  if (!uid || amount <= 0 || !db) return 0;
  const firestore = db;
  try {
    const userRef = doc(firestore, 'users', uid);
    const snap = await getDoc(userRef);
    let currentBalance = 0;
    if (snap.exists()) {
      currentBalance = snap.data()?.walletBalance || 0;
    }
    const newBalance = currentBalance + amount;
    const now = new Date().toISOString();

    await setDoc(
      userRef,
      {
        walletBalance: newBalance,
        updatedAt: now,
      },
      { merge: true }
    );

    // Record CREDIT entry in wallet_transactions collection
    const transactionsCol = collection(firestore, 'wallet_transactions');
    await addDoc(transactionsCol, {
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
  } catch (e) {
    console.error('[OrderFirestoreService] Error refunding wallet in Firestore:', e);
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
 * Real-time subscription to ALL orders for Admin panel (Firestore onSnapshot + BroadcastChannel + Window Events)
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
    if (o?.id) knownOrderIds.add(o.id);
  });
  callback(initialLocal);

  const handleIncomingOrder = (newOrder: Order) => {
    if (!newOrder || !newOrder.id) return;
    const isBrandNew = !knownOrderIds.has(newOrder.id);
    knownOrderIds.add(newOrder.id);

    const localList = getLocalOrders();
    const filtered = localList.filter((o) => o.id !== newOrder.id);
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

  // 3. Firestore Live onSnapshot Listener
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
            firestoreOrders.push(orderObj);
            if (orderObj.id && !knownOrderIds.has(orderObj.id)) {
              freshlyArrivedOrder = orderObj;
              knownOrderIds.add(orderObj.id);
            }
          });

          // Merge with local orders
          const localList = getLocalOrders();
          const map = new Map<string, Order>();
          [...firestoreOrders, ...localList].forEach((o) => {
            if (o && o.id) {
              map.set(o.id, o);
            }
          });

          const sorted = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
