import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Plus, Pencil } from 'lucide-react';
import { FlashcardSet } from '@/types';
import { Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    flashcardSet: FlashcardSet;
}

const Show = ({ flashcardSet }: Props) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isGridView, setIsGridView] = useState(true);

    const filteredFlashcards = flashcardSet.flashcards?.filter(flashcard => 
        flashcard.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flashcard.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExportCSV = () => {
        const headers = ['Question', 'Answer'];
        const csvContent = [
            headers.join(','),
            ...filteredFlashcards.map(flashcard => 
                `"${flashcard.question.replace(/"/g, '""')}","${flashcard.answer.replace(/"/g, '""')}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${flashcardSet.name.replace(/[^a-z0-9]/gi, '_')}_flashcards.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <AppLayout>
            <Head title={`${flashcardSet.name} - Flashcards`} />

            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold mb-2">{flashcardSet.name}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">{flashcardSet.description}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/flashcard-sets/${flashcardSet.id}/edit`} className="flex items-center gap-2">
                                <Pencil className="h-4 w-4" />
                                {t('edit_set')}
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/flashcard-sets/${flashcardSet.id}/study`} className="flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                {t('study_now')}
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium">{t('flashcards')} ({filteredFlashcards.length})</h2>
                    <div className="flex gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                type="search"
                                placeholder={t('search_flashcards')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsGridView(!isGridView)}
                        >
                            {isGridView ? (
                                <List className="h-4 w-4" />
                            ) : (
                                <Grid className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleExportCSV}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/flashcard-sets/${flashcardSet.id}/flashcards/create`} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {t('add_flashcard')}
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                    {filteredFlashcards.map((flashcard) => (
                        <Card key={flashcard.id} className={isGridView ? "" : "flex"}>
                            <CardContent className={isGridView ? "p-6" : "p-6 flex-1"}>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                                    {t('flashcard_question')}
                                </h3>
                                <p className="text-lg">{flashcard.question}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                                    {t('flashcard_answer')}
                                </h3>
                                        <p className="text-lg">{flashcard.answer}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {flashcardSet.flashcards.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            {t('no_flashcards_yet')}
                        </h3>
                        <p className="text-neutral-500 mt-2">
                            {t('start_first_flashcard')}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default Show;