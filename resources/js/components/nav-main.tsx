import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavMainProps {
    items: NavItem[];
    onItemClick?: (item: NavItem) => boolean;
}

export function NavMain({ items = [], onItemClick }: NavMainProps) {
    const page = usePage();
    
    const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
        if (onItemClick && onItemClick(item)) {
            e.preventDefault();
        }
    };
    
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.url === page.url}>
                            <Link 
                                href={item.url} 
                                prefetch
                                onClick={(e) => handleItemClick(item, e)}
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    <span>{item.title}</span>
                                </div>
                                {item.new && (
                                    <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                        new
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
