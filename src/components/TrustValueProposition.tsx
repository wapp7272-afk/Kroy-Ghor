import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Banknote, 
  Headphones, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface TrustValuePropositionProps {
  onLearnMore?: () => void;
}

export const TrustValueProposition: React.FC<TrustValuePropositionProps> = React.memo(() => {
  const features = [
    {
      id: 'feature-auth',
      icon: ShieldCheck,
      title: '100% Authentic Guarantee',
      description: 'Zero counterfeit tolerance. Verified original batch codes direct from brand authorized importers.',
      highlight: '100% Genuine',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'feature-cod',
      icon: Banknote,
      title: 'Cash on Delivery Nationwide',
      description: 'Check your package at your doorstep before payment across Dhaka and all 64 districts.',
      highlight: 'Check Before Pay',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'feature-delivery',
      icon: Truck,
      title: 'Express Courier Delivery',
      description: 'Super-fast 24-48 hour fulfillment with real-time Steadfast, Pathao & RedX tracking updates.',
      highlight: 'Fast 24-48h',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'feature-returns',
      icon: RotateCcw,
      title: '7-Day Easy Returns',
      description: 'Hassle-free replacement guarantee or instant wallet/bKash refund if you are not 100% satisfied.',
      highlight: 'Hassle-Free',
      badgeColor: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <section className="py-10 bg-[#F9FAFB] border-y border-slate-200" id="trust-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-[#4F46E5] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Customers Trust Kroyghor</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            The Safe, Premium Bangladeshi Marketplace
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Enjoy seamless shopping with customer protection, authenticated inventories, and door-to-door fulfillment.
          </p>
        </div>

        {/* 4-Column Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                id={`trust-card-${idx}`}
                className="group relative p-4 sm:p-5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  {/* Top Icon and Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-md bg-indigo-50 text-[#4F46E5] flex items-center justify-center border border-indigo-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${feature.badgeColor}`}>
                      {feature.highlight}
                    </span>
                  </div>

                  {/* Feature Title */}
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5 leading-snug group-hover:text-[#4F46E5] transition-colors">
                    {feature.title}
                  </h3>

                  {/* Feature Description */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Trust Assurance Tick */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Verified Kroyghor Guarantee</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
