export interface Product {
  id: string;
  title: string;
  name?: string;
  subtitle?: string;
  category: 'Perfume' | 'Glow Lights' | 'Attar Perfumes' | 'Notebooks' | 'Bricks Toys' | string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  regularPrice?: number;
  discount?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  videoPoster?: string;
  sampleVideoUrl?: string;
  aiShowcaseVideoUrl?: string;
  description: string;
  tag?: string;
  tags?: string[];
  badge?: 'Featured' | 'Best Seller' | 'New Arrival' | 'On Sale' | string;
  sku?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  inStock: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'pre_order';
  stockQuantity?: number;
  lowStockThreshold?: number;
  storeName?: string;
  sellerName?: string;
  soldCount?: number;
  ratingText?: string;
  features: string[];
  fragranceNotes?: {
    top?: string;
    heart?: string;
    base?: string;
  };
  sizes?: string[];
  variants?: { size: string; price: number; stock?: number }[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed'; // 'percentage' (%) or 'fixed' (৳)
  discountValue: number;
  minOrderAmount?: number;
  expiryDate?: string; // YYYY-MM-DD
  isActive: boolean;
  usageCount?: number;
  description?: string;
  isAutoApply?: boolean;
  autoApplyRule?: 'first_order' | 'free_shipping' | 'cart_threshold' | 'multi_item';
  autoApplyLabel?: string;
}

export interface NotificationLog {
  id: string;
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  type: 'sms' | 'email';
  channel: 'GP_BULK_SMS' | 'ROBI_GATEWAY' | 'BANGLALINK_SMS' | 'GREENWEB_SMS' | 'BULKSMS_BD' | 'ELITBUZZ_SMS' | 'SSL_WIRELESS_SMS' | 'AWS_SES_EMAIL' | 'SENDGRID_EMAIL';
  title: string;
  message: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  sentAt: string;
  gatewayTrxId?: string;
  providerResponse?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  storeName?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  district?: string;
  cityDivision: 'Inside Dhaka' | 'Outside Dhaka';
  fullAddress: string;
  notes?: string;
  label?: string;
  isDefault?: boolean;
}

export interface WalletTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
}

export type UserRole = 'customer' | 'seller' | 'admin' | 'super_admin';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: number; // Unix timestamp ms
  issuedAt: number;
  role: UserRole;
  email?: string;
  phone?: string;
}

export interface UserProfile {
  uid?: string;
  isLoggedIn: boolean;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  walletBalance: number;
  hasReceivedBonus: boolean;
  hasClaimedYouTubeBonus?: boolean;
  youtubeHandle?: string;
  isPhoneVerified?: boolean;
  authProvider?: 'google' | 'phone' | 'email';
  avatar?: string;
  address: Address;
  savedAddresses?: Address[];
  walletHistory?: WalletTransaction[];
  session?: AuthSession;
}

export interface YouTubeBonusClaim {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  youtubeHandle: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface ReturnRequest {
  id: string;
  requestedAt: string;
  reason: string;
  additionalDetails?: string;
  photoProofUrl?: string;
  status: 'Pending Review' | 'Approved' | 'Refund Credited to Wallet' | 'Rejected';
  refundAmount: number;
  resolutionType: 'Wallet Credit' | 'Replacement' | 'Original Payment';
  courierPickupDate?: string;
  adminNotes?: string;
}

export interface Order {
  id: string;
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  time?: string;
  customerEmail?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  walletDeducted: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'card';
  trxId?: string;
  paymentStatus?: 'Verified' | 'Pending Verification' | 'Paid (COD on Delivery)' | 'Paid' | 'Unpaid' | 'Failed';
  address: Address;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Ready for Pickup' | 'Shipped' | 'Delivered' | 'Cancelled';
  courierName?: string;
  trackingNumber?: string;
  trackingNotes?: string;
  returnRequest?: ReturnRequest;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  quickOptions?: string[];
}

export type ActivePage = 
  | 'Home' 
  | 'ProductDetail' 
  | 'Cart' 
  | 'Checkout' 
  | 'MyOrders' 
  | 'UserProfile' 
  | 'SellerCenter' 
  | 'Admin' 
  | 'Store' 
  | 'TrackOrder';

export interface CustomerReview {
  id: string;
  productId?: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  likes: number;
  hasLiked?: boolean;
  longevityRating?: '4-6 Hours' | '6-8 Hours' | '8-12 Hours' | 'All Day (12h+)';
  authenticityRating?: string;
  photoUrl?: string;
}

export interface CourierRiderInfo {
  name: string;
  phone: string;
  bikeNumber: string;
  hubName: string;
  avatar?: string;
  currentEtaMinutes: number;
}

export interface Seller {
  id: string;
  storeName: string;
  slug: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  nidOrTradeLicense: string;
  payoutMethod: 'bkash' | 'nagad' | 'bank';
  payoutAccount: string;
  bankName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  bannerImage?: string;
  logoImage?: string;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  totalSales?: number;
  responseRate?: string;
  followersCount?: number;
  joinedDate?: string;
  verified?: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  urlOrId: string;
  description?: string;
  badge?: string;
}

export interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  discountText: string;
  imageUrl: string;
  category: string;
  primaryCtaText: string;
  primaryCtaTarget?: string;
  secondaryCtaText?: string;
  secondaryCtaTarget?: string;
  codeText?: string;
  isActive: boolean;
  linkedProductId?: string;
  accentColor?: string;
}

