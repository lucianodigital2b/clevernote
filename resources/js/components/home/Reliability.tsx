import React from "react";
import { useTranslation } from "react-i18next";

const Reliability = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-16">
            {t('reliability_heading_built_for')}{" "}
            <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg">
              {t('reliability_heading_academic_excellence')}
            </span>{" "}
            {t('reliability_heading_and_precision')}
          </h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* SAT Math Score Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                  800
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-3">
                  {t('reliability_sat_math_title')}
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {t('reliability_sat_math_description')}
                </div>
              </div>
            </div>

            {/* Error Rate Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div className="text-5xl md:text-6xl font-bold text-gray-900">
                    70%
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-3">
                  {t('reliability_accuracy_title')}
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {t('reliability_accuracy_description')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reliability;