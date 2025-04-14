
import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for casual note-takers",
    features: [
      { included: true, text: "3 notes with AI" },
      { included: true, text: "Basic text formatting" },
      // { included: true, text: "Mobile & desktop access" },
      { included: false, text: "Spaced repetition" },
      // { included: false, text: "Advanced collaboration" },
      // { included: false, text: "Priority support" },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Student",
    price: "$9.99",
    description: "Ideal for individual students",
    features: [
      { included: true, text: "Unlimited rich notes" },
      { included: true, text: "Advanced formatting" },
      { included: true, text: "Unlimited AI summaries" },
      { included: true, text: "Spaced repetition" },
      { included: false, text: "Advanced collaboration" },
      { included: false, text: "Priority support" },
    ],
    cta: "Start Trial",
    popular: true,
  },
  // {
  //   name: "Premium",
  //   price: "$12",
  //   description: "For power users and professionals",
  //   features: [
  //     { included: true, text: "Unlimited rich notes" },
  //     { included: true, text: "Advanced formatting" },
  //     { included: true, text: "20GB file storage" },
  //     { included: true, text: "Unlimited AI summaries" },
  //     { included: true, text: "Advanced spaced repetition" },
  //     { included: true, text: "Collaborative workspaces" },
  //     { included: true, text: "Priority support" },
  //   ],
  //   cta: "Start Trial",
  //   popular: false,
  // },
];

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-brand-100 text-brand-700 mb-4">
            Simple Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            Choose the perfect plan for your needs
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you're a casual note-taker or a serious student, we have a plan that fits your needs.
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
                Monthly
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  billingCycle === "annual"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                Annual <span className="text-brand-600 font-semibold">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                  Most Popular
                </div>
              )}
              <div className="p-6 md:p-8 bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-2">
                    /{billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>

                <Button
                  className={`w-full mb-6 ${
                    plan.popular
                      ? "bg-brand-500 hover:bg-brand-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start"
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
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 text-gray-600 max-w-xl mx-auto">
          <p>
            All plans include a 3-day free trial.
            <br />
            Need a custom plan for your team or organization?{" "}
            <a href="#" className="text-brand-600 underline hover:text-brand-700">
              Contact us
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
