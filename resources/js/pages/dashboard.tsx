import AppLayout from '@/layouts/app-layout';
import { Folder, Note, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Search, FileText, Link as LinkIcon, Upload, Mic, File, Folder as FolderIcon, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { UploadAudioModal } from '@/components/modals/upload-audio-modal';
import { RecordAudioModal } from '@/components/modals/record-audio-modal';
import { UploadPdfModal } from '@/components/modals/upload-pdf-modal';
import { WebLinkModal } from '@/components/modals/web-link-modal';
import { usePage } from '@inertiajs/react';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useRequireSubscription } from '@/hooks/useRequireSubscription';
import OnboardingForm from '@/components/onboardingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];


export default function Dashboard() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedSearch = useDebounce(searchQuery, 300);
    const { folderId } = usePage().props as { folderId?: string | number };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const { auth } = usePage().props;

    const { t } = useTranslation();

    const user = (auth as any).user;

    useEffect(() => {
        // Show onboarding modal if user hasn't completed it
        if (!user.onboarding_completed) {
            setIsOnboardingOpen(true);
        }
    }, [user.onboarding_completed]);
    
    // Query for notes with pagination
    const { 
        data: notesData, 
        isLoading: isLoadingNotes, 
        refetch: refetchNotes,
        error: notesError 
    } = useQuery({
        queryKey: ['notes', page, pageSize, debouncedSearch, folderId],
        queryFn: async () => {
            const response = await axios.get('/api/notes', {
                params: {
                    page,
                    per_page: pageSize,
                    search: debouncedSearch || undefined,
                    folder_id: folderId || undefined,
                }
            });
            return response.data;
        },
        staleTime: 30000, // Data remains fresh for 30 seconds
        refetchOnWindowFocus: false // Prevent refetch on window focus
    });
    
    const notes = notesData?.data || [];
    const totalPages = notesData?.meta?.last_page || 1;

    // Add back the folders query
    const { data, isLoading, error } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const response = await axios.get('/api/folders-with-counts');
            return response.data.folders;
        },
        staleTime: 30000, // Data remains fresh for 30 seconds
        refetchOnWindowFocus: false // Prevent refetch on window focus
    });
    
    const folders = data || [];
    
    // Add back modal states
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [isWebLinkModalOpen, setIsWebLinkModalOpen] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [isUploadAudioModalOpen, setIsUploadAudioModalOpen] = useState(false);

    // Add back the getIconComponent function
    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'audio':
                return <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full"><Mic className="h-5 w-5 text-red-500" /></div>;
            case 'pdf':
                return <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-full"><FileText className="h-5 w-5 text-neutral-500" /></div>;
            case 'link':
                return <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full"><LinkIcon className="h-5 w-5 text-blue-500" /></div>;
            default:
                return <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-full"><File className="h-5 w-5 text-neutral-500" /></div>;
        }
    };

    const handleModalClose = (open: boolean, success: boolean = false) => {
        if (!open && success) {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        }
    };

    const { requireSubscription } = useRequireSubscription();
    
    // Modify the new note section handler to check subscription
    const handleNewNote = async (action: () => void) => {
        if (notes.length >= 3) {
            const canProceed = await requireSubscription();
            
            if (!canProceed) {
                setIsModalOpen(true)
                return;
            }
        }
        action();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Dashboard')} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* New Note Section */}
                <section>
                    <h2 className="text-xl font-semibold mb-2">{t('New note')}</h2>
                    <p className="text-neutral-500 mb-4">{t('Record/upload audio, send a document or use a YouTube URL')}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div 
                            className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleNewNote(() => setIsUploadAudioModalOpen(true))}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-full">
                                    <Upload className="h-5 w-5 text-neutral-500" />
                                </div>
                                <span className="font-medium">{t('Upload audio')}</span>
                            </div>
                        </div>

                        <div 
                            className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleNewNote(() => setIsRecordModalOpen(true))}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                                    <Mic className="h-5 w-5 text-red-500" />
                                </div>
                                <span className="font-medium">{t('Record audio')}</span>
                            </div>
                        </div>
                        
                        <div 
                            className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleNewNote(() => setIsWebLinkModalOpen(true))}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                                    <Youtube className="h-5 w-5 text-red-500 " />
                                </div>
                                <div>
                                    <span className="font-medium">{t('Youtube')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div 
                            className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleNewNote(() => setIsPdfModalOpen(true))}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-full">
                                    <FileText className="h-5 w-5 text-neutral-500" />
                                </div>
                                <span className="font-medium">{t('Upload PDF/text')}</span>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* My Notes Section */}
                <section>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-4 w-full">
                        <h2 className="text-xl font-semibold">{t('My notes')}</h2>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                <Input 
                                    type="text" 
                                    placeholder={t('Search any note')}
                                    className="pl-9 w-full bg-neutral-100 dark:bg-neutral-800 border-none"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <Button variant="outline" className="flex items-center gap-2">
                                <span>{t('All notes')}</span>
                            </Button>
                        </div>
                    </div>
                    
                    {isLoadingNotes ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800"></div>
                        </div>
                    ) : notesError ? (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
                            Failed to load notes. Please try again.
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg text-center flex flex-col items-center">
                            <div className="mb-4 text-5xl">📝</div>
                            <h3 className="text-lg font-medium mb-2">{t('No notes yet')}</h3>
                            <p className="text-neutral-500 max-w-md">
                                {t('Create your first note')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {notes.map((note : Note) => (
                                    <div key={note.id} className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
                                        <Link href={`/notes/${note.id}/edit`} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {getIconComponent(note.icon)}
                                                <div>
                                                    <h3 className="font-medium">{note.title}</h3>
                                                    <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">
                                                        {note.summary || 'No summary available'}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                                                        <span>Created at {new Date(note.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6 gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        Previous
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setPage(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        ))}
                                    </div>
                                    
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </section>
                
                {/* Upgrade Banner */}
                {/* {user.active_subscriptions?.length == 0 && (
                    <div className="fixed bottom-6 right-6">
                        <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-full flex items-center gap-2"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Unlimited notes <span className="text-xs">⚡</span>
                        </Button>
                    </div>
                )} */}
            </div>

            {/* Upload Audio Modal */}
            <UploadAudioModal 
                open={isUploadAudioModalOpen}
                onOpenChange={(open, success = false) => {
                    setIsUploadAudioModalOpen(open);
                    handleModalClose(open, success);
                }}
                folders={folders}
            />
            <RecordAudioModal 
                open={isRecordModalOpen}
                onOpenChange={(open, success = false) => {
                    setIsRecordModalOpen(open);
                    handleModalClose(open, success);
                }}
                folders={folders}
            />
            <UploadPdfModal 
                open={isPdfModalOpen}
                onOpenChange={(open, success = false) => {
                    setIsPdfModalOpen(open);
                    handleModalClose(open, success);
                }}
                folders={folders}
            />
            <WebLinkModal 
                open={isWebLinkModalOpen}
                onOpenChange={(open, success = false) => {
                    setIsWebLinkModalOpen(open);
                    handleModalClose(open, success);
                }}
                folders={folders}
            />

            <UpgradeModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

            <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('welcome_title')}</DialogTitle>
                    </DialogHeader>
                    <OnboardingForm />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}


