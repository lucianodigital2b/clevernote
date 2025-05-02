import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PaginatedResponse, FlashcardSet } from '@/types';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { Layers, MoreVertical, ArrowRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { router } from '@inertiajs/react'
import { toast } from 'sonner';
import {DeleteConfirmationDialog} from '@/components/delete-confirmation-dialog';

interface Props {
    flashcardSets: PaginatedResponse<FlashcardSet>;
}

export default function Index({ flashcardSets }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setSelectedSetId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!selectedSetId) return;

        router.delete(`/flashcard-sets/${selectedSetId}`, {
            onSuccess: () => {
                toast.success('Flashcard set and its flashcards deleted successfully.');
                setDeleteDialogOpen(false);
            },
            onError: (error) => {
                toast.error('There was an error deleting the flashcard set!');
                console.error('There was an error deleting the flashcard set!', error);
                setDeleteDialogOpen(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Flashcards" />



            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Flashcard Sets</h1>
                    <Button asChild>
                        <Link href="/flashcard-sets/create">Create Flashcard Set</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcardSets.data.map((set) => (
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
                                            {set.flashcards_count} cards
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
                                            <Link href={`/flashcard-sets/${set.id}/edit`}>
                                                Edit Set
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(set.id)}>
                                            Delete Set
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                                {set.description}
                            </p>

                            <div className="flex justify-between items-center text-sm text-neutral-500">
                                <span>Created {new Date(set.created_at).toLocaleDateString()}</span>
                                
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/flashcard-sets/${set.id}/study`} className="flex items-center gap-2">
                                        Study Now
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {flashcardSets.data.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            No flashcard sets yet
                        </h3>
                        <p className="text-neutral-500 mt-2">
                            Create your first flashcard set to start studying
                        </p>
                    </div>
                )}
            </div>
            
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Delete Flashcard Set"
                description="Are you sure you want to delete this flashcard set and all its flashcards? This action cannot be undone."
            />
        </AppLayout>
    );
}

