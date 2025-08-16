// Tawk.to configuration
// Replace these with your actual Tawk.to Property ID and Widget ID
// You can find these in your Tawk.to dashboard under Administration > Chat Widget

export const TAWKTO_CONFIG = {
  // Example: propertyId: '5f8b1c2d3e4f5a6b7c8d9e0f'
  propertyId: process.env.VITE_TAWKTO_PROPERTY_ID || 'YOUR_PROPERTY_ID',
  
  // Example: widgetId: 'default' or '1a2b3c4d5e6f7g8h9i0j'
  widgetId: process.env.VITE_TAWKTO_WIDGET_ID || 'default',
  
  // Optional: Enable/disable Tawk.to
  enabled: process.env.VITE_TAWKTO_ENABLED !== 'false',
};

// Helper function to check if Tawk.to is properly configured
export const isTawkToConfigured = (): boolean => {
  return (
    TAWKTO_CONFIG.enabled &&
    TAWKTO_CONFIG.propertyId !== 'YOUR_PROPERTY_ID' &&
    TAWKTO_CONFIG.propertyId.length > 0 &&
    TAWKTO_CONFIG.widgetId.length > 0
  );
};