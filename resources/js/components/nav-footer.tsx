import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef, useState } from 'react';
import { UpgradeModal } from '@/components/upgrade-modal';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

type NavFooterProps = ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    onItemClick?: (item: NavItem) => boolean;
    user?: any;
};

export function NavFooter({
    items,
    className,
    onItemClick,
    user,
    ...props
}: NavFooterProps) {
    const { t } = useTranslation();
    
    // Free notes limit and current usage
    const freeNotesLimit = 3;
    
    const freeNotesUsed = user?.notes_count || 0;

    const freeNotesLeft = Math.max(0, freeNotesLimit - freeNotesUsed);
    const progressPercentage = (freeNotesUsed / freeNotesLimit) * 100;
    
    // Get sidebar state
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <SidebarGroup {...props} className={`${className || ''}`}>
            {/* Full Progress Bar (Expanded Sidebar) */}
            {user.active_subscriptions?.length == 0 && (

                <div className={`px-2 mb-2 transition-all duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                {t('free_notes_left')}
                            </span>
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                                {freeNotesUsed}/{freeNotesLimit}
                            </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                            <div 
                                className="bg-indigo-500 h-2 rounded-full" 
                                style={{ width: `${100 - progressPercentage}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-center">
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                            >
                                {t('upgrade_for_unlimited_notes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Progress Icon (Collapsed Sidebar) */}
            <div className={`transition-all duration-200 ${isCollapsed ? 'block' : 'hidden'}`}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center w-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        >
                            <div className="relative">
                                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                                <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {freeNotesLeft}
                                </div>
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {t('upgrade_for_unlimited_notes')}
                    </TooltipContent>
                </Tooltip>
            </div>

            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        // Skip documentation and repository items
                        if (item.title === 'Documentation' || item.title === 'Repository') {
                            return null;
                        }
                        
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                                >
                                    {onItemClick ? (
                                        <a 
                                            href={item.url} 
                                            onClick={(e) => {
                                                if (onItemClick(item)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                        </a>
                                    ) : (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                        </a>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>

            {/* Upgrade Modal */}
            <UpgradeModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </SidebarGroup>
    );
}
