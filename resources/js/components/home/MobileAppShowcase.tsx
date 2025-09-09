import React from 'react';
import { useTranslation } from 'react-i18next';

const MobileAppShowcase = () => {
  const { t } = useTranslation();
  
  // Array of app images
  const appImages = [
    '/app-images/image-1.png',
    '/app-images/image-2.png',
    '/app-images/image-3.png',
    '/app-images/image-4.png'
  ];

  return (
    <div className="py-16 md:py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              {t('mobile_app_showcase_title', 'Clevernote Mobile App')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('mobile_app_showcase_description', 'Experience Clevernote on the go with our powerful iOS app. Android version coming soon!')}
            </p>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Decorative elements */}
          {/* Phone frames with images side by side */}
          <div className="flex justify-center gap-4 md:gap-6 overflow-x-auto pb-4">
            {appImages.map((image, index) => (
              <div 
                key={index}
                className="relative w-[150px] md:w-[180px] h-[300px] md:h-[350px] overflow-hidden flex-shrink-0 rounded-xl shadow-md"
              >
                <img 
                  src={image} 
                  alt={`Clevernote app screenshot ${index + 1}`} 
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
          
          {/* Feature list */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '📝', title: t('feature_quick_notes', 'Quick Notes'), description: t('feature_quick_notes_desc', 'Capture ideas and notes on the go') },
              { icon: '🔍', title: t('feature_search', 'Smart Search'), description: t('feature_search_desc', 'Find your notes instantly') },
              { icon: '🔄', title: t('feature_sync', 'Cloud Sync'), description: t('feature_sync_desc', 'Access your notes from any device') }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md border border-purple-100"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg text-gray-900 font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          {/* App store badge */}
          <div className="mt-8 flex justify-center">
            <a 
              href="https://apps.apple.com/us/app/clevernote-ai-homework-helper/id6747533532" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img 
                src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                alt="Download on the App Store" 
                className="h-12"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppShowcase;