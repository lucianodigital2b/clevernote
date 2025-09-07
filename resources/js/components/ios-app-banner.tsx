import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const IosAppBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if banner was previously closed
    const bannerClosed = sessionStorage.getItem('ios-app-banner-closed');
    if (!bannerClosed) {
      setIsVisible(true);
    }
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('ios-app-banner-closed', 'true');
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-lg rounded-lg" style={{ width: '200px' }}>
      <div className="p-3 relative">
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
        
        <div className="flex flex-col items-center space-y-2 pt-2">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border">
              <img src="/qrcode.png" alt="iOS App QR Code" className="w-20 h-20" />
            </div>
            <div className="text-xs text-center mt-1 font-medium">
              {t('scan_on_iphone')}
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 text-xs mb-1">
              {t('ios_app_title')}
            </h3>
            <p className="text-xs text-gray-600">
              {t('ios_app_description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IosAppBanner;