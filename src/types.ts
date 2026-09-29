export interface Product {
  id: string;
  title: string;
  name?: string;
  category: 'Perfume' | 'Glow Lights' | 'Attar Perfumes' | 'Notebooks' | 'Bricks Toys' | string;
  price: number;
  originalPrice?: number;
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
  isFeatured?: boolean;
  inStock: boolean;
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
  channel: 'GP_BULK_SMS' | 'ROBI_GATEWAY' | 'BANGLALINK_SMS' | 'AWS_SES_EMAIL' | 'SENDGRID_EMAIL';
  title: string;
  message: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  sentAt: string;
  gatewayTrxId?: string;
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

export interface UserProfile {
  isLoggedIn: boolean;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  hasReceivedBonus: boolean;
  isPhoneVerified?: boolean;
  authProvider?: 'google' | 'phone' | 'email';
  avatar?: string;
  address: Address;
  savedAddresses?: Address[];
  walletHistory?: WalletTransaction[];
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
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  walletDeducted: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'card';
  trxId?: string;
  paymentStatus?: 'Verified' | 'Pending Verification' | 'Paid (COD on Delivery)' | 'Failed';
  address: Address;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Ready for Pickup' | 'Shipped' | 'Delivered' | 'Cancelled';
  courierName?: string;
  trackingNumber?: string;
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

export interface SystemBannerSettings {
  announcementText: string;
  announcementBadge: string;
  helplineNumber: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBannerImage?: string;
  flashSaleTag: string;
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
