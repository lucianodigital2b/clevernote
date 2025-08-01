import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, ChevronRight, Plus, Layers, MessageSquare, BrainCircuit, Headphones, GraduationCap, ChartAreaIcon, HelpCircle, Phone, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { CreateFolderModal } from '@/components/create-folder-modal';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';


export function AppSidebar() {
    const { t } = useTranslation();
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    
    const { auth } = usePage().props;
    const user = (auth as any).user;

    
const mainNavItems: NavItem[] = [
    {
        title: t('dashboard'),
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Flashcards',
        url: '/flashcard-sets',
        icon: Layers, 
    },
    {
        title: t('Quizzes'),
        url: '/quizzes',
        icon: GraduationCap,
    },
    {
        title: t('Groups'),
        url: '/groups',
        icon: Users,
        new: true,
    },
    {
        title: t('Statistics'),
        url: '/statistics',
        icon: ChartAreaIcon,
    },
    {
        title: t('Podcast') + ' (' + t('Coming soon') + ')',
        url: '#',
        icon: Headphones,
        tooltip: t('Coming soon'),
    },
    {
        title: t('BrainRot') + ' (' + t('Coming soon') + ')',
        url: '#',
        icon: BrainCircuit,
        tooltip: t('Coming soon'),
    },
];

const footerNavItems: NavItem[] = [
    {
        title: t('create_folder'),
        url: '#', 
        icon: Folder,
    },
    {
        title: t('how'),
        url: '/how',
        icon: HelpCircle,
    },
    {
        title: t('Feedback'),
        url: 'https://clevernote.featurebase.app/',
        icon: MessageSquare,
    },
    {
        title: t('Support'),
        url: 'https://wa.me/5527997798070',
        icon: Phone,
    }
];


    // Replace useEffect with useQuery
    const { data, isLoading, error } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const response = await axios.get('/api/folders-with-counts');
            return response.data.folders;
        },
        staleTime: 30000, // Data remains fresh for 30 seconds
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnMount: false // Prevent refetch on component mount
    });
    
    const folders = data || [];

    const handleNavItemClick = (item: NavItem) => {
        // Check by URL or icon instead of localized title
        if (item.url === '#' && item.icon === Folder) {
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
                            {t('Folders')}
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
                                    {t('Loading folders...')}
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-neutral-500">
                                    {t('No folders yet')}
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
                <NavFooter 
                    items={footerNavItems} 
                    className="mt-auto" 
                    onItemClick={handleNavItemClick}
                    user={user}
                />
                
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
