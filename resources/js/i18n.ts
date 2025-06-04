import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Custom IP-based geolocation detector
const ipGeolocationDetector = {
  name: 'ipGeolocation',

  lookup(options: any) {
    // Check if we already have a cached result from this session
    const cachedResult = sessionStorage.getItem('ipGeoLanguage');
    if (cachedResult) {
      return cachedResult;
    }

    // Make async call to IP geolocation service
    this.detectLanguageFromIP();
    return null; // Return null for now, will be set asynchronously
  },

  async detectLanguageFromIP() {
    try {
      // Check if user has manually selected a language (stored in localStorage)
      const userSelectedLanguage = localStorage.getItem('i18nextLng');
      if (userSelectedLanguage && ['en', 'es', 'pt'].includes(userSelectedLanguage)) {
        // User has manually selected a language, don't override it
        return;
      }

      // Using ipapi.co (free service, no API key required)
      const response = await fetch('https://ipapi.co/json/');
       const data = await response.json();
       
       if (data.country_code) {
        // Map country codes to supported languages
        const countryToLanguage: { [key: string]: string } = {
          'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
          'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es',
          'CL': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es', 'BO': 'es', 'DO': 'es',
          'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'PA': 'es',
          'UY': 'es', 'GQ': 'es',
          'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt', 'GW': 'pt', 'CV': 'pt',
          'ST': 'pt', 'TL': 'pt', 'MO': 'pt'
        };
        
        const detectedLanguage = countryToLanguage[data.country_code] || 'en';
        
        // Cache the result for this session
        sessionStorage.setItem('ipGeoLanguage', detectedLanguage);
        
        // Only change language if no language is currently set or if it's the fallback
        if (!i18n.language || i18n.language === 'en') {
          i18n.changeLanguage(detectedLanguage);
        }
      }
    } catch (error) {
      console.warn('IP geolocation detection failed:', error);
      // Fallback to default detection methods
    }
  },

  cacheUserLanguage(lng: string, options: any) {
    // Cache the language preference
    sessionStorage.setItem('ipGeoLanguage', lng);
  }
};

// Create language detector instance and add custom detector
const languageDetector = new LanguageDetector();
languageDetector.addDetector(ipGeolocationDetector);

i18n
  .use(Backend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    supportedLngs: ['en', 'es', 'pt'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      queryStringParams: { v: new Date().getTime() }
    },

    detection: {
      // Prioritize user selection (localStorage/cookie) over IP detection
      order: ['localStorage', 'cookie', 'ipGeolocation', 'navigator'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;