import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { XPBar } from '@/components/xp-bar';
import { UpgradeModal } from '@/components/upgrade-modal';
import { StatisticsTooltip } from '@/components/statistics-tooltip';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';
import { usePage } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { i18n } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const user = (auth as any).user;

    // Check if user has active subscription or is on trial
    const hasActiveSubscriptionOrTrial = () => {
        if (!user?.subscriptions) return false;
        
        return user.subscriptions.some((subscription: any) => {
            const isActiveOrTrialing = subscription.stripe_status === 'active' || subscription.stripe_status === 'trialing';
            const isNotExpired = !subscription.ends_at || new Date(subscription.ends_at) > new Date();
            return isActiveOrTrialing && isNotExpired;
        });
    };
    
    // Hide premium banners if user has active subscription or is on trial
    const shouldShowPremiumBanners = !hasActiveSubscriptionOrTrial();

    const toggleDarkMode = () => {
        const newMode = appearance === 'dark' ? 'light' : 'dark';
        updateAppearance(newMode);
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            
            {/* XP Bar - centered */}
            <div className="flex-1 justify-center px-4 hidden md:flex">
                <div className="max-w-md w-full">
                    <XPBar user={auth.user} />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <StatisticsTooltip />
                
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="group h-9 w-9 cursor-pointer"
                                onClick={toggleDarkMode}
                            >
                                {appearance === 'dark' ? (
                                    <Sun className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                                ) : (
                                    <Moon className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{appearance === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                
                {shouldShowPremiumBanners && (
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="default"
                                    size="sm"
                                    className="relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-400 before:to-indigo-500 before:rounded-md before:blur before:opacity-0 before:animate-[glow_2s_ease-in-out_infinite_alternate] hover:before:opacity-100 hidden md:flex"
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                >
                                    <span className="relative flex items-center gap-1">
                                        ⚡ Unlock everything
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Subscribe for premium features</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

            </div>
            
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
            />
        </header>
    );
}
