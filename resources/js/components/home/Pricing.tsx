
import React, { useState } from "react";
import { Check, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";

interface PricingProps {
  pricingPlans: any[];
}

const Pricing = ({ pricingPlans }: PricingProps) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const { t } = useTranslation();

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-700 mb-4">
            {t('pricing_simple')}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            {t('pricing_heading')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('pricing_subheading')}
          </p>

          <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-full inline-flex">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                {t('pricing_monthly')}
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  billingCycle === "annual"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                {t('pricing_annual')} <span className="text-brand-600 font-semibold">{t('pricing_save_20')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="col-start-2">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? "transform md:-translate-y-4 border-2 border-brand-500 shadow-lg"
                    : "border border-gray-200 shadow-card"
                }`}
              >
                {plan.popular && (
                  <div className="bg-brand-500 text-white text-center py-2 text-sm font-medium">
                    {t('pricing_most_popular')}
                  </div>
                )}
                <div className="p-6 md:p-8 bg-white">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t(plan.name)}</h3>
                  <p className="text-gray-600 mb-4">{t(plan.description)}</p>
                  <div className="flex items-baseline mb-6">
                    {billingCycle === "annual" ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.billedAnnually}</span>
                        <span className="text-gray-500 ml-2">{t('pricing_per_month')}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {t('pricing_billed_annually', { price: plan.annualPrice })}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.monthlyPrice}</span>
                        <span className="text-gray-500 ml-2">{t('pricing_per_month')}</span>
                      </>
                    )}
                  </div>

                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      router.visit(`/billing/checkout?plan=${billingCycle}`);
                    }}
                  >
                    {t(plan.cta)}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center"
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-sage-500 mt-0.5 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mt-0.5 mr-3 flex-shrink-0" />
                        )}
                        <span
                          className={
                            feature.included ? "text-gray-700" : "text-gray-400"
                          }
                        >
                          {t(feature.text)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10 text-gray-600 max-w-xl mx-auto">
          <p>
            {t('pricing_custom_plan')}{" "}
            <a href="#" className="text-brand-600 underline hover:text-brand-700">
              {t('pricing_contact_us')}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
