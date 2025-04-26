import { useState } from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, ChevronRight, Plus, Layers, MessageSquare, BrainCircuit, Headphones, GraduationCap } from 'lucide-react';
import AppLogo from './app-logo';
import { CreateFolderModal } from '@/components/create-folder-modal';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Flashcards',
        url: '/flashcards',
        icon: Layers, 
    },
    {
        title: 'Quizzes',
        url: '/quizzes',
        icon: GraduationCap,
        tooltip: 'Coming soon',
    },
    {
        title: 'Podcast (soon)',
        url: '#',
        icon: Headphones,
        tooltip: 'Coming soon',
    },
    {
        title: 'BrainRot (soon)',
        url: '#',
        icon: BrainCircuit,
        tooltip: 'Coming soon',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Create folder',
        url: '#', // Changed to # to prevent navigation
        icon: Folder,
    },
    {
        title: 'Feedback',
        url: 'https://clevernote.featurebase.app/',
        icon: MessageSquare,
    }
];


export function AppSidebar() {
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    
    const { auth } = usePage().props;
    const user = (auth as any).user;

    // Replace useEffect with useQuery
    const { data, isLoading, error } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const response = await axios.get('/api/folders-with-counts');
            return response.data.folders;
        }
    });
    
    const folders = data || [];

    const handleNavItemClick = (item: NavItem) => {
        if (item.title === 'Create folder') {
            setIsFolderModalOpen(true);
            return true; // Return true to prevent default navigation
        }
        return false; // Allow default navigation for other items
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                
                {/* Folders Section */}
                <SidebarGroup>
                    <div className="flex items-center justify-between px-3 py-2">
                        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                            Folders
                        </h2>
                        {/* <button 
                            onClick={() => setIsFolderModalOpen(true)}
                            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <Plus className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        </button> */}
                    </div>
                    
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading ? (
                                <div className="px-3 py-2 text-sm text-neutral-500">
                                    Loading folders...
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-neutral-500">
                                    No folders yet
                                </div>
                            ) : (
                                folders.map((folder : any) => (
                                    <SidebarMenuItem key={folder.id}>
                                        <SidebarMenuButton asChild>
                                            <Link 
                                                href={`/dashboard?folderId=${folder.id}`} 
                                                className="flex justify-between items-center"
                                            >
                                                <div className="flex items-center">
                                                    <Folder className="h-4 w-4 mr-2" />
                                                    <span>{folder.name}</span>
                                                </div>
                                                <span className="text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                                                    {folder.notes_count}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                {user.active_subscriptions?.length == 0 && (
                <NavFooter 
                    items={footerNavItems} 
                    className="mt-auto" 
                    onItemClick={handleNavItemClick}
                />
                )}
                <NavUser />
            </SidebarFooter>

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
            />
        </Sidebar>
    );
}
