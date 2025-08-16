import { useEffect } from 'react';

interface TawkToProps {
  propertyId: string;
  widgetId: string;
}

export default function TawkTo({ propertyId, widgetId }: TawkToProps) {
  useEffect(() => {
    // Validate inputs
    if (!propertyId || !widgetId || propertyId === 'YOUR_PROPERTY_ID') {
      console.warn('TawkTo: Invalid propertyId or widgetId provided');
      return;
    }

    // Check if Tawk_API already exists to avoid duplicate loading
    if (typeof window !== 'undefined' && !(window as any).Tawk_API) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      
      // Add error handling
      script.onerror = () => {
        console.error('TawkTo: Failed to load Tawk.to script');
      };
      
      // Add script to head
      document.head.appendChild(script);
      
      // Initialize Tawk_API
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();
      
      // Cleanup function
      return () => {
        // Remove script when component unmounts
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [propertyId, widgetId]);

  useEffect(() => {
    // Adjust Tawk.to widget position on mobile to avoid floating action button
    const adjustTawkPosition = () => {
      // Look for various Tawk.to widget selectors
      const tawkWidget = document.querySelector('#tawkchat-container, .tawk-min-container, [id*="tawk"]') as HTMLElement;
      if (tawkWidget) {
        // On mobile screens, move Tawk.to widget up to avoid collision with FAB
        if (window.innerWidth < 768) {
          tawkWidget.style.bottom = '80px !important'; // Move above the FAB (which is at bottom-6 = 24px)
          tawkWidget.style.right = '20px !important';
          tawkWidget.style.zIndex = '45'; // Below FAB (z-50) but above other content
        } else {
          tawkWidget.style.bottom = '20px !important';
          tawkWidget.style.right = '20px !important';
          tawkWidget.style.zIndex = '1000';
        }
      }
    };

    // Use Tawk_API onLoad callback if available
    if (typeof window !== 'undefined') {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.onLoad = function() {
        adjustTawkPosition();
      };
    }

    // Check for Tawk widget periodically until it's loaded
    const checkForWidget = setInterval(() => {
      const tawkWidget = document.querySelector('#tawkchat-container, .tawk-min-container, [id*="tawk"]') as HTMLElement;
      if (tawkWidget) {
        adjustTawkPosition();
        clearInterval(checkForWidget);
      }
    }, 1000);

    // Listen for window resize
    window.addEventListener('resize', adjustTawkPosition);

    // Cleanup
    return () => {
      clearInterval(checkForWidget);
      window.removeEventListener('resize', adjustTawkPosition);
    };
  }, []);

  return null; // This component doesn't render anything visible
}

// Hook for easy integration
export function useTawkTo(propertyId: string, widgetId: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Tawk_API) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      
      document.head.appendChild(script);
      
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();
    }
  }, [propertyId, widgetId]);
}