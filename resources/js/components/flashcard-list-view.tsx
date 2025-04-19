import { Flashcard, Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Edit, Trash2 } from 'lucide-react';

interface FlashcardListViewProps {
    flashcards: Flashcard[];
    // Add props for handling edit/delete actions later
    // onDelete: (id: number) => void;
}

export function FlashcardListView({ flashcards }: FlashcardListViewProps) {
    const getDifficultyBadgeVariant = (difficulty: string | null) => {
        switch (difficulty) {
            case 'easy': return 'success';
            case 'medium': return 'warning';
            case 'hard': return 'destructive';
            default: return 'secondary';
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900  rounded-lg overflow-hidden p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashcards.length === 0 ? (
                <div className="col-span-full text-center text-neutral-500 py-8">
                    No flashcards found.
                </div>
            ) : (
                flashcards.map((flashcard) => (
                    <div key={flashcard.id} className="bg-white dark:bg-neutral-800 shadow rounded-lg p-4">
                        <h3 className="font-medium text-lg truncate">{flashcard.question}</h3>
                        <p className="text-sm truncate">{flashcard.answer}</p>
                        <div className="mt-2">
                            {flashcard.folder ? (
                                <Link href={`/folders/${flashcard.folder.id}/flashcards`} className="text-blue-600 hover:underline">
                                    {flashcard.folder.name}
                                </Link>
                            ) : (
                                <span className="text-neutral-500">Global</span>
                            )}
                        </div>
                        <div className="mt-2">
                            {flashcard.difficulty && (
                                <Badge variant={getDifficultyBadgeVariant(flashcard.difficulty)}>
                                    {flashcard.difficulty}
                                </Badge>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                            <Button variant="ghost" size="icon" asChild className="mr-1">
                                <Link href={`/flashcards/${flashcard.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}