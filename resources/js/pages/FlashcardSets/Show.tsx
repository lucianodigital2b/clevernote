import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Plus, Pencil, Check, X, Trash2, Save } from 'lucide-react';
import { FlashcardSet, Flashcard } from '@/types';
import { Search, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { toastConfig } from '@/lib/toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

interface Props {
    flashcardSet: FlashcardSet;
}

interface EditingFlashcard {
    id: number;
    question: string;
    answer: string;
}

const Show = ({ flashcardSet }: Props) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isGridView, setIsGridView] = useState(true);
    const [editingFlashcard, setEditingFlashcard] = useState<number | null>(null);
    const [editingField, setEditingField] = useState<'question' | 'answer' | null>(null);
    const [isEditingSetDetails, setIsEditingSetDetails] = useState(false);
    const [flashcards, setFlashcards] = useState(flashcardSet.flashcards || []);
    const [deleteFlashcardId, setDeleteFlashcardId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form for editing set details
    const { data: setData, setData: setSetData, put: putSet, processing: processingSet, errors: setErrors } = useForm({
        name: flashcardSet.name,
        description: flashcardSet.description || ''
    });

    // Form for editing individual flashcards
    const { data: flashcardData, setData: setFlashcardData, put: putFlashcard, post: postFlashcard, delete: deleteFlashcard, processing: processingFlashcard, errors: flashcardErrors, reset: resetFlashcard } = useForm({
        question: '',
        answer: ''
    });

    // Form for adding new flashcards
    const { data: newFlashcardData, setData: setNewFlashcardData, post: postNewFlashcard, processing: processingNewFlashcard, errors: newFlashcardErrors, reset: resetNewFlashcard } = useForm({
        question: '',
        answer: '',
        flashcard_set_id: flashcardSet.id
    });

    // Tiptap editor for question editing
    const questionEditor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            setFlashcardData('question', editor.getHTML());
        },
    });

    // Tiptap editor for answer editing
    const answerEditor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            setFlashcardData('answer', editor.getHTML());
        },
    });

    // Tiptap editors for new flashcard modal
    const newQuestionEditor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            setNewFlashcardData('question', editor.getHTML());
        },
    });

    const newAnswerEditor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            setNewFlashcardData('answer', editor.getHTML());
        },
    });

    const filteredFlashcards = flashcards.filter(flashcard => 
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

    const handleEditFlashcard = (flashcard: Flashcard, field: 'question' | 'answer') => {
        setEditingFlashcard(flashcard.id);
        setEditingField(field);
        setFlashcardData({
            question: flashcard.question,
            answer: flashcard.answer
        });
        
        // Set editor content based on field
        if (field === 'question' && questionEditor) {
            questionEditor.commands.setContent(flashcard.question);
        } else if (field === 'answer' && answerEditor) {
            answerEditor.commands.setContent(flashcard.answer);
        }
    };

    const handleSaveFlashcard = () => {
        if (!editingFlashcard) return;
        
        putFlashcard(`/flashcard-sets/${flashcardSet.id}/flashcards/${editingFlashcard}`, {
            onSuccess: () => {
                // Update local state
                setFlashcards(prev => prev.map(fc => 
                    fc.id === editingFlashcard 
                        ? { ...fc, question: flashcardData.question, answer: flashcardData.answer }
                        : fc
                ));
                setEditingFlashcard(null);
                setEditingField(null);
                toastConfig.success('Flashcard updated successfully');
            },
            onError: () => {
                toastConfig.error('Failed to update flashcard');
            }
        });
    };

    const handleCancelEdit = () => {
        setEditingFlashcard(null);
        setEditingField(null);
        resetFlashcard();
    };

    const handleSaveSetDetails = () => {
        putSet(`/flashcard-sets/${flashcardSet.id}`, {
            onSuccess: () => {
                setIsEditingSetDetails(false);
                toastConfig.success('Flashcard set updated successfully');
            },
            onError: () => {
                toastConfig.error('Failed to update flashcard set');
            }
        });
    };

    const handleDeleteFlashcard = () => {
        if (!deleteFlashcardId) return;
        
        deleteFlashcard(`/flashcards/${deleteFlashcardId}`, {
            onSuccess: () => {
                setFlashcards(prev => prev.filter(fc => fc.id !== deleteFlashcardId));
                setDeleteFlashcardId(null);
                toastConfig.success('Flashcard deleted successfully');
            },
            onError: () => {
                toastConfig.error('Failed to delete flashcard');
            }
        });
    };

    const handleAddFlashcard = () => {
        setIsAddModalOpen(true);
        // Reset form and editors
        resetNewFlashcard();
        if (newQuestionEditor) {
            newQuestionEditor.commands.setContent('');
        }
        if (newAnswerEditor) {
            newAnswerEditor.commands.setContent('');
        }
    };

    const handleSubmitNewFlashcard = (e: React.FormEvent) => {
        e.preventDefault();
        
        postNewFlashcard(`/flashcards`, {
            onSuccess: (response) => {
                // Add the new flashcard to local state
                console.log(response.props);
                
                setFlashcards(prev => [...prev, response.props.flashcard]);
                setIsAddModalOpen(false);
                resetNewFlashcard();
                toastConfig.success('Flashcard added successfully');
            },
            onError: () => {
                toastConfig.error('Failed to add flashcard');
            }
        });
    };

    const handleCancelAddFlashcard = () => {
        setIsAddModalOpen(false);
        resetNewFlashcard();
        if (newQuestionEditor) {
            newQuestionEditor.commands.setContent('');
        }
        if (newAnswerEditor) {
            newAnswerEditor.commands.setContent('');
        }
    };

    return (
        <AppLayout>
            <Head title={`${flashcardSet.name} - Flashcards`} />

            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                        {isEditingSetDetails ? (
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        value={setData.name}
                                        onChange={(e) => setSetData('name', e.target.value)}
                                        className="text-3xl font-semibold border-none p-0 h-auto bg-transparent"
                                        placeholder="Set name"
                                    />
                                    <InputError message={setErrors.name} />
                                </div>
                                <div>
                                    <Textarea
                                        value={setData.description}
                                        onChange={(e) => setSetData('description', e.target.value)}
                                        className="text-neutral-500 dark:text-neutral-400 border-none p-0 bg-transparent resize-none"
                                        placeholder="Set description"
                                        rows={2}
                                    />
                                    <InputError message={setErrors.description} />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        onClick={handleSaveSetDetails}
                                        disabled={processingSet}
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setIsEditingSetDetails(false)}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="group">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-semibold mb-2">{setData.name}</h1>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setIsEditingSetDetails(true)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400">{setData.description}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
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
                        <Button
                            variant="outline"
                            onClick={handleAddFlashcard}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('add_flashcard')}
                        </Button>
                    </div>
                </div>

                <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                    {filteredFlashcards.map((flashcard) => (
                        <Card key={flashcard.id} className={`${isGridView ? "" : "flex"} group hover:shadow-md transition-shadow relative`}>
                            {/* Trash icon in top right corner */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteFlashcardId(flashcard.id)}
                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <CardContent className={isGridView ? "p-6" : "p-6 flex-1"}>
                                <div className="space-y-4">
                                    {/* Question Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                                {t('flashcard_question')}
                                            </h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingFlashcard === flashcard.id && editingField === 'question' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleSaveFlashcard}
                                                            disabled={processingFlashcard}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditFlashcard(flashcard, 'question')}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {editingFlashcard === flashcard.id && editingField === 'question' ? (
                                            <div className="border rounded-md p-2">
                                                <EditorContent 
                                                    editor={questionEditor} 
                                                    className="prose dark:prose-invert max-w-none min-h-[60px] focus:outline-none"
                                                />
                                                <InputError message={flashcardErrors.question} />
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded transition-colors"
                                                onClick={() => handleEditFlashcard(flashcard, 'question')}
                                                dangerouslySetInnerHTML={{ __html: flashcard.question }}
                                            />
                                        )}
                                    </div>

                                    {/* Answer Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                                {t('flashcard_answer')}
                                            </h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingFlashcard === flashcard.id && editingField === 'answer' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleSaveFlashcard}
                                                            disabled={processingFlashcard}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleCancelEdit}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditFlashcard(flashcard, 'answer')}
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {editingFlashcard === flashcard.id && editingField === 'answer' ? (
                                            <div className="border rounded-md p-2">
                                                <EditorContent 
                                                    editor={answerEditor} 
                                                    className="prose dark:prose-invert max-w-none min-h-[60px] focus:outline-none"
                                                />
                                                <InputError message={flashcardErrors.answer} />
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded transition-colors"
                                                onClick={() => handleEditFlashcard(flashcard, 'answer')}
                                                dangerouslySetInnerHTML={{ __html: flashcard.answer }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {flashcards.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                            {t('no_flashcards_yet')}
                        </h3>
                        <p className="text-neutral-500 mt-2">
                            {t('start_first_flashcard')}
                        </p>
                        <Button 
                            className="mt-4"
                            onClick={handleAddFlashcard}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('add_flashcard')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Add Flashcard Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Flashcard</DialogTitle>
                        <DialogDescription>
                            Create a new flashcard for this set. Use the rich text editor to format your content.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitNewFlashcard} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-question">Question</Label>
                                <div className="mt-2 border rounded-md p-3 min-h-[100px]">
                                    <EditorContent 
                                        editor={newQuestionEditor} 
                                        className="prose dark:prose-invert max-w-none focus:outline-none"
                                    />
                                </div>
                                <InputError message={newFlashcardErrors.question} className="mt-1" />
                            </div>
                            
                            <div>
                                <Label htmlFor="new-answer">Answer</Label>
                                <div className="mt-2 border rounded-md p-3 min-h-[100px]">
                                    <EditorContent 
                                        editor={newAnswerEditor} 
                                        className="prose dark:prose-invert max-w-none focus:outline-none"
                                    />
                                </div>
                                <InputError message={newFlashcardErrors.answer} className="mt-1" />
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancelAddFlashcard}
                                disabled={processingNewFlashcard}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={processingNewFlashcard}
                            >
                                {processingNewFlashcard ? 'Adding...' : 'Add Flashcard'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteFlashcardId} onOpenChange={() => setDeleteFlashcardId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this flashcard? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteFlashcard}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
};

export default Show;