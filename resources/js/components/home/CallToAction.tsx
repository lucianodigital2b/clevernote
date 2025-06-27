
import React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const CallToAction = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-indigo-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-medium p-8 md:p-12 border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
              {t('cta_heading')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('cta_description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <Button className="py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 border-2 px-8 rounded-full font-medium transition-all duration-200 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/60 h-full border-indigo-600 dark:text-indigo-600 " asChild>
              <a href="/login" >
                {t('start_free')}
              </a>
            </Button>
          </div>

          <div className="flex justify-center gap-8 flex-wrap">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-indigo-500 mr-2" />
              {t('cancel_anytime')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
