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
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
