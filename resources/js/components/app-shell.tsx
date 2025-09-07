import { SidebarProvider } from '@/components/ui/sidebar';
import { useState } from 'react';
import IosAppBanner from '@/components/ios-app-banner';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                <IosAppBanner />
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            <IosAppBanner />
            {children}
        </SidebarProvider>
    );
}
