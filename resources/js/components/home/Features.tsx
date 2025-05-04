
import React from "react";
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Mic,
  Languages,
  Lightbulb,
  FileSearch,
  FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

  const featureItems = [
    {
      icon: <Mic className="w-5 h-5 text-indigo-600" />,
      title: t('voice_to_text_title'),
      description: t('voice_to_text_description'),
    },
    {
      icon: <Languages className="w-5 h-5 text-indigo-600" />,
      title: t('multilingual_support_title'),
      description: t('multilingual_support_description'),
    },
    {
      icon: <FileSearch className="w-5 h-5 text-indigo-600" />,
      title: t('smart_analysis_title'),
      description: t('smart_analysis_description'),
    },
    {
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      title: t('materials_generator_title'),
      description: t('materials_generator_description'),
    },
    {
      icon: <Search className="w-5 h-5 text-indigo-600" />,
      title: t('instant_search_title'),
      description: t('instant_search_description'),
    },
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
      title: t('ai_summaries_title'),
      description: t('ai_summaries_description'),
    },
    {
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      title: t('study_modes_title'),
      description: t('study_modes_description'),
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-indigo-600" />,
      title: t('knowledge_connections_title'),
      description: t('knowledge_connections_description'),
    },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 mb-4">
            {t('powerful_features')}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
            {t('features_heading')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('features_description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureItems.map((feature, index) => (
            <div 
              key={index} 
              className="card-feature hover-scale group"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-5 group-hover:bg-indigo-200 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
