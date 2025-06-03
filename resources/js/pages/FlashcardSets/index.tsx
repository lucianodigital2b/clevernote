import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PaginatedResponse, FlashcardSet } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

import { Layers, MoreVertical, ArrowRight, PlusIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {DeleteConfirmationDialog} from '@/components/delete-confirmation-dialog';
import { t } from 'i18next';

interface Props {
    flashcardSets: PaginatedResponse<FlashcardSet>;
    isLoading?: boolean;
}

export default function Index({ flashcardSets, isLoading = false }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setSelectedSetId(id);
        setDeleteDialogOpen(true);
    };

    return (
        <AppLayout>
            <Head title="Flashcards" />



            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">{t('flashcard_sets_title')}</h1>
                    <Button asChild>
                        <Link href="/flashcard-sets/create" className="flex items-center gap-2">
                            <PlusIcon className="h-4 w-4" />
                            {t('create_flashcard_set')}
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        // Skeleton loading state
                        Array.from({ length: 6 }).map((_, index) => (
                            <div 
                                key={index}
                                className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-9 w-9 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                                
                                <div className="mb-4">
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>

                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-20 rounded" />
                                </div>
                            </div>
                        ))
                    ) : (
                        flashcardSets.data.map((set) => (
                            <div 
                                key={set.id}
                                className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 
                                         hover:shadow-md transition-all duration-200 ease-in-out transform hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                            <Layers className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">{set.name}</h3>
                                            <p className="text-sm text-neutral-500">
                                                {t('flashcard_count', { count: set.flashcards_count })}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/flashcard-sets/${set.id}`}>
                                                    {t('edit')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(set.id)}>
                                                {t('delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                                    {set.description}
                                </p>

                                <div className="flex justify-between items-center text-sm text-neutral-500">
                                    <span>{t('created_date', { date: new Date(set.created_at).toLocaleDateString() })}</span>
                                    
                                    <Button variant="outline" size="sm" asChild className='dark:text-white'>
                                        <Link href={`/flashcard-sets/${set.id}/study`} className="flex items-center gap-2">
                                            {t('study_now')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {flashcardSets.data.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            {t('no_flashcard_sets')}
                        </h3>
                        <p className="text-neutral-500 mt-2">
                            {t('create_first_set')}
                        </p>
                    </div>
                )}
            </div>
            
            {selectedSetId && (
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    endpoint={`/flashcard-sets/${selectedSetId}`}
                    title={t('are_you_sure')}
                    description={t('this_action_cannot_be_undone')}
                    successMessage={t('deleted_successfully')}
                    errorMessage={t('delete_error')}
                />
            )}
        </AppLayout>
    );
}

