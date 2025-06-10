import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import Clarity from '@microsoft/clarity';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Create a client
const queryClient = new QueryClient();

Clarity.init('rxc01yuo0y');

// Fix for import.meta.glob issue
const pages = import.meta.glob('./pages/**/*.tsx', { eager: false });

// Then wrap your app with QueryClientProvider
createInertiaApp({
    title: (title) => `${title ? title + ' - ' : ''} ${appName}`,
    resolve: (name) => {
        const pagePath = `./pages/${name}.tsx`;
        if (pages[pagePath]) {
            return pages[pagePath]();
        }
        // Fallback for dynamic imports
        return import(`./pages/${name}.tsx`);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <QueryClientProvider client={queryClient}>
              <App {...props} />
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Set CSRF token for all axios requests
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';

axios.defaults.withXSRFToken = true;

// Initialize i18n after DOM is ready and stable
setTimeout(() => {
    import('./i18n').catch(error => {
        console.warn('Failed to load i18n:', error);
    });
}, 100);