export interface CampaignBannerConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  promoCode?: string;
  bgColor?: string;
  bgImageUrl?: string;
  buttonText: string;
  linkTarget: string; // e.g. '#explore', '/checkout', 'Flash Sale', or category
  badgeText?: string;
  updatedAt?: any;
}

export interface SystemBannerSettings {
  announcementText: string;
  announcementBadge: string;
  helplineNumber: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerImage?: string;
  flashSaleTag: string;
  campaignBanner?: CampaignBannerConfig;
  // YouTube Video & Channel Integration
  youtubeVideoUrl?: string; // Featured video URL or Video ID
  youtubeChannelUrl?: string; // Official YouTube channel URL
  youtubeSectionTitle?: string;
  youtubeSectionSubtitle?: string;
  youtubePlaylist?: YouTubeVideo[];
  promoBanners?: PromoBanner[];
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'bank';
  account: string;
  bankName?: string;
  requestedAt: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  trxId?: string;
}

export type SortOption = 'popularity' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

export interface CatalogFilterState {
  categories: string[]; // multi-department selection
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  minDiscount: number; // 0, 10, 20, 30, 50
  minRating: number; // 0, 3, 4
  selectedTags: string[]; // e.g., 'Best Seller', 'Trending', etc.
  selectedBrands: string[]; // Brand names or seller tags
  sortBy: SortOption;
}

// ==================== BACKEND API REQUEST / RESPONSE PAYLOADS ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  source?: 'api' | 'local_fallback';
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilterParams {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  count: number;
  slug?: string;
  icon?: string;
}

export interface CreateOrderPayload {
  items: CartItem[];
  subtotal: number;
  discount: number;
  walletDeducted: number;
  deliveryFee: number;
  total: number;
  paymentMethod: Order['paymentMethod'];
  trxId?: string;
  address: Address;
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: Order['status'];
  paymentStatus?: Order['paymentStatus'];
  courierName?: string;
  trackingNumber?: string;
}

export interface CartSyncPayload {
  userId?: string;
  items: CartItem[];
}

export interface WalletActionPayload {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  orderId?: string;
}

export interface WalletResponse {
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface CouponValidationResponse {
  coupon: Coupon | null;
  discount: number;
  valid: boolean;
  message: string;
}

// ==================== LOGISTICS & COURIER WEBHOOK PAYLOADS ====================

export interface PathaoWebhookPayload {
  consignment_id: string;
  merchant_order_id: string;
  order_status: string; // e.g. "Pickup Pending", "In Transit", "Out for Delivery", "Delivered", "Returned"
  order_status_slug: 'pickup_pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | string;
  delivery_fee?: number;
  collected_amount?: number;
  reason?: string | null;
  updated_at?: string;
  rider_details?: {
    name?: string;
    phone?: string;
    bike_number?: string;
  };
}

export interface SteadfastWebhookPayload {
  status: number;
  notification_type: 'delivery_status' | string;
  consignment: {
    consignment_id: number | string;
    invoice: string; // merchant order id e.g. PVZ-91823
    recipient_name?: string;
    recipient_phone?: string;
    recipient_address?: string;
    cod_amount?: number;
    status: 'pending' | 'in_review' | 'delivered' | 'partial_delivered' | 'cancelled' | 'hold' | string;
    updated_at?: string;
  };
}

export interface CourierTrackingMilestone {
  id: string;
  title: string;
  desc: string;
  date: string;
  completed: boolean;
  current: boolean;
  hub?: string;
}

export interface LiveCourierTrackingInfo {
  orderId: string;
  courierName: string;
  consignmentId: string;
  status: Order['status'];
  statusText: string;
  etaMinutes: number;
  rider: CourierRiderInfo;
  timeline: CourierTrackingMilestone[];
  lastUpdated: string;
}
