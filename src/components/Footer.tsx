import React from 'react';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  CreditCard, 
  Store,
  ExternalLink,
  Heart,
  Code2
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
    <footer className="bg-white border-t border-slate-200 text-[#0F172A] pt-10 pb-8">
      {/* Trust & Guarantee Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#0F172A]">Fast Delivery Nationwide</h4>
              <p className="text-[11px] text-slate-500">24-48h in Dhaka, 3-5 days outside</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#0F172A]">100% Genuine Guaranteed</h4>
              <p className="text-[11px] text-slate-500">Authentic products & verified sellers</p>
            </div>
          </div>

          <div 
            onClick={onOpenReturnPolicy}
            className={`flex items-center gap-3 ${onOpenReturnPolicy ? 'cursor-pointer group hover:bg-white p-1 rounded-lg transition-colors' : ''}`}
            title="Click to view 7-Day Return Policy"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1 group-hover:text-[#4F46E5]">
                <span>7 Days Easy Return</span>
                {onOpenReturnPolicy && <span className="text-[10px] text-[#4F46E5] underline">View</span>}
              </h4>
              <p className="text-[11px] text-slate-500">Hassle-free replacement policy</p>
            </div>
          </div>

          <div 
            onClick={onOpenFaq}
            className={`flex items-center gap-3 ${onOpenFaq ? 'cursor-pointer group hover:bg-white p-1 rounded-lg transition-colors' : ''}`}
            title="Click to view Customer Support & FAQs"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1 group-hover:text-[#4F46E5]">
                <span>24/7 Dedicated Support</span>
                {onOpenFaq && <span className="text-[10px] text-[#4F46E5] underline">FAQ</span>}
              </h4>
              <p className="text-[11px] text-slate-500">Phone, WhatsApp & Live Help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-slate-200">
          {/* Col 1: Brand & Contact Info */}
          <div className="lg:col-span-2 space-y-3.5">
            <button onClick={onGoHome} className="focus:outline-none cursor-pointer">
              <VaultLogo size="md" />
            </button>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Prime Vault Zone is Bangladesh's premier verified lifestyle and perfume marketplace. Discover authentic fragrances, curated collections, and enjoy seamless shopping with bKash, Nagad, and cash on delivery.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#4F46E5]" />
                <span className="font-semibold text-[#0F172A]">+880 1883-418309</span>
                <span className="text-[11px] text-slate-400">(9 AM - 10 PM)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#4F46E5]" />
                <span className="text-slate-700">support@primevaultzone.com</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <span className="text-slate-600">
                  Dhanmondi 27, Dhaka - 1209, Bangladesh
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Customer Support & Care */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button 
                  onClick={onOpenOrders}
                  className="hover:text-[#4F46E5] transition-colors cursor-pointer"
                >
                  Track Your Order
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenAuth}
                  className="hover:text-[#4F46E5] transition-colors cursor-pointer"
                >
                  My Account & Wallet
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenFaq}
                  className="hover:text-[#4F46E5] transition-colors cursor-pointer text-left"
                >
                  Help Center & FAQs (সাধারণ প্রশ্নোত্তর)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="hover:text-[#4F46E5] transition-colors cursor-pointer text-left font-medium text-slate-700"
                >
                  Returns & Refunds Policy (৭ দিনের রিটার্ন)
                </button>
              </li>
              <li>
                <a href="#shipping" className="hover:text-[#4F46E5] transition-colors">
                  Shipping Rates & Delivery
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#4F46E5] transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Seller Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Seller Information
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              {onOpenSellerStore && (
                <li>
                  <button 
                    onClick={() => onOpenSellerStore('perfume-vault-bd')}
                    className="hover:text-[#4F46E5] transition-colors font-semibold text-[#4F46E5] flex items-center gap-1 cursor-pointer"
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
                    className="hover:text-[#4F46E5] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Seller Center & Portal</span>
                  </button>
                </li>
              )}
              <li>
                <a href="#sell" className="hover:text-[#4F46E5] transition-colors">
                  Sell on Prime Vault
                </a>
              </li>
              <li>
                <a href="#seller-policy" className="hover:text-[#4F46E5] transition-colors">
                  Seller Code of Conduct
                </a>
              </li>
              <li>
                <a href="#warehouses" className="hover:text-[#4F46E5] transition-colors">
                  Fulfillment Centers
                </a>
              </li>
              <li>
                <a href="#verified" className="hover:text-[#4F46E5] transition-colors">
                  Verified Brand Badge
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods & Logistics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] mb-3">
              Payment & Security
            </h4>
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                100% Secure Checkout with Instant Automated Confirmation:
              </p>

              {/* Bangladesh Payment Badges */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-[#E2136E]">
                  bKash
                </div>
                <div className="p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-[#F7941D]">
                  Nagad
                </div>
                <div className="p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-[#8C1E70]">
                  Rocket
                </div>
                <div className="p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-[#1A1F71]">
                  VISA
                </div>
                <div className="p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-[#EB001B]">
                  Mastercard
                </div>
                <div className="p-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-[10px] font-bold text-[#4F46E5]">
                  Cash on Del.
                </div>
              </div>

              <div className="pt-1.5">
                <span className="text-[10px] font-medium text-slate-500 block mb-1">
                  Delivery Logistics Partners:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 font-mono">
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Pathao Courier</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Steadfast</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded">Paperfly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright & Admin Shortcut */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-[#0F172A]">PRIME VAULT ZONE</strong>. All rights reserved. Registered Trademark in Bangladesh.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={onDownloadHtml}
              className="text-[#4F46E5] hover:text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              id="footer-admin-link"
              onClick={onOpenAdmin}
              className="text-slate-600 hover:text-[#4F46E5] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
