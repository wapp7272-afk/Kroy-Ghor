import React, { useState, useMemo } from 'react';
import {
  X,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Truck,
  RotateCcw,
  Gift,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReturnPolicy?: () => void;
}

interface FaqItem {
  id: string;
  category: 'payment' | 'delivery' | 'tracking' | 'wallet' | 'returns';
  categoryLabel: string;
  question: string;
  answer: string;
  badge?: string;
}

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  onClose,
  onOpenReturnPolicy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const faqItems: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'payment',
      categoryLabel: 'Payment & TrxID',
      question: 'বিকাশ (bKash) ও নগদ (Nagad) এর মাধ্যমে কীভাবে পেমেন্ট করব এবং TrxID বসাব?',
      answer: '১. চেকআউট পেজে bKash অথবা Nagad নির্বাচন করুন।\n২. আমাদের অফিশিয়াল মার্চেন্ট নম্বর **01883418309** এ আপনার বিকাশ/নগদ অ্যাপ থেকে "Send Money" করুন।\n৩. লেনদেন সফল হলে প্রাপ্ত ৮-১০ অক্ষরের ট্রানজেকশন আইডি (TrxID) চেকআউটের বক্সে লিখে "অর্ডার নিশ্চিত করুন" চাপুন।\n৪. আমাদের সিস্টেম সাথে সাথে TrxID ভেরিফাই করে আপনার অর্ডার প্রসেসিং শুরু করবে। আপনি ক্যাশ অন ডেলিভারিতেও (COD) কোনো অগ্রিম টাকা ছাড়াই অর্ডার করতে পারেন।',
      badge: 'জনপ্রিয়'
    },
    {
      id: 'faq-2',
      category: 'delivery',
      categoryLabel: 'Delivery & Shipping',
      question: 'ডেলিভারি চার্জ কত এবং সারা বাংলাদেশে পৌঁছাতে কতদিন সময় লাগে?',
      answer: '• **ঢাকার ভিতরে:** হোম ডেলিভারি চার্জ মাত্র ৳৬০, সময় ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সরাসরি ঠিকানায় পৌঁছানো হয়। (৳২,০০০ এর বেশি শপিং করলে ঢাকা সিটিতে ডেলিভারি একদম ফ্রি!)\n• **ঢাকার বাইরে (সারা বাংলাদেশ):** চার্জ ৳১২০, সময় ২ থেকে ৪ কর্মদিবস। বাংলাদেশের ৬৪টি জেলার যে কোনো থানা বা উপজেলায় কুরিয়ার পার্টনারদের মাধ্যমে হোম ডেলিভারি দেওয়া হয়।',
      badge: '৬৪ জেলা'
    },
    {
      id: 'faq-3',
      category: 'tracking',
      categoryLabel: 'Courier Tracking',
      question: 'অর্ডার করার পর লাইভ কুরিয়ার ট্র্যাকিং কীভাবে দেখব?',
      answer: 'অর্ডার প্লেস করার পর আপনি একটি ইউনিক অর্ডার আইডি (যেমন: #PVZ-BD-89241) পাবেন। আপনার একাউন্টের "My Orders" পেজে প্রতিটি অর্ডারের পাশে লাইভ ৪-ধাপের স্ট্যাটাস বার দেখতে পাবেন:\n১. Confirmed -> ২. Packed -> ৩. On the Way -> ৪. Delivered।\nপাশাপাশি Pathao / Steadfast এর অফিসিয়াল ট্র্যাকিং আইডি ও কুরিয়ার নাম প্রদান করা হয়, যার মাধ্যমে পার্সেলের অবস্থান লাইভ ট্র্যাক করা সম্ভব।',
      badge: 'লাইভ ট্র্যাকিং'
    },
    {
      id: 'faq-4',
      category: 'wallet',
      categoryLabel: 'Wallet & Bonus',
      question: '৳২০ ওয়েলকাম ওয়ালেট বোনাস কীভাবে পাব এবং কীভাবে ব্যবহার করব?',
      answer: '• **বোনাস পাওয়ার নিয়ম:** গুগল ওয়ান-ট্যাপ সাইনইন অথবা ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর (01XXXXXXXXX) দিয়ে ওটিপি ভেরিফাই করলেই আপনার ওয়ালেটে সাথে সাথে ৳২০ ওয়েলকাম বোনাস যুক্ত হবে।\n• **ব্যবহারের নিয়ম:** যেকোনো পণ্য কার্টে যোগ করার পর কার্ট ড্রয়ার বা চেকআউট পেজে "Apply ৳20 Wallet Bonus" বক্সে টিক চিহ্ন দিলে আপনার মোট বিল থেকে সরাসরি ৳২০ মাইনাস হয়ে যাবে।',
      badge: '৳২০ ফ্রি বোনাস'
    },
    {
      id: 'faq-5',
      category: 'returns',
      categoryLabel: 'Returns & Refunds',
      question: 'পণ্য পছন্দ না হলে বা ডিফেক্ট থাকলে রিটার্ন ও রিফান্ডের নিয়ম কী?',
      answer: 'আমরা গ্রাহকদের শতভাগ সুরক্ষার জন্য ৭ দিনের সহজ রিপ্লেসমেন্ট ও রিটার্ন পলিসি প্রদান করি। পণ্য গ্রহণের ৭ দিনের মধ্যে আপনার একাউন্টের অর্ডার হিস্টোরি থেকে "7-Day Return / Replacement Request" বাটনে ক্লিক করে কারণ নির্বাচন করুন ও ছবি আপলোড করুন। আমাদের প্রতিনিধি আপনার বাসা থেকে পণ্য ফ্রি পিকআপ করবে এবং আপনার ওয়ালেটে ইনস্ট্যান্ট রিফান্ড বা নতুন পণ্য পাঠিয়ে দেওয়া হবে।',
      badge: '৭ দিন গ্যারান্টি'
    },
    {
      id: 'faq-6',
      category: 'payment',
      categoryLabel: 'Payment & TrxID',
      question: 'ক্যাশ অন ডেলিভারিতে কি পণ্য চেক করে নেওয়া যায়?',
      answer: 'হ্যাঁ, অবশ্যই! ডেলিভারি রাইডারের উপস্থিতিতে আপনি পার্সেলের প্যাকেজিং ও ভেতরের পণ্য পরীক্ষা করে দেখে সম্পূর্ণ মূল্য পরিশোধ করতে পারবেন। কোনো অমিল দেখলে সাথে সাথে রাইডারকে ফেরত দিয়ে আমাদের হেল্পলাইনে অবগত করতে পারবেন।',
    },
    {
      id: 'faq-7',
      category: 'wallet',
      categoryLabel: 'Wallet & Bonus',
      question: 'কুপন কোড এবং ওয়ালেট বোনাস কি একসাথে ব্যবহার করা যাবে?',
      answer: 'হ্যাঁ! আপনি একই অর্ডারে আপনার পছন্দের প্রোমো কুপন (যেমন: VAULT10 বা PRIME20) প্রয়োগ করে ছাড় নেওয়ার পাশাপাশি আপনার ওয়ালেট থেকে ৳২০ বোনাস ক্যাশ কর্তন করে ডাবল সেভিংস উপভোগ করতে পারবেন।',
    },
    {
      id: 'faq-8',
      category: 'delivery',
      categoryLabel: 'Delivery & Shipping',
      question: 'জরুরি প্রয়োজনে ১ দিনে এক্সপ্রেস ডেলিভারি পাওয়া সম্ভব কি?',
      answer: 'ঢাকা মেট্রোপলিটন এলাকার মধ্যে বিশেষ জরুরি অর্ডারের ক্ষেত্রে আমাদের হেল্পলাইনে (01883-418309) সকাল ১২টার আগে যোগাযোগ করলে সেম-ডে অথবা ২৪ ঘণ্টার সুপার এক্সপ্রেস ডেলিভারি সুবিধা পাওয়া যায়।',
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'payment', label: 'Payment & TrxID' },
    { id: 'delivery', label: 'Delivery & Timelines' },
    { id: 'tracking', label: 'Order Tracking' },
    { id: 'wallet', label: 'Wallet Bonus' },
    { id: 'returns', label: 'Returns & Refunds' },
  ];

  const filteredFaqs = useMemo(() => {
    return faqItems.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [faqItems, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-slideUp text-[#171717]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>হেল্প সেন্টার ও সাধারণ প্রশ্নোত্তর (FAQ)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">
                  Help Center
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 font-medium">
                পেমেন্ট, ডেলিভারি, ওয়ালেট বোনাস ও কুরিয়ার ট্র্যাকিং সংক্রান্ত সকল তথ্যাবলী
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close FAQ Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Pills */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="যেকোনো বিষয় লিখে সার্চ করুন (যেমন: বিকাশ, ডেলিভারি, ওয়ালেট বোনাস, রিটার্ন)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">কোনো প্রশ্নোত্তর খুঁজে পাওয়া যায়নি।</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-bold text-[#4F46E5] hover:underline"
              >
                রিসেট ফিল্টার
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-[#4F46E5] bg-indigo-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                          {faq.categoryLabel}
                        </span>
                        {faq.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {faq.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {faq.question}
                      </h4>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#4F46E5]" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line">
                      {faq.answer}

                      {faq.category === 'returns' && onOpenReturnPolicy && (
                        <div className="pt-3 mt-2 border-t border-indigo-100">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenReturnPolicy();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                          >
                            <span>৭ দিনের পূর্ণাঙ্গ রিটার্ন ও রিফান্ড পলিসি পড়ুন</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Support Quick Callout */}
        <div className="px-5 py-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <PhoneCall className="w-4 h-4 text-[#4F46E5]" />
            <span>সরাসরি প্রতিনিধির সহায়তা পেতে কল করুন: <strong className="text-slate-900">01883-418309</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/8801883418309?text=Hello%2C%20I%20need%20help%20with%20Prime%20Vault%20Zone"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp চ্যাট</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
