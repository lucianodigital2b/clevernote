import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { FlashcardSet } from '@/types';
import InputError from '@/components/input-error';

interface Props {
    flashcardSet: FlashcardSet;
}

const Edit = ({ flashcardSet }: Props) => {
    const { data, setData, put, processing, errors } = useForm({
        name: flashcardSet.name,
        description: flashcardSet.description || '',
        flashcards: flashcardSet.flashcards
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/flashcard-sets/${flashcardSet.id}`);
    };

    const addFlashcard = () => {
        setData('flashcards', [
            ...data.flashcards,
            { question: '', answer: '', id: Date.now() }
        ]);
    };

    const removeFlashcard = (index: number) => {
        const updated = data.flashcards.filter((_, i) => i !== index);
        setData('flashcards', updated);
    };

    return (
        <AppLayout>
            <Head title={`Edit ${flashcardSet.name}`} />

            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Edit Flashcard Set</h1>
                    <Button asChild variant="outline">
                        <Link href={`/flashcard-sets/${flashcardSet.id}`}>
                            Back to Set
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Set Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Name</label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Description</label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Flashcards</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addFlashcard}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Flashcard
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.flashcards.map((flashcard, index) => (
                                <div key={flashcard.id} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium">Flashcard #{index + 1}</h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFlashcard(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <Input
                                                value={flashcard.question}
                                                onChange={(e) => {
                                                    const updated = [...data.flashcards];
                                                    updated[index].question = e.target.value;
                                                    setData('flashcards', updated);
                                                }}
                                                placeholder="Question"
                                            />
                                            <InputError message={errors[`flashcards.${index}.question`]} />
                                        </div>
                                        <div>
                                            <Textarea
                                                value={flashcard.answer}
                                                onChange={(e) => {
                                                    const updated = [...data.flashcards];
                                                    updated[index].answer = e.target.value;
                                                    setData('flashcards', updated);
                                                }}
                                                placeholder="Answer"
                                                className="min-h-[100px]"
                                            />
                                            <InputError message={errors[`flashcards.${index}.answer`]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default Edit;