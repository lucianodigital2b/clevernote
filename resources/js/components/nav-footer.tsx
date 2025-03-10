import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef, useState } from 'react';
import { UpgradeModal } from '@/components/upgrade-modal';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type NavFooterProps = ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    onItemClick?: (item: NavItem) => boolean;
};

export function NavFooter({
    items,
    className,
    onItemClick,
    ...props
}: NavFooterProps) {
    // Free notes limit and current usage
    const freeNotesLimit = 3;
    const freeNotesUsed = 0; // This should be fetched from your state/API
    const freeNotesLeft = freeNotesLimit - freeNotesUsed;
    const progressPercentage = (freeNotesUsed / freeNotesLimit) * 100;
    
    // Get sidebar state
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <SidebarGroup {...props} className={`${className || ''}`}>
            {/* Full Progress Bar (Expanded Sidebar) */}
            <div className={`px-2 mb-2 transition-all duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                            Free Notes Left
                        </span>
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                            {freeNotesLeft}/{freeNotesLimit}
                        </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${100 - progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="mt-2 text-center">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                        >
                            Upgrade for unlimited notes
                        </button>
                    </div>
                </div>
            </div>

            {/* Compact Progress Icon (Collapsed Sidebar) */}
            <div className={`transition-all duration-200 ${isCollapsed ? 'block' : 'hidden'}`}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center w-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        >
                            <div className="relative">
                                <SparklesIcon className="h-5 w-5 text-blue-500" />
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {freeNotesLeft}
                                </div>
                            </div>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {freeNotesLeft} free notes left - Upgrade for unlimited
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
