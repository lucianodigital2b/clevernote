
import React from "react";
import { Check, X, Star, ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

interface PricingProps {
  pricingPlans: any[];
}

const Pricing = ({ pricingPlans }: PricingProps) => {
  const { t } = useTranslation();

  // Choose the highlighted plan: prefer `popular`, fallback to the first
  const plan = pricingPlans?.find((p) => p.popular) ?? pricingPlans?.[0] ?? {
    name: "pro",
    monthlyPrice: "$199",
    features: [],
  };

  // Pull included features only for the "What's included" list
  const includedFeatures = (plan?.features || []).filter((f: any) => f.included);
  const excludedFeatures = (plan?.features || []).filter((f: any) => !f.included);

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Headline + Subtext + Testimonial */}
          <div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 tracking-tight leading-tight">
              {t('learning_journey')}
            </h2>
            <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-xl">
              {t('features_description')}
            </p>

            {/* Testimonial Card (replaces twitter posts) */}
            <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
              <div className="flex -space-x-2">
                <img src="/avatars/300-1.jpg" alt="user1" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
                <img src="/avatars/300-5.jpg" alt="user2" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
                <img src="/avatars/300-12.jpg" alt="user3" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{t('cta_description')}</span>
              </div>
            </div>
          </div>

          {/* Right: Pricing Card */}
          <div>
            <div className="rounded-3xl border-2 border-brand-200 shadow-lg overflow-hidden border-purple-200">
              <div className="p-6 md:p-8 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">{t('upgrade_to_clevernote_pro')}</span>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">{t('unlock_full_potential')}</span>
                </div>

                {/* Price row */}
                <div className="mt-5 flex items-baseline gap-3">
                  <div className="text-5xl font-extrabold text-gray-900">$1</div>
                  <div className="text-xl text-gray-400 line-through">{plan?.monthlyPrice}</div>
                  <div className="text-gray-500">3-day trial</div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                    <Button className="py-4 bg-purple-600 hover:bg-purple-600 text-purple-100 border-2 px-8 rounded-full font-medium transition-all duration-200 shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/60 h-full border-purple-600 w-full text-2xl" asChild>
                      <a 
                        onClick={() => router.visit(`/billing/checkout?plan=monthly&trial=1`)}
                      >
                        {t('start_free')}
                      </a>
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 text-center">
                    {t('cancel_anytime')}<br />
                    {t('trial_timeline_end_description')}
                  </p>
                </div>

                {/* What's included */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('everything_you_get')}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('unlimited_note_generations')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('unlimited_audio_calls')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('unlimited_podcasts_youtube')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('unlimited_quiz_flashcards')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('support_100_languages')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('best_transcription_summarization')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('customer_support_24_7')}</span>
                    </div>
                    <div className="flex items-start">
                      <CircleCheck className="mt-0.5 mr-3 h-5 w-5 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-700">{t('priority_access_features')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
