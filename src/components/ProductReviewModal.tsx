import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Camera, 
  Clock, 
  Heart,
  MessageSquare,
  Check
} from 'lucide-react';
import { Product, CustomerReview, UserProfile } from '../types';

export interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  user: UserProfile;
  onSubmitReview: (review: CustomerReview) => void;
}

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  user,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState<string>(user.name || '');
  const [location, setLocation] = useState<string>(
    user.address?.cityDivision === 'Inside Dhaka' ? 'Dhaka' : 'Chattogram'
  );
  const [comment, setComment] = useState<string>('');
  const [longevity, setLongevity] = useState<'4-6 Hours' | '6-8 Hours' | '8-12 Hours' | 'All Day (12h+)'>('8-12 Hours');
  const [authenticityTag, setAuthenticityTag] = useState<string>('100% Authentic Genuine');
  const [selectedPhotoPreset, setSelectedPhotoPreset] = useState<string | null>(product.image);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const starLabels = ['Terrible', 'Fair', 'Good', 'Very Good', 'Exceptional 5-Star'];

  const longevityOptions: Array<'4-6 Hours' | '6-8 Hours' | '8-12 Hours' | 'All Day (12h+)'> = [
    '4-6 Hours',
    '6-8 Hours',
    '8-12 Hours',
    'All Day (12h+)'
  ];

  const authenticityOptions = [
    '100% Authentic Genuine',
    'Compliment Magnet',
    'Beast Mode Performance',
    'Great Daily Signature',
    'Excellent Packaging & Box'
  ];

  const photoPresets = [
    { label: 'Unboxed Item', url: product.image },
    ...(product.images || []).map((img, i) => ({ label: `Angle #${i + 1}`, url: img }))
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    const newReview: CustomerReview = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      name: name.trim() || 'Verified Prime Customer',
      location: location.trim() || 'Dhaka, Bangladesh',
      rating,
      date: 'Just now',
      comment: comment.trim(),
      verified: true,
      likes: 1,
      longevityRating: longevity,
      authenticityRating: authenticityTag,
      photoUrl: selectedPhotoPreset || undefined,
    };

    setTimeout(() => {
      onSubmitReview(newReview);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-base font-extrabold text-slate-900">
                Write a Verified Buyer Review
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {product.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Star Rating Selection */}
          <div className="space-y-1.5 text-center sm:text-left">
            <label className="text-xs font-bold text-slate-700 block">
              Overall Experience Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-1 text-amber-400 hover:scale-115 active:scale-95 transition-transform cursor-pointer focus-visible:outline-none"
                  aria-label={`${s} star rating`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {starLabels[(hoverRating || rating) - 1]}
              </span>
            </div>
          </div>

          {/* 2. Scent Longevity / Quality Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Longevity & Performance:</span>
              </span>
              <span className="text-indigo-600 font-extrabold">{longevity}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {longevityOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLongevity(opt)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                    longevity === opt
                      ? 'bg-indigo-50 border-[#4F46E5] text-[#4F46E5] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Authenticity Badge Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Key Impression Highlight:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {authenticityOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setAuthenticityTag(tag)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    authenticityTag === tag
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvir Hossain"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your City / Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhanmondi, Dhaka"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none"
              />
            </div>
          </div>

          {/* 5. Detailed Review Text */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Review Details & Fragrance Experience *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like about this product? How does the drydown and projection feel? Is it genuine?"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* 6. Photo Proof Attachment Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Attach Unboxing Snapshot Proof (Simulated):</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Buyer Badge
              </span>
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {photoPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoPreset(preset.url)}
                  className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                    selectedPhotoPreset === preset.url
                      ? 'border-[#4F46E5] ring-2 ring-indigo-200 shadow-xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                  {selectedPhotoPreset === preset.url && (
                    <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedPhotoPreset(null)}
                className={`w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                  !selectedPhotoPreset
                    ? 'border-indigo-400 bg-indigo-50 text-[#4F46E5]'
                    : 'border-slate-300 text-slate-400 hover:border-slate-400'
                }`}
              >
                <span>No Photo</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Review</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
