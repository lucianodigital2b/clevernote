import React, { useState } from "react";
import { Upload, Zap, BookOpen, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: t('how_upload_your_content'),
      description: t('how_upload_description'),
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 2,
      title: t('how_choose_what_to_create'),
      description: t('how_choose_description'),
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 3,
      title: t('how_study_smarter'),
      description: t('how_study_description'),
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
            {t('how_it_works')}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            {t('how_main_title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('how_main_subtitle')}
          </p>
        </div>

        {/* Desktop Layout - All steps visible */}
        <div className="hidden lg:block max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Step number and icon */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full ${step.bgColor} flex items-center justify-center transition-all duration-300 hover:scale-110`}>
                        {React.createElement(step.icon, {
                          className: `w-8 h-8 ${step.iconColor}`
                        })}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {step.id}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Background gradient */}
                  <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${step.color} rounded-2xl`} />
                </div>
                
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout - Carousel */}
        <div className="lg:hidden max-w-4xl mx-auto">
          {/* Progress indicators */}
          <div className="flex justify-center mb-12">
            <div className="flex space-x-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === index 
                      ? 'bg-indigo-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon and step number */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full ${steps[currentStep].bgColor} flex items-center justify-center mb-4 transition-all duration-500 transform hover:scale-110`}>
                      {React.createElement(steps[currentStep].icon, {
                        className: `w-10 h-10 ${steps[currentStep].iconColor}`
                      })}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {steps[currentStep].id}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 transition-all duration-500">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed transition-all duration-500">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Animated background gradient */}
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${steps[currentStep].color} transition-all duration-1000`} />
          </div>

          {/* Step navigation */}
          <div className="flex justify-center mt-8 space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
                  currentStep === index
                    ? 'bg-white shadow-md border-2 border-indigo-200'
                    : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${step.bgColor} flex items-center justify-center`}>
                  {React.createElement(step.icon, {
                    className: `w-4 h-4 ${step.iconColor}`
                  })}
                </div>
                <span className={`text-sm font-medium ${
                  currentStep === index ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;