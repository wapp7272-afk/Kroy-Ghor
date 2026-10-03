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
import { Logo } from './Logo';
import { VaultLogo } from './VaultLogo';

export interface FooterProps {
  onGoHome?: () => void;
  onOpenOrders?: () => void;
  onOpenAuth?: () => void;
  onOpenSellerCenter?: () => void;
  onOpenSellerStore?: (slug: string) => void;
  onOpenAdmin?: () => void;
  onDownloadHtml?: () => void;
  onOpenFaq?: () => void;
  onOpenReturnPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = React.memo(({
  onGoHome = () => window.scrollTo({ top: 0, behavior: 'smooth' }),
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
    <footer className="bg-gray-900 text-white pt-10 pb-8 border-t border-gray-800">
      {/* ================= 1. TRUST & VALUE PROPOSITION BADGES ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0b1329] border border-gray-800">
          {/* 1. Secure */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#00C6FF] shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">১০০% নিরাপদ শপিং</h4>
              <p className="text-[11px] text-gray-300">bKash, Nagad ও ক্যাশ অন ডেলিভারি</p>
            </div>
          </div>

          {/* 2. Fast Delivery */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">দ্রুততম ডেলিভারি</h4>
              <p className="text-[11px] text-gray-300">ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ৩-৫ দিন</p>
            </div>
          </div>

          {/* 3. 24/7 Support */}
          <div 
            onClick={onOpenFaq}
            className={`flex items-center gap-3.5 ${onOpenFaq ? 'cursor-pointer group hover:opacity-90 transition-opacity' : ''}`}
            title="গ্রাহক সেবা ও সাধারণ জিজ্ঞাসা"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 group-hover:text-cyan-400">
                <span>২৪/৭ গ্রাহক সেবা</span>
                {onOpenFaq && <span className="text-[10px] text-cyan-400 underline">Help</span>}
              </h4>
              <p className="text-[11px] text-gray-300">হটলাইন ও ইনস্ট্যান্ট সাপোর্ট</p>
            </div>
          </div>

          {/* 4. Best Deals & Easy Return */}
          <div 
            onClick={onOpenReturnPolicy}
            className={`flex items-center gap-3.5 ${onOpenReturnPolicy ? 'cursor-pointer group hover:opacity-90 transition-opacity' : ''}`}
            title="রিটার্ন ও রিপ্লেসমেন্ট পলিসি"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1 group-hover:text-cyan-400">
                <span>সেরা অফার ও রিটার্ন</span>
                {onOpenReturnPolicy && <span className="text-[10px] text-cyan-400 underline">Return</span>}
              </h4>
              <p className="text-[11px] text-gray-300">৭ দিনের সহজ রিটার্ন পলিসি</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. MAIN FOOTER MULTI-COLUMN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-gray-800">
          {/* Brand Info (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            <button onClick={onGoHome} className="focus:outline-none cursor-pointer block text-left group">
              <Logo variant="full" theme="dark" size="lg" />
            </button>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              <strong className="text-white">Kroyghor (ক্রয় ঘর)</strong> - আপনার বিশ্বস্ত শপিং পার্টনার। সেরা দামে গুণগত মানের সেরা লাইফস্টাইল, গ্যাজেট ও নিত্যনতুন ট্রেন্ডি পণ্য পেতে আমাদের সাথেই থাকুন।
            </p>

            <div className="space-y-2 pt-2 text-xs text-gray-300">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">হটলাইন: +880 1700-000000</span>
                <span className="text-[11px] text-gray-400">(সকাল ৯টা - রাত ১০টা)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-200">ইমেইল: support@kroyghor.com</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-gray-300">
                  ঠিকানা: ধানমন্ডি ২৭, ঢাকা - ১২০৯, বাংলাদেশ
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links (কুইক লিঙ্ক) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>কুইক লিঙ্ক</span>
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button 
                  onClick={onGoHome}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  আমাদের সম্পর্কে (About Us)
                </button>
              </li>
              <li>
                <button 
                  onClick={onGoHome}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  শপ / ক্যাটাগরি (Shop)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenOrders}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  অর্ডার ট্র্যাকিং (Order Tracking)
                </button>
              </li>
              <li>
                <a 
                  href="tel:01883418309"
                  className="hover:text-white transition-colors block"
                >
                  যোগাযোগ (Contact)
                </a>
              </li>
              {onOpenSellerCenter && (
                <li>
                  <button 
                    onClick={onOpenSellerCenter}
                    className="hover:text-cyan-400 text-cyan-500 font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>সেলার পোর্টাল (Seller Center)</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Service (গ্রাহক সেবা) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>গ্রাহক সেবা</span>
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  প্রাইভেসি পলিসি (Privacy Policy)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  টার্মস ও কন্ডিশন (Terms)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="hover:text-white transition-colors cursor-pointer text-left text-gray-300 font-medium"
                >
                  রিটার্ন ও রিফান্ড পলিসি
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenFaq}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  হেল্প সেন্টার (FAQs)
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenAuth}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  আমার অ্যাকাউন্ট ও ওয়ালেট
                </button>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>নিরাপদ পেমেন্ট পার্টনার</span>
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                ইনস্ট্যান্ট কনফার্মেশনের সাথে ১০০% সুরক্ষিত পেমেন্ট:
              </p>

              {/* Bangladesh Payment Badges */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-md border border-gray-700 bg-white text-[10px] font-bold text-[#E2136E]">
                  bKash
                </div>
                <div className="p-1.5 rounded-md border border-gray-700 bg-white text-[10px] font-bold text-[#F7941D]">
                  Nagad
                </div>
                <div className="p-1.5 rounded-md border border-gray-700 bg-white text-[10px] font-bold text-[#8C1E70]">
                  Rocket
                </div>
                <div className="p-1.5 rounded-md border border-gray-700 bg-white text-[10px] font-bold text-[#1A1F71]">
                  VISA
                </div>
                <div className="p-1.5 rounded-md border border-gray-700 bg-white text-[10px] font-bold text-[#EB001B]">
                  Mastercard
                </div>
                <div className="p-1.5 rounded-md border border-blue-500 bg-blue-500/20 text-[10px] font-bold text-cyan-400">
                  Cash on Del.
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-medium text-gray-400 block mb-1">
                  কুরিয়ার ও ডেলিভারি পার্টনার:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-300 font-mono">
                  <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded">Pathao Courier</span>
                  <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded">Steadfast</span>
                  <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded">Paperfly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. FOOTER SOCIALS & LOCKUP ================= */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="focus:outline-none cursor-pointer">
              <VaultLogo size="sm" variant="dark" showDivider={true} />
            </button>
          </div>

          {/* Social Media Channels */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 mr-1 hidden sm:inline">যুক্ত থাকুন:</span>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#007BFF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#7A3BFF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#00C6FF] text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
              aria-label="TikTok"
            >
              <span className="font-bold text-xs">♪</span>
            </a>
          </div>
        </div>

        {/* ================= 4. BOTTOM COPYRIGHT & EXPORT ================= */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-gray-300">ZeropicBD (জিরোপিক বিডি)</strong>। সর্বস্বত্ব সংরক্ষিত। Registered Trademark in Bangladesh.
          </p>

          <div className="flex items-center gap-4 text-xs">
            {onDownloadHtml && (
              <button
                onClick={onDownloadHtml}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Export HTML</span>
              </button>
            )}
            {onDownloadHtml && onOpenAdmin && <span className="text-gray-700">•</span>}
            {onOpenAdmin && (
              <button
                id="footer-admin-link"
                onClick={onOpenAdmin}
                className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
