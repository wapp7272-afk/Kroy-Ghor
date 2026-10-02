import React from 'react';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Store, 
  Code2,
  Gift,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';
import { VaultLogo } from './VaultLogo';

interface FooterProps {
  onGoHome: () => void;
  onOpenOrders: () => void;
  onOpenAuth: () => void;
  onOpenSellerCenter?: () => void;
  onOpenSellerStore?: (slug: string) => void;
  onOpenAdmin: () => void;
  onDownloadHtml: () => void;
  onOpenFaq?: () => void;
  onOpenReturnPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onGoHome,
  onOpenOrders,
  onOpenAuth,
  onOpenSellerCenter,
  onOpenSellerStore,
  onOpenAdmin,
  onDownloadHtml,
  onOpenFaq,
  onOpenReturnPolicy,
}) => {
  return (
    <footer className="bg-[#0A1B3D] text-white pt-10 pb-8 border-t border-slate-800">
      {/* ================= 1. TRUST & VALUE PROPOSITION BADGES (From Brand Sheet) ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#050D20] border border-slate-800">
          {/* 1. Secure */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F3F7FF] flex items-center justify-center text-[#007BFF] shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Secure</h4>
              <p className="text-[11px] text-slate-300">Safe bKash, Nagad & Cards</p>
            </div>
          </div>

          {/* 2. Fast Delivery */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F3F7FF] flex items-center justify-center text-[#7A3BFF] shrink-0 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fast Delivery</h4>
              <p className="text-[11px] text-slate-300">24-48h in Dhaka, 3-5 days BD</p>
            </div>
          </div>

          {/* 3. 24/7 Support */}
          <div 
            onClick={onOpenFaq}
            className={`flex items-center gap-3.5 ${onOpenFaq ? 'cursor-pointer group hover:opacity-90 transition-opacity' : ''}`}
            title="Click to view Customer Support & FAQs"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F3F7FF] flex items-center justify-center text-[#00C6FF] shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 group-hover:text-[#00C6FF]">
                <span>24/7 Support</span>
                {onOpenFaq && <span className="text-[10px] text-[#00C6FF] underline">Help</span>}
              </h4>
              <p className="text-[11px] text-slate-300">Phone, WhatsApp & Live Help</p>
            </div>
          </div>

          {/* 4. Best Deals & Easy Return */}
          <div 
            onClick={onOpenReturnPolicy}
            className={`flex items-center gap-3.5 ${onOpenReturnPolicy ? 'cursor-pointer group hover:opacity-90 transition-opacity' : ''}`}
            title="Click to view Return Policy & Deals"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F3F7FF] flex items-center justify-center text-[#7A3BFF] shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 group-hover:text-[#00C6FF]">
                <span>Best Deals</span>
                {onOpenReturnPolicy && <span className="text-[10px] text-[#00C6FF] underline">Return</span>}
              </h4>
              <p className="text-[11px] text-slate-300">Verified Quality & 7-Day Return</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. MAIN FOOTER MULTI-COLUMN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-slate-800">
          {/* Col 1: Brand & Contact Info (Matches Brand Sheet) */}
          <div className="lg:col-span-2 space-y-3.5">
            <button onClick={onGoHome} className="focus:outline-none cursor-pointer block text-left group">
              <div className="bg-white/95 hover:bg-white rounded-2xl px-3.5 py-2 inline-flex items-center shadow-md transition-all group-hover:scale-[1.02]">
                <img
                  src="/logo.png"
                  alt="ZeropicBD"
                  className="h-10 sm:h-11 w-auto object-contain"
                  style={{ objectFit: 'contain' }}
                  loading="lazy"
                />
              </div>
              <div className="text-[10.5px] font-black text-[#00C6FF] tracking-[0.25em] mt-2 uppercase flex items-center gap-1.5">
                <span>SHOP SMART</span>
                <span className="text-white/60">•</span>
                <span>LIVE BETTER</span>
              </div>
            </button>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              <strong className="text-white">ZeropicBD</strong> is Bangladesh's premier verified lifestyle and marketplace. Discover curated authentic collections, premium essentials, and seamless shopping with bKash, Nagad, and Cash on Delivery nationwide.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#00C6FF]" />
                <span className="font-semibold text-white">+880 1883-418309</span>
                <span className="text-[11px] text-slate-400">(9 AM - 10 PM)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#00C6FF]" />
                <span className="text-slate-200">support@zeropicbd.com</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#00C6FF] shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  Dhanmondi 27, Dhaka - 1209, Bangladesh
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Customer Support & Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C6FF]" />
              <span>Customer Care</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button 
                  onClick={onOpenOrders}
                  className="hover:text-[#00C6FF] transition-colors cursor-pointer"
                >
                  Track Your Order (অর্ডার ট্র্যাকিং)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenAuth}
                  className="hover:text-[#00C6FF] transition-colors cursor-pointer"
                >
                  My Account & Wallet (ওয়ালেট)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenFaq}
                  className="hover:text-[#00C6FF] transition-colors cursor-pointer text-left"
                >
                  Help Center & FAQs (সাধারণ প্রশ্নোত্তর)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="hover:text-[#00C6FF] transition-colors cursor-pointer text-left font-medium text-slate-200"
                >
                  Returns & Refunds Policy (৭ দিনের রিটার্ন)
                </button>
              </li>
              <li>
                <a href="#shipping" className="hover:text-[#00C6FF] transition-colors">
                  Shipping Rates & Delivery
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#00C6FF] transition-colors">
                  Terms of Service & Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Seller Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A3BFF]" />
              <span>Seller Information</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {onOpenSellerStore && (
                <li>
                  <button 
                    onClick={() => onOpenSellerStore('perfume-vault-bd')}
                    className="hover:text-[#00C6FF] transition-colors font-semibold text-[#00C6FF] flex items-center gap-1 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Brand Storefronts</span>
                  </button>
                </li>
              )}
              {onOpenSellerCenter && (
                <li>
                  <button 
                    onClick={onOpenSellerCenter}
                    className="hover:text-[#00C6FF] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Seller Center & Portal</span>
                  </button>
                </li>
              )}
              <li>
                <a href="#sell" className="hover:text-[#00C6FF] transition-colors">
                  Sell on ZeropicBD
                </a>
              </li>
              <li>
                <a href="#seller-policy" className="hover:text-[#00C6FF] transition-colors">
                  Seller Code of Conduct
                </a>
              </li>
              <li>
                <a href="#warehouses" className="hover:text-[#00C6FF] transition-colors">
                  Fulfillment Centers
                </a>
              </li>
              <li>
                <a href="#verified" className="hover:text-[#00C6FF] transition-colors">
                  Verified Merchant Badge
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods & Logistics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007BFF]" />
              <span>Payment & Security</span>
            </h4>
            <div className="space-y-3">
              <p className="text-[11px] text-slate-300">
                100% Secure Checkout with Instant Automated Confirmation:
              </p>

              {/* Bangladesh Payment Badges */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-md border border-slate-700 bg-white text-[10px] font-bold text-[#E2136E]">
                  bKash
                </div>
                <div className="p-1.5 rounded-md border border-slate-700 bg-white text-[10px] font-bold text-[#F7941D]">
                  Nagad
                </div>
                <div className="p-1.5 rounded-md border border-slate-700 bg-white text-[10px] font-bold text-[#8C1E70]">
                  Rocket
                </div>
                <div className="p-1.5 rounded-md border border-slate-700 bg-white text-[10px] font-bold text-[#1A1F71]">
                  VISA
                </div>
                <div className="p-1.5 rounded-md border border-slate-700 bg-white text-[10px] font-bold text-[#EB001B]">
                  Mastercard
                </div>
                <div className="p-1.5 rounded-md border border-[#007BFF] bg-[#007BFF]/20 text-[10px] font-bold text-[#00C6FF]">
                  Cash on Del.
                </div>
              </div>

              <div className="pt-1.5">
                <span className="text-[10px] font-medium text-slate-300 block mb-1">
                  Delivery Logistics Partners:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-200 font-mono">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded">Pathao Courier</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded">Steadfast</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded">Paperfly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. FOOTER PREVIEW BAR (Matches Brand Sheet Bottom Card) ================= */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
          {/* Logo & Vertical Divider Lockup */}
          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="focus:outline-none cursor-pointer">
              <VaultLogo size="sm" variant="dark" showDivider={true} />
            </button>
          </div>

          {/* Social Media Channels (Facebook, Instagram, YouTube, TikTok as shown in Sheet) */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Follow Us:</span>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#007BFF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#7A3BFF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#00C6FF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="TikTok"
            >
              <span className="font-bold text-xs">♪</span>
            </a>
          </div>
        </div>

        {/* ================= 4. BOTTOM COPYRIGHT & EXPORT ================= */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-white">ZeropicBD</strong>. All rights reserved. Registered Trademark in Bangladesh.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onDownloadHtml}
              className="text-[#00C6FF] hover:text-[#80E5FF] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              id="footer-admin-link"
              onClick={onOpenAdmin}
              className="text-slate-300 hover:text-[#00C6FF] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00C6FF]" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
