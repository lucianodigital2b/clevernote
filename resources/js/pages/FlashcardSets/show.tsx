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

type StudyFilter = 'all' | 'new' | 'review' | 'memorised';

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
    const [studyFilter, setStudyFilter] = useState<StudyFilter>('all');

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

    // Helper function to determine flashcard study status
    const getFlashcardStatus = (flashcard: any): 'new' | 'review' | 'memorised' => {
        if (!flashcard.user_progress || flashcard.user_progress.length === 0) {
            return 'new';
        }
        
        const progress = flashcard.user_progress[0]; // Get the first (and should be only) progress record
        const now = new Date();
        const nextReview = new Date(progress.next_review);
        
        // If next review is in the future and repetition count is high, consider it memorised
        if (progress.repetition >= 5 && nextReview > now) {
            return 'memorised';
        }
        
        // If next review is due or overdue, it needs review
        if (nextReview <= now) {
            return 'review';
        }
        
        // Otherwise, it's memorised (not due for review yet)
        return 'memorised';
    };

    // Filter flashcards based on search query and study filter
    const filteredFlashcards = flashcards.filter(flashcard => {
        // First apply search filter
        const matchesSearch = flashcard.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            flashcard.answer.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        // Then apply study filter
        if (studyFilter === 'all') return true;
        
        const status = getFlashcardStatus(flashcard);
        return status === studyFilter;
    });

    // Count flashcards by status
    const statusCounts = {
        new: flashcards.filter(fc => getFlashcardStatus(fc) === 'new').length,
        review: flashcards.filter(fc => getFlashcardStatus(fc) === 'review').length,
        memorised: flashcards.filter(fc => getFlashcardStatus(fc) === 'memorised').length,
    };

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
                
                setFlashcards(prev => [...prev, response.props.flashcard as Flashcard]);
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

            <div className="container mx-auto py-4 px-4 sm:py-6">
                {/* Header Section - Mobile Optimized */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-start">
                    <div className="flex-1 min-w-0">
                        {isEditingSetDetails ? (
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        value={setData.name}
                                        onChange={(e) => setSetData('name', e.target.value)}
                                        className="text-2xl sm:text-3xl font-semibold border-none p-0 h-auto bg-transparent"
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
                                    <h1 className="text-2xl sm:text-3xl font-semibold mb-2 ">{setData.name}</h1>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                        onClick={() => setIsEditingSetDetails(true)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">{setData.description}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        <Button asChild className="w-full sm:w-auto">
                            <Link href={`/flashcard-sets/${flashcardSet.id}/study`} className="flex items-center justify-center gap-2">
                                <Brain className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('study_now')}</span>
                                <span className="sm:hidden">Study</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Controls Section - Mobile Optimized */}
                <div className="space-y-4 mb-6">
                    {/* Title and Filter Buttons */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        <h2 className="text-lg sm:text-xl font-medium">{t('flashcards')} ({filteredFlashcards.length})</h2>
                        
                        {/* Study Filter Buttons - Responsive */}
                        <div className="flex flex-wrap gap-2">
                            
                            <Button
                                variant={studyFilter === 'new' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStudyFilter('new')}
                                className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300 text-xs sm:text-sm"
                            >
                                <span className="hidden sm:inline">🆕 New</span>
                                <span className="sm:hidden">🆕</span>
                                <span className="ml-1">({statusCounts.new})</span>
                            </Button>
                            <Button
                                variant={studyFilter === 'review' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStudyFilter('review')}
                                className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300 text-xs sm:text-sm"
                            >
                                <span className="hidden sm:inline">📝 To Review</span>
                                <span className="sm:hidden">📝</span>
                                <span className="ml-1">({statusCounts.review})</span>
                            </Button>
                            <Button
                                variant={studyFilter === 'memorised' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStudyFilter('memorised')}
                                className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 text-xs sm:text-sm"
                            >
                                <span className="hidden sm:inline">✅ Memorised</span>
                                <span className="sm:hidden">✅</span>
                                <span className="ml-1">({statusCounts.memorised})</span>
                            </Button>
                        </div>
                    </div>
                    
                    {/* Search and Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                type="search"
                                placeholder={t('search_flashcards')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsGridView(!isGridView)}
                                className="flex-shrink-0"
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
                                className="flex-shrink-0"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAddFlashcard}
                                className="flex-1 sm:flex-initial"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{t('add_flashcard')}</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Flashcards Grid - Responsive */}
                <div className={isGridView ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                    {filteredFlashcards.map((flashcard) => (
                        <Card key={flashcard.id} className={`${isGridView ? "" : "flex flex-col sm:flex-row"} group hover:shadow-md transition-shadow relative`}>
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
                            
                            <CardContent className={isGridView ? "p-4 sm:p-6" : "p-4 sm:p-6 flex-1"}>
                                <div className="space-y-4">
                                    {/* Question Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
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
                                                    className="prose dark:prose-invert max-w-none min-h-[60px] focus:outline-none text-sm sm:text-base"
                                                />
                                                <InputError message={flashcardErrors.question} />
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-sm sm:text-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded transition-colors break-words"
                                                onClick={() => handleEditFlashcard(flashcard, 'question')}
                                                dangerouslySetInnerHTML={{ __html: flashcard.question }}
                                            />
                                        )}
                                    </div>

                                    {/* Answer Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
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
                                                    className="prose dark:prose-invert max-w-none min-h-[60px] focus:outline-none text-sm sm:text-base"
                                                />
                                                <InputError message={flashcardErrors.answer} />
                                            </div>
                                        ) : (
                                            <div 
                                                className="text-sm sm:text-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded transition-colors break-words"
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
                        <p className="text-neutral-500 mt-2 text-sm sm:text-base">
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

            {/* Add Flashcard Modal - Mobile Optimized */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Add New Flashcard</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Create a new flashcard for this set. Use the rich text editor to format your content.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitNewFlashcard} className="space-y-4 sm:space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="new-question" className="text-sm sm:text-base">Question</Label>
                                <div className="mt-2 border rounded-md p-2 sm:p-3 min-h-[80px] sm:min-h-[100px]">
                                    <EditorContent 
                                        editor={newQuestionEditor} 
                                        className="prose dark:prose-invert max-w-none focus:outline-none text-sm sm:text-base"
                                    />
                                </div>
                                <InputError message={newFlashcardErrors.question} className="mt-1" />
                            </div>
                            
                            <div>
                                <Label htmlFor="new-answer" className="text-sm sm:text-base">Answer</Label>
                                <div className="mt-2 border rounded-md p-2 sm:p-3 min-h-[80px] sm:min-h-[100px]">
                                    <EditorContent 
                                        editor={newAnswerEditor} 
                                        className="prose dark:prose-invert max-w-none focus:outline-none text-sm sm:text-base"
                                    />
                                </div>
                                <InputError message={newFlashcardErrors.answer} className="mt-1" />
                            </div>
                        </div>
                        
                        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleCancelAddFlashcard}
                                disabled={processingNewFlashcard}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={processingNewFlashcard}
                                className="w-full sm:w-auto"
                            >
                                {processingNewFlashcard ? 'Adding...' : 'Add Flashcard'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteFlashcardId} onOpenChange={() => setDeleteFlashcardId(null)}>
                <AlertDialogContent className="w-[95vw] max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl">Delete Flashcard</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base">
                            Are you sure you want to delete this flashcard? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteFlashcard}
                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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