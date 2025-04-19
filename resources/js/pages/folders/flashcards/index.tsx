import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react'; // Import Link
import { PaginatedResponse, Flashcard, Folder } from '@/types';
import { FlashcardListView } from '@/components/flashcard-list-view';
import { Button } from '@/components/ui/button'; // Import Button

interface Props {
    folder: Folder;
    flashcards: PaginatedResponse<Flashcard>;
}

export default function Index({ folder, flashcards }: Props) {
    return (
        <AppLayout>
            <Head title={`Flashcards - ${folder.name}`} />

            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Flashcards in "{folder.name}"</h1>
                    {/* Add Create Button */}
                    <Button asChild>
                        <Link href={route('folders.flashcards.create', { folder: folder.id })}>Create Flashcard</Link>
                    </Button>
                </div>

                {/* Use the FlashcardListView component */}
                <FlashcardListView flashcards={flashcards.data} />

                {/* Placeholder for Pagination */}
                {/* Placeholder for Filters */}
                {/* Placeholder for Create Button - Removed */}
            </div>
        </AppLayout>
    );
}