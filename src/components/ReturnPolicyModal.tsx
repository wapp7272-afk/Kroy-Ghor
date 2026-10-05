import React from 'react';
import {
  X,
  RotateCcw,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Package,
  Calendar,
  Wallet,
  Clock,
  ExternalLink
} from 'lucide-react';

export interface ReturnPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrders?: () => void;
}

export const ReturnPolicyModal: React.FC<ReturnPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenOrders,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-slideUp text-[#171717]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ৭ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট পলিসি
                </h3>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium">
                Kroy Ghor 7-Day Hassle-Free Replacement & Refund Guarantee
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Return Policy"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Guarantee Highlight Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#4F46E5] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">
                  ১০০% রিস্ক-ফ্রি কাস্টমার স্যাটিসফ্যাকশন প্রমিজ
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  পণ্য হাতে পাওয়ার পর যদি প্যাকেজিং ক্ষতিগ্রস্ত থাকে, ভুল ভ্যারিয়েন্ট আসে, অথবা কোনো ডিফেক্ট পাওয়া যায়, তবে ডেলিভারির তারিখ থেকে <strong>৭ দিনের মধ্যে</strong> সরাসরি আমাদের অ্যাপ থেকে ফ্রি রিটার্ন বা ফুল রিফান্ডের আবেদন করতে পারবেন।
                </p>
              </div>
            </div>
          </div>

          {/* 3-Step Simple Return Process */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>রিটার্ন ও রিফান্ড প্রক্রিয়া (Step-by-Step Flow)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-[#4F46E5] font-black text-xs flex items-center justify-center">
                  ১
                </div>
                <h5 className="text-xs font-bold text-slate-900">অনলাইনে রিকোয়েস্ট করুন</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  আপনার একাউন্টের <strong>My Orders</strong> অপশনে যান এবং সংশ্লিষ্ট অর্ডারে <strong>"7-Day Return / Replacement"</strong> বাটনে ক্লিক করে কারণ ও ছবি সাবমিট করুন।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-[#4F46E5] font-black text-xs flex items-center justify-center">
                  ২
                </div>
                <h5 className="text-xs font-bold text-slate-900">ফ্রি ডোরস্টেপ পিকআপ</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  রিকোয়েস্ট অনুমোদিত হলে আমাদের নির্ভরযোগ্য কুরিয়ার পার্টনার (Pathao / Steadfast) আপনার বাসা থেকেই প্রোডাক্টটি পিকআপ করে নিয়ে আসবে।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-[#4F46E5] font-black text-xs flex items-center justify-center">
                  ৩
                </div>
                <h5 className="text-xs font-bold text-slate-900">ইনস্ট্যান্ট রিফান্ড / রিপ্লেসমেন্ট</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  আপনার চয়েস অনুযায়ী সম্পূর্ণ টাকা সরাসরি আপনার <strong>প্রাইম ভল্ট ওয়ালেটে</strong> অথবা বিকাশ/নগদে রিফান্ড পেয়ে যাবেন কিংবা নতুন ইনট্যাক্ট প্রোডাক্ট পাঠানো হবে।
                </p>
              </div>
            </div>
          </div>

          {/* Eligibility Conditions Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              রিটার্নের শর্তাবলী (Eligibility Conditions)
            </h4>

            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
              <div className="p-3 bg-slate-50/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">ডেলিভারি ড্যামেজ বা ভাঙা প্যাকেজ:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    কুরিয়ার থেকে রিসিভ করার সময় বা খোলার সাথে সাথে ডিফেক্ট পেলে তাৎক্ষণিক ছবি সহ সাবমিট করলে ১০০% ফ্রি রিপ্লেসমেন্ট প্রযোজ্য।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">ভুল সাইজ বা অমিল পণ্য:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    অর্ডার করা পণ্যের তুলনায় ভুল পণ্য বা সাইজ পৌঁছালে অরিজিনাল বক্স ও এক্সেসরিজ সহ রিটার্ন গৃহীত হবে।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">পারফিউম ও স্কিনকেয়ার পণ্যের সতর্কতা:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    হাইজিন ও খাঁটি মানের নিশ্চয়তার স্বার্থে সিলযুক্ত পারফিউম ও কসমেটিক্সের অরিজিনাল ব্যাচ-কোড ও সিল অক্ষত থাকা সাপেক্ষে ভেরিফিকেশন প্রযোজ্য।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">ইলেকট্রনিক্স ও গ্যাজেটস:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    টেকনিক্যাল ত্রুটির ক্ষেত্রে ক্যাবল, চার্জার এবং ওয়্যারেন্টি কার্ড সহ ৭ দিনের মধ্যে ফুল এক্সচেঞ্জ পাওয়া যাবে।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Timelines */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Wallet className="w-4 h-4 text-amber-700" />
              <span>রিফান্ডের সময়সীমা ও মেথড:</span>
            </div>
            <ul className="text-slate-600 text-[11px] space-y-1 pl-6 list-disc">
              <li><strong>প্রাইম ভল্ট ওয়ালেট ক্রেডিট:</strong> অনুমোদনের ১ ঘণ্টার মধ্যে (পরবর্তী যে কোনো কেনাকাটায় ইনস্ট্যান্ট ব্যবহারযোগ্য)।</li>
              <li><strong>বিকাশ / নগদ মোবাইল রিফান্ড:</strong> ২৪ থেকে ৪৮ ঘণ্টার মধ্যে অরিজিনাল নম্বরে ক্যাশব্যাক।</li>
              <li><strong>ক্যাশ অন ডেলিভারি (COD) রিফান্ড:</strong> কুরিয়ার রিটার্ন যাচাই শেষে বিকাশ/নগদে ট্রান্সফার করা হয়।</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            প্রশ্ন বা সহায়তার জন্য আমাদের হেল্পলাইন: <strong className="text-slate-900">01883-418309</strong>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenOrders && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrders();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Package className="w-4 h-4" />
                <span>অর্ডার হিস্টোরি ও রিটার্ন রিকোয়েস্ট</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
