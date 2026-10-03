import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Wallet,
  Truck,
  Package,
  ExternalLink
} from 'lucide-react';
import { Order, ReturnRequest } from '../types';

export interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmit: (
    orderId: string,
    returnData: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>
  ) => void;
  onOpenReturnPolicy?: () => void;
}

const RETURN_REASONS = [
  { id: 'damaged', label: 'প্যাকেজ ড্যামেজ বা পণ্য ভাঙা অবস্থায় পেয়েছি (Damaged / Broken Item)' },
  { id: 'wrong_item', label: 'ভুল পণ্য বা সাইজ ডেলিভারি হয়েছে (Wrong Item / Variant Received)' },
  { id: 'defective', label: 'প্রোডাক্টে কারিগরি ত্রুটি বা ডিফেক্ট রয়েছে (Defective / Malfunctioning)' },
  { id: 'seal_broken', label: 'প্যাকেজের সিল খোলা বা ব্যাচ কোডে সমস্যা (Seal Broken / Batch Code Issue)' },
  { id: 'quality_mismatch', label: 'পণ্যের কোয়ালিটি প্রত্যাশা অনুযায়ী নয় (Quality Not Satisfactory)' },
  { id: 'other', label: 'অন্যান্য কারণ (Other Issue)' },
];

const SAMPLE_PHOTO_PROOFS = [
  {
    name: 'ড্যামেজ বক্স ছবি',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'ব্যাচ কোড প্রমাণ',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'ভুল ভ্যারিয়েন্ট ছবি',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=600'
  }
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  onOpenReturnPolicy,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(RETURN_REASONS[0].label);
  const [resolutionType, setResolutionType] = useState<'Wallet Credit' | 'Replacement' | 'Original Payment'>('Wallet Credit');
  const [details, setDetails] = useState('');
  const [photoProofUrl, setPhotoProofUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoProofUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMsg('অনুগ্রহ করে রিটার্নের কারণ নির্বাচন করুন');
      return;
    }
    if (!agreementChecked) {
      setErrorMsg('শর্তাবলীতে সম্মতি প্রদান করুন');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(order.id, {
        reason: selectedReason,
        additionalDetails: details.trim() || undefined,
        photoProofUrl: photoProofUrl || undefined,
        refundAmount: order.total,
        resolutionType,
        courierPickupDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-slideUp text-[#171717]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>৭ দিনের রিটার্ন ও রিপ্লেসমেন্ট রিকোয়েস্ট</span>
              </h3>
              <p className="text-xs text-indigo-200/80 font-mono">
                Order ID: {order.id} • Total: ৳{order.total.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Return Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Delivered Items Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              অর্ডারের আইটেমসমূহ (Delivered Items)
            </span>
            <div className="divide-y divide-slate-200/80">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{item.product.title}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity} {item.selectedSize ? `• ${item.selectedSize}` : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-mono shrink-0">
                    ৳{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Reason for Return */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              ১. রিটার্ন বা রিপ্লেসমেন্টের কারণ নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RETURN_REASONS.map((r) => {
                const isSelected = selectedReason === r.label;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedReason(r.label);
                      setErrorMsg(null);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-[#4F46E5] text-[#4F46E5] ring-1 ring-[#4F46E5]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="leading-snug">{r.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Preferred Resolution */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              ২. আপনার পছন্দের সমাধান (Preferred Resolution) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setResolutionType('Wallet Credit')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionType === 'Wallet Credit'
                    ? 'bg-indigo-50/80 border-[#4F46E5] ring-1 ring-[#4F46E5]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Wallet className="w-4 h-4 text-[#4F46E5]" />
                  <span>ওয়ালেট রিফান্ড</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">ইনস্ট্যান্ট ওয়ালেটে ৳{order.total.toLocaleString()} জমা হবে</p>
                <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  সবচেয়ে দ্রুত
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResolutionType('Replacement')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionType === 'Replacement'
                    ? 'bg-indigo-50/80 border-[#4F46E5] ring-1 ring-[#4F46E5]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>নতুন রিপ্লেসমেন্ট</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">ত্রুটিমুক্ত নতুন ইনট্যাক্ট পণ্য বাসা পাঠিয়ে দেওয়া হবে</p>
                <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-[#4F46E5]">
                  ফ্রি ডেলিভারি
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResolutionType('Original Payment')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  resolutionType === 'Original Payment'
                    ? 'bg-indigo-50/80 border-[#4F46E5] ring-1 ring-[#4F46E5]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>বিকাশ / নগদ ক্যাশব্যাক</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">২৪-৪৮ ঘণ্টার মধ্যে বিকাশ/নগদে ক্যাশব্যাক যাবে</p>
              </button>
            </div>
          </div>

          {/* Step 3: Photo Proof Upload (Real file upload + Quick simulated presets) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900">
                ৩. ছবি বা ভিডিও প্রমাণ আপলোড (Photo Proof Simulation)
              </label>
              <span className="text-[10px] text-slate-400">ঐচ্ছিক কিন্তু দ্রুত অনুমোদনে সহায়ক</span>
            </div>

            <div className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-colors">
              {photoProofUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoProofUrl}
                      alt="Uploaded proof"
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        প্রমাণ ছবি যুক্ত হয়েছে
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">আমাদের কোয়ালিটি ইন্সপেকশন টিম এটি যাচাই করবে</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhotoProofUrl('')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-xs text-slate-600">
                    আপনার ডিভাইস থেকে পণ্য বা প্যাকেজের ছবি নির্বাচন করুন
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>

                  {/* Simulated Preset Proof Samples */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[10px] text-slate-400">অথবা স্যাম্পল প্রমাণ নির্বাচন করুন:</span>
                    {SAMPLE_PHOTO_PROOFS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoProofUrl(sample.url)}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-[#4F46E5] cursor-pointer"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Additional Details Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900">
              ৪. বিস্তারিত সমস্যার বিবরণ (Additional Details)
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="পণ্যটিতে কী সমস্যা লক্ষ্য করেছেন সংক্ষেপে লিখুন (যেমন: বোতলের নজলে লিক হচ্ছে বা ভুল সেন্ট এসেছে)..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#4F46E5]"
            />
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="return-agreement"
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
            />
            <label htmlFor="return-agreement" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
              আমি স্বীকার করছি যে পণ্যটি ডেলিভারির <strong>৭ দিনের মধ্যে</strong> রয়েছে এবং অরিজিনাল এক্সেসরিজ/বক্স অক্ষত আছে।
              {onOpenReturnPolicy && (
                <button
                  type="button"
                  onClick={onOpenReturnPolicy}
                  className="inline-flex items-center gap-0.5 ml-1 text-[#4F46E5] font-bold hover:underline"
                >
                  <span>রিটার্ন পলিসি পড়ুন</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </label>
          </div>

          {/* Footer CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>১০০% ফ্রি ডোরস্টেপ পিকআপ গ্যারান্টি</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-300 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>রিকোয়েস্ট জমা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>রিটার্ন রিকোয়েস্ট জমা দিন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
