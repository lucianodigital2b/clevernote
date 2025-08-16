# Tawk.to Integration Setup

This project includes Tawk.to live chat integration with mobile-responsive positioning.

## Setup Instructions

### 1. Get Your Tawk.to Credentials

1. Sign up or log in to [Tawk.to](https://www.tawk.to/)
2. Go to **Administration** > **Chat Widget**
3. Copy your **Property ID** and **Widget ID** from the embed code

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Tawk.to Configuration
VITE_TAWKTO_PROPERTY_ID=your_property_id_here
VITE_TAWKTO_WIDGET_ID=your_widget_id_here
VITE_TAWKTO_ENABLED=true
```

### 3. Alternative Configuration

If you prefer not to use environment variables, you can directly edit the configuration file:

**File:** `resources/js/config/tawkto.ts`

```typescript
export const TAWKTO_CONFIG = {
  propertyId: 'your_actual_property_id',
  widgetId: 'your_actual_widget_id', // often 'default'
  enabled: true,
};
```

## Features

### Mobile Responsive
- On mobile devices (< 768px width), the Tawk.to widget is positioned above the floating action button
- On desktop, it uses the default bottom-right position
- Automatically adjusts on window resize

### Smart Loading
- Only loads when properly configured
- Prevents duplicate script loading
- Uses Tawk.to's official embed method

### Z-Index Management
- Mobile: `z-index: 45` (below floating action button at z-50)
- Desktop: `z-index: 1000` (standard high priority)

## Usage

The Tawk.to widget is automatically included in the Dashboard component. To add it to other pages:

```tsx
import TawkTo from '@/components/TawkTo';
import { TAWKTO_CONFIG, isTawkToConfigured } from '@/config/tawkto';

// In your component JSX:
{isTawkToConfigured() && (
    <TawkTo 
        propertyId={TAWKTO_CONFIG.propertyId} 
        widgetId={TAWKTO_CONFIG.widgetId} 
    />
)}
```

## Customization

### Positioning
To adjust the mobile positioning, edit the `adjustTawkPosition` function in `resources/js/components/TawkTo.tsx`:

```typescript
if (window.innerWidth < 768) {
  tawkWidget.style.bottom = '80px !important'; // Adjust this value
  tawkWidget.style.right = '20px !important';
}
```

### Disable Tawk.to
Set `VITE_TAWKTO_ENABLED=false` in your `.env` file or set `enabled: false` in the config file.

## Troubleshooting

### Widget Not Appearing
1. Check that your Property ID and Widget ID are correct
2. Verify that `VITE_TAWKTO_ENABLED=true`
3. Check browser console for any JavaScript errors
4. Ensure your Tawk.to widget is set to "Online" in the dashboard

### Mobile Positioning Issues
1. The widget positioning is applied after the Tawk.to script loads
2. If issues persist, try increasing the interval time in the `checkForWidget` function
3. Check that the floating action button has the correct z-index (z-50)

### Environment Variables Not Working
Make sure your build tool (Vite) is configured to include `VITE_` prefixed environment variables.