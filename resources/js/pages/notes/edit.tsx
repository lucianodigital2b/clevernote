import { router, Head, usePage } from '@inertiajs/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
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
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Share, MoreHorizontal, Maximize2, X, ArrowLeft, Save, Clock, CheckCircle2, Folder, Trash2, Sparkles, Brain, Map, FileText, Loader2, ChevronRight, Layers, Copy, Grid3X3 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProcessingState } from '@/components/ui/processing-state';
import { LoadingModal } from '@/components/ui/loading-modal';
import { Note } from '@/types';
import { toastConfig } from '@/lib/toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import { ValidationErrors } from '@/components/validation-errors';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapToolbar from '@/components/tiptaptoolbar';
// import { SectionBlock } from '@/extensions/SectionBlock';
import DragHandle  from '@/extensions/DragHandle';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { MathExtension } from "@aarkue/tiptap-math-extension";
import "katex/dist/katex.min.css";
import Image from '@tiptap/extension-image'
import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function Edit({ note }: { note: Note }) {
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackReason, setFeedbackReason] = useState('');
    const [deleteRelatedItems, setDeleteRelatedItems] = useState(false);


    const { t } = useTranslation();
    const { errors } = usePage().props;
    
    // Add state for failed status
    const [isFailed, setIsFailed] = useState(note.status === 'failed');
    const [isProcessing, setIsProcessing] = useState(note.status === 'processing');
    const [currentNote, setCurrentNote] = useState(note);
    
    // Word count utility function
    const getWordCount = (htmlContent: string): number => {
        if (!htmlContent) return 0;
        
        // Create a temporary div to strip HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Split by whitespace and filter out empty strings
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    };
    


  
  const handleSubmitFeedback = async (isPositive: boolean) => {
    
    try {
        const res = await axios.post(`/feedback`, {
            feedbackable_type: 'note',
            feedbackable_id: note.id,
            is_positive: isPositive,
            reason: isPositive ? null : feedbackReason,
        })

        
        setFeedbackModalOpen(false);
        setFeedbackReason('');

        toastConfig.success('Thanks for the feedback');

    } catch (error) {
        console.error('Error submitting feedback:', error);
        toastConfig.error('Failed to submit feedback');
    }

  };

  const handleUpdate = () => {
        router.patch(`/notes/${note.id}`, {
            content,
            folder_id: selectedFolder,
            is_public: isPublic,
            _method: 'PUT'
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toastConfig.success("Note updated successfully");
            },
            onError: (errors) => {
                console.log(errors);
                
                toastConfig.error("Failed to update note");
            }
        });
    };
    
    const handleSaveFolder = () => {
        setIsFolderModalOpen(false);
        handleUpdate();
    };

    const handleCopyPublicLink = async () => {
        if (!note.uuid) {
            toastConfig.error('Note UUID not available');
            return;
        }
        
        const publicUrl = `${window.location.origin}/notes/${note.uuid}/public`;
        
        try {
            await navigator.clipboard.writeText(publicUrl);
            toastConfig.success('Public link copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toastConfig.error('Failed to copy link to clipboard');
        }
     };

    // Add this function near your other handlers
    const handleRetryProcessing = async () => {
        try {
            setIsFailed(false);
            
            const response = await axios.post(`/notes/${note.id}/retry`);
            
            if (response.data.message) {
                toastConfig.success('Processing retry initiated');
            }
        } catch (error) {
            console.error('Error retrying processing:', error);
            setIsFailed(true);
            toastConfig.error('Failed to retry processing');
        }
    };

    // Add this new state
    const [isActionsVisible, setIsActionsVisible] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [content, setContent] = useState(currentNote.content);

    // Calculate word count from current content using useMemo for real-time updates
    const wordCount = useMemo(() => {
        return getWordCount(content || currentNote.content);
    }, [content, currentNote.content]);

    const debouncedContent = useDebounce(content, 1000); // Debounce content by 1 second

    // console.log(wordCount);
    
    // Add state for the flashcard modal
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

    // Update handler to show/hide modal
    const handleCreateFlashcards = async () => {
        setIsFlashcardModalOpen(true);
        try {
            // Check if flashcard set already exists in preloaded data
            if (note.flashcard_sets && note.flashcard_sets.length > 0) {
                setIsFlashcardModalOpen(false);
                // Get the last created flashcard set
                const lastFlashcardSet = note.flashcard_sets[note.flashcard_sets.length - 1];
                router.visit(`/flashcard-sets/${lastFlashcardSet.id}`);
                return;
            }

            // If no existing flashcard set, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-flashcards`);
            if (response.data && response.data.flashcardSetId) {
                const flashcardSetId = response.data.flashcardSetId;
                toastConfig.success("Flashcard generation started");
                
                // Start polling for flashcard set status
                const intervalId = setInterval(async () => {
                    try {
                        const flashcardResponse = await axios.get(`/flashcard-sets/${flashcardSetId}`);
                        const flashcardData = flashcardResponse.data.flashcardSet;
                        
                        if (flashcardData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsFlashcardModalOpen(false);
                            router.visit(`/flashcard-sets/${flashcardSetId}`);
                            
                        } else if (flashcardData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsFlashcardModalOpen(false);
                            toastConfig.error("Flashcard generation failed");
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        clearInterval(intervalId);
                        setIsFlashcardModalOpen(false);
                        toastConfig.error("Failed to check flashcard generation status");
                    }
                }, 5000); // Poll every 5 seconds
            }
        } catch (error) {
            setIsFlashcardModalOpen(false);
            toastConfig.error("Failed to start flashcard generation");
        }
    };


    // Add new state for quiz generation
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(note.folder_id || null);
    const [folders, setFolders] = useState<Array<{id: number; name: string}>>([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isPublic, setIsPublic] = useState(note.is_public || false);
    
    useEffect(() => {
        if (isFolderModalOpen) {
            
            axios.get('/folders').then(response => {
                console.log(response.data);
                setFolders(response.data);
            }).catch(error => {
                console.error('Error fetching folders:', error);
            });
        }
    }, [isFolderModalOpen]);



    const handleCreateQuizz = async () => {
        setIsQuizModalOpen(true);
        try {
            // Check if quiz already exists in preloaded data
            if (note.quizzes && note.quizzes.length > 0) {
                setIsQuizModalOpen(false);
                // Get the last created quiz
                const lastQuiz = note.quizzes[note.quizzes.length - 1];
                router.visit(`/quizzes/${lastQuiz.id}`);
                return;
            }

            // If no existing quiz, create a new one
            const response = await axios.post(`/quizzes/generate-from-note/${note.id}`);
            if (response.data && response.data.quiz_id) {
                const quizId = response.data.quiz_id;
                toastConfig.success("Quiz generation started");
                
                // Start polling for quiz status
                const intervalId = setInterval(async () => {
                    try {
                        const quizResponse = await axios.get(`/quizzes/${quizId}`);
                        const quizData = quizResponse.data.quiz;
                        
                        if (quizData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsQuizModalOpen(false);
                            router.visit(`/quizzes/${quizId}`);
                            
                        } else if (quizData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsQuizModalOpen(false);
                            toastConfig.error("Quiz generation failed");
                        }
                        // Continue polling if status is 'generating'
                    } catch (error) {
                        console.log(error);
                        
                        clearInterval(intervalId);
                        setIsQuizModalOpen(false);
                        toastConfig.error("Failed to check quiz generation status");
                    }
                }, 2000); // Poll every 2 seconds
                
               
            }
        } catch (error) {
            setIsQuizModalOpen(false);
            toastConfig.error("Failed to start quiz generation");
        }
    };

    // Add new state for mindmap loading modal
    const [isMindmapLoading, setIsMindmapLoading] = useState(false);

    const handleCreateMindmap = async () => {
        setIsMindmapLoading(true);
        try {
            // Check if mindmap already exists in preloaded data
            if (note.mindmaps && note.mindmaps.length > 0) {
                setIsMindmapLoading(false);
                // Get the last created mindmap
                const lastMindmap = note.mindmaps[note.mindmaps.length - 1];
                router.visit(`/mindmaps/${lastMindmap.id}`);
                return;
            }

            // If no existing mindmap, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-mindmap`);
            if (response.data && response.data.mindmap) {
                const mindmapId = response.data.mindmap.id;
                toastConfig.success("Mindmap generation started");
                
                // Start polling for mindmap status
                const intervalId = setInterval(async () => {
                    try {
                        const mindmapResponse = await axios.get(`/api/mindmaps/${mindmapId}/status`);
                        const mindmapData = mindmapResponse.data;
                        
                        if (mindmapData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsMindmapLoading(false);
                            router.visit(`/mindmaps/${mindmapId}`);
                            
                        } else if (mindmapData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsMindmapLoading(false);
                            toastConfig.error("Mindmap generation failed");
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        console.log(error)
                        clearInterval(intervalId);
                        setIsMindmapLoading(false);
                        toastConfig.error("Failed to check mindmap generation status");
                    }
                }, 3000); // Poll every 3 seconds
            }
        } catch (error) {
            setIsMindmapLoading(false);
            toastConfig.error("Failed to generate mindmap");
        }
    };

    // Add new state for crossword loading modal
    const [isCrosswordLoading, setIsCrosswordLoading] = useState(false);

    const handleCreateCrossword = async () => {
        setIsCrosswordLoading(true);
        try {
            // Check if crossword already exists in preloaded data
            if (note.crosswords && note.crosswords.length > 0) {
                setIsCrosswordLoading(false);
                // Get the last created crossword
                const lastCrossword = note.crosswords[note.crosswords.length - 1];
                router.visit(`/crosswords/${lastCrossword.id}`);
                return;
            }

            // If no existing crossword, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-crossword`);
            if (response.data && response.data.crossword_id) {
                const crosswordId = response.data.crossword_id;
                toastConfig.success("Crossword generation started");
                
                // Start polling for crossword status
                const intervalId = setInterval(async () => {
                    try {
                        const crosswordResponse = await axios.get(`/crosswords/${crosswordId}/status`);
                        const crosswordData = crosswordResponse.data;
                        
                        if (crosswordData.status === 'completed') {
                            clearInterval(intervalId);
                            setIsCrosswordLoading(false);
                            router.visit(`/crosswords/${crosswordId}`);
                            
                        } else if (crosswordData.status === 'failed') {
                            clearInterval(intervalId);
                            setIsCrosswordLoading(false);
                            toastConfig.error("Crossword generation failed: " + (crosswordData.failure_reason || "Unknown error"));
                        }
                        // Continue polling if status is 'generating' or 'pending'
                    } catch (error) {
                        console.error('Error checking crossword status:', error);
                        clearInterval(intervalId);
                        setIsCrosswordLoading(false);
                        toastConfig.error("Failed to check crossword generation status");
                    }
                }, 3000); // Poll every 3 seconds
                
            }
        } catch (error) {
            console.error('Error creating crossword:', error);
            setIsCrosswordLoading(false);
            toastConfig.error("Failed to start crossword generation");
        }
    };


    const actions = [
        { 
            icon: Layers, 
            label: note.flashcard_sets && note.flashcard_sets.length > 0 ? t('review_flashcards') : t('create_flashcards'), 
            description: note.flashcard_sets && note.flashcard_sets.length > 0 ? t('review_study_cards') : t('generate_study_cards'),
            action: handleCreateFlashcards,
            color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-900 dark:text-white dark:border-transparent',
            loading: isFlashcardModalOpen
        },
        { 
            icon: Brain, 
            label: note.quizzes && note.quizzes.length > 0 ? t('review_quiz') : t('create_quiz'), 
            description: note.quizzes && note.quizzes.length > 0 ? t('review_knowledge_test') : t('test_knowledge_ai'),
            action: handleCreateQuizz,
            color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:text-white dark:border-transparent',
            loading: isQuizModalOpen
        },
        { 
            icon: Map, 
            label: note.mindmaps && note.mindmaps.length > 0 ? t('review_mindmap') : t('generate_mindmap'), 
            description: note.mindmaps && note.mindmaps.length > 0 ? t('review_concepts') : t('visualize_concepts'),
            action: handleCreateMindmap,
            color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:text-white dark:border-transparent',
            loading: isMindmapLoading
        },
        // { 
        //     icon: Grid3X3, 
        //     label: note.crosswords && note.crosswords.length > 0 ? t('review_crossword') : t('create_crossword'), 
        //     description: note.crosswords && note.crosswords.length > 0 ? t('review_crossword_puzzle') : t('generate_crossword_puzzle'),
        //     action: handleCreateCrossword,
        //     color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:text-white dark:border-transparent',
        //     loading: isCrosswordLoading
        // },
    ];


    
    const editor = useEditor({
        extensions: [
            StarterKit,
            DragHandle.configure({
                dragHandlePosition: "follow",
                dragHandleSpeed: 1
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
            }),
            MathExtension.configure({ evaluation: true, katexOptions: { macros: { "\\B": "\\mathbb{B}" } }, delimiters: "dollar" }),
        ],
        content: currentNote.content || '',
        editorProps: {
            handlePaste: (view, event, slice) => {
              const file = event.clipboardData?.files?.[0]
              if (file) uploadImage(file)
              return false
            },
            handleDrop: (view, event) => {
              const file = event.dataTransfer?.files?.[0]
              if (file) uploadImage(file)
              return false
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    // Sync editor content when currentNote changes (after processing)
    useEffect(() => {
        if (editor) {
            // Always update editor content when currentNote changes, especially after processing
            const newContent = currentNote.content || '';
            console.log('Syncing editor content:', { newContent, currentNoteStatus: currentNote.status });
            editor.commands.setContent(newContent);
            setContent(newContent);
        }
    }, [currentNote.content, currentNote.status, editor]);

    async function uploadImage(file : any) {
        const formData = new FormData()
        formData.append('file', file)
      
        const noteId = note.id;
    
        const res = await axios.post(`/api/notes/${noteId}/media`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        const { url } = await res.data;
        editor?.chain().focus().setImage({ src: url }).run()
    }


    // useEffect(() => {
    //     if (editor && note.content) {
    //       // parse your HTML as a paragraph node
    //       const wrapper = document.createElement('div');
    //       wrapper.innerHTML = note.content;
      
    //       const blocks = Array.from(wrapper.children).map((child) => ({
    //         type: 'sectionBlock',
    //         content: [{
    //           type: 'paragraph',
    //           content: [{ type: 'text', text: child.textContent || '' }],
    //         }],
    //       }));
      
    //       editor.commands.setContent({
    //         type: 'doc',
    //         content: blocks,
    //       });
    //     }
    //   }, [editor]);



    
    // Add useEffect for note status polling
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let timeoutId: NodeJS.Timeout;
        
        if (isProcessing) {
            const startTime = Date.now();
            const TIMEOUT_DURATION = 180000; // 3 minutes in milliseconds
            
            intervalId = setInterval(async () => {
                try {
                    // Check if 3 minutes have passed
                    if (Date.now() - startTime >= TIMEOUT_DURATION) {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(true);
                        
                        // Update note status to failed on the server
                        try {
                            await axios.patch(`/api/notes/${note.id}/status`, {
                                status: 'failed',
                                failure_reason: 'Processing timeout after 3 minutes'
                            });
                        } catch (updateError) {
                            console.error('Error updating note status to failed:', updateError);
                        }
                        
                        toastConfig.error("Note processing timed out and has been marked as failed");
                        return;
                    }
                    
                    const response = await axios.get(`/api/notes/${note.id}`);
                    const noteData = response.data;
                    
                    console.log('Polling result:', { status: noteData.status, hasContent: !!noteData.content });
                    
                    if (noteData.status === 'processed') {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(false); // Ensure failed state is cleared
                        setCurrentNote(noteData);
                        // Content will be updated by the separate useEffect
                        toastConfig.success("Note processing completed");
                        
                        // Open feedback modal after processing is complete
                        setTimeout(() => {
                            setFeedbackModalOpen(true);
                        }, 1000); // Small delay to let user see the success message
                        
                    } else if (noteData.status === 'failed') {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        setIsFailed(true);
                        setCurrentNote(noteData);
                        toastConfig.error("Note processing failed");
                    }
                    // Continue polling if status is still 'processing'
                } catch (error) {
                    console.error('Error checking note status:', error);
                    // Don't clear interval on error, continue polling
                }
            }, 3000); // Poll every 3 seconds
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isProcessing, note.id]);

    // Add useEffect for autosave
    useEffect(() => {
        // Only save if the editor is ready, content has changed (debounced), and not currently processing
        if (editor && debouncedContent !== currentNote.content && debouncedContent && !isProcessing) {
            router.patch(`/notes/${note.id}`, {
                content: debouncedContent,
                folder_id: selectedFolder,
                _method: 'PUT'
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Silent save - no toast notification
                },
                onError: (errors) => {
                    console.log(errors);
                    toastConfig.error("Failed to update note");
                }
            });
        }
    }, [debouncedContent, editor, currentNote.content, isProcessing, note.id, selectedFolder]);



    const handleDelete = () => {
        router.delete(`/notes/${note.id}`, {
            data: {
                delete_related_items: deleteRelatedItems
            },
            onSuccess: () => {
                toastConfig.success('Note deleted successfully');
                router.visit('/notes');
            },
            onError: () => {
                toastConfig.error('Failed to delete note');
            },
        });
    };


    return (
        <AppLayout>
            {/* Feedback Modal - Bottom Right Corner */}
            {feedbackModalOpen && (
                <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-black/5 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 max-w-sm">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('feedback_modal_title')}</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFeedbackModalOpen(false)}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubmitFeedback(true)}
                                className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-600/5"
                            >
                                <ThumbsUp className="h-4 w-4" />
                                {t('yes')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // For negative feedback, we might want to show the reason input
                                    setFeedbackModalOpen(false);
                                    // You can add a separate modal for detailed feedback if needed
                                    handleSubmitFeedback(false);
                                }}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-600/5"
                            >
                                <ThumbsDown className="h-4 w-4" />
                                {t('no')}
                            </Button>
                        </div>
                        
                        {/* Optional: Show reason input for negative feedback */}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('feedback_modal_subtitle')}
                        </div>
                    </div>
                </div>
            )}

            <Head title={`${currentNote.title}`} />
            
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t('select')}</h3>
                        <select 
                            className="w-full p-2 border rounded"
                            value={selectedFolder || ''}
                            onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">No folder</option>
                            {folders?.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>
                                {t('cancel')}
                            </Button>
                            <Button onClick={handleSaveFolder}>
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <div className="flex h-full bg-neutral-50/50 dark:bg-neutral-900/50">
                {/* Main Content */}
                <div className={`flex-1 p-4 sm:p-6 lg:p-8 ${isChatOpen ? 'mr-[400px]' : ''}`}>
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.visit('/dashboard')}
                                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-white"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {t('back')}
                                </Button>
                                <div className="hidden sm:block h-4 w-px bg-neutral-300" />
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {dayjs(currentNote.updated_at).fromNow()}
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-white">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>Auto-saved</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="text-xs ">
                                            {wordCount} {wordCount === 1 ? t('word') : t('words')}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setIsFolderModalOpen(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Folder className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t('folder')}</span>
                                    </Button>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                            <Switch
                                                checked={isPublic}
                                                onCheckedChange={(checked) => {
                                                    setIsPublic(checked);
                                                    // Update the note immediately when share is toggled
                                                    axios.patch(`/notes/${note.id}`, {
                                                        content,
                                                        folder_id: selectedFolder,
                                                        is_public: checked,
                                                        _method: 'PUT'
                                                    })
                                                    .then(() => {
                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                        setIsPublic(!checked); // Revert the state on error
                                                    });
                                                }}
                                            />
                                            <span className="hidden sm:inline">{t('public_sharing')}</span>
                                            <span className="sm:hidden">Public</span>
                                        </label>
                                        {isPublic && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyPublicLink}
                                                className="flex items-center gap-1 text-xs"
                                            >
                                                <Copy className="w-3 h-3" />
                                                <span className="hidden sm:inline">{t('copy_link')}</span>
                                                <span className="sm:hidden">Copy</span>
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Note
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>

                        {isFailed && note.content == null ? (
                            <ProcessingState state="failed" onRetry={handleRetryProcessing} />
                        ) : isProcessing ? (
                            <ProcessingState state="processing" />
                        ) : (
                            <>
                                {/* Title Section */}
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 leading-tight">
                                        {currentNote.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                        <span>{t('created')} {dayjs(currentNote.created_at).format('MMM DD, YYYY')}</span>
                                    </div>
                                </div>


                                <ValidationErrors errors={errors} />

                                {/* Audio Player Section */}
                                {currentNote.media && currentNote.media.filter(media => media.collection_name === 'note-audio').length > 0 && (
                                    <div className="mb-8">
                                        {currentNote.media
                                            .filter(media => media.collection_name === 'note-audio')
                                            .map((audioFile, index) => (
                                                <div key={audioFile.id} className="space-y-2">
                                                    {index > 0  && 
                                                        <>  
                                                            <Separator className="my-4" />
                                                            <div className="mt-4">
                                                                <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSubmitFeedback(true)}
                                                                    className="p-2 rounded-full bg-green-100 text-green-600"
                                                                >
                                                                    <ThumbsUp className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setFeedbackModalOpen(true)}
                                                                    className="p-2 rounded-full bg-red-100 text-red-600"
                                                                >
                                                                    <ThumbsDown className="w-5 h-5" />
                                                                </button>
                                                                </div>
                                                            
                                                            </div>
                                                        </>
                                                    }
                                                    <AudioPlayer
                                                        src={audioFile.original_url}
                                                        onPlay={e => console.log("onPlay")}
                                                        className="rounded-lg"
                                                        customAdditionalControls={[]}
                                                        showJumpControls={false}
                                                        showPlaybackRateControls={true}
                                                        playbackRates={[0.5, 1, 1.25, 1.5, 2]}
                                                        layout="horizontal-reverse"
                                                        style={{
                                                            backgroundColor: 'transparent',
                                                            boxShadow: 'none',
                                                            border: '1px solid rgb(229 231 235)',
                                                            borderRadius: '0.5rem',
                                                            '--rhap_theme-color': '#7c3aed',
                                                            '--rhap_bar-color': '#e5e7eb',
                                                            '--rhap_time-color': '#6b7280',
                                                            '--rhap_font-family': 'inherit',
                                                            '--rhap_main-controls-button-size': '32px',
                                                            '--rhap_button-height': '32px',
                                                            '--rhap_button-width': '32px',
                                                        } as React.CSSProperties}
                                                    />
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}


                                {/* AI Actions Section */}
                                <div className="mb-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                        {actions.map((action, index) => {
                                            const IconComponent = action.icon;
                                            return (
                                                <Card key={index} className={` py-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 word-break ${action.color}`}>
                                                    <CardContent className="p-2 sm:p-3 md:p-1">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full h-auto p-1 sm:p-2 flex items-start gap-2 sm:gap-3 md:gap-4 text-left hover:bg-transparent word-break overflow-visible whitespace-normal"
                                                            onClick={action.action}
                                                            disabled={action.loading}
                                                        >
                                                            <div className="flex-shrink-0 mt-1">
                                                                {action.loading ? (
                                                                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin" />
                                                                ) : (
                                                                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 word-break">
                                                                <div className="font-medium text-xs sm:text-sm md:text-base truncate overflow-hidden mb-1">
                                                                    {action.label}
                                                                </div>
                                                                <p className="text-xs opacity-75 leading-tight w-full ">
                                                                    {action.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex-shrink-0 mt-1">
                                                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 opacity-50" />
                                                            </div>
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="">
                                    
                                    {/* Editor Container */}
                                    <div className=" dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                                        {editor ? (
                                            <>
                                                <div className=" dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                    <TiptapToolbar editor={editor} />
                                                </div>
                                                <div className="p-6">
                                                    <EditorContent 
                                                        editor={editor} 
                                                        className="prose dark:prose-invert max-w-none min-h-[500px] focus:outline-none prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100 prose-p:text-neutral-700 dark:prose-p:text-neutral-300 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:ml-0" 
                                                        style={{
                                                            '--tw-prose-bullets': 'disc',
                                                        } as React.CSSProperties}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center p-12">
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                                                    <span className="text-neutral-600 dark:text-neutral-400">Loading editor...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleSubmitFeedback(true)}
                                            className="text-green-600 hover:bg-green-50"
                                        >
                                            <ThumbsUp className="w-4 h-4 mr-1" /> 
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleSubmitFeedback(false)}
                                            className="text-red-600 hover:bg-red-50"
                                        >
                                            <ThumbsDown className="w-4 h-4 mr-1" /> 
                                        </Button>
                                    </div>
                                </div>
                                {/* Editor Toolbar */}
                                
                            </>
                        )}

                    </div>
                </div>

                {/* Chat Sidebar */}
                {false && (
                    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-100 dark:bg-purple-900/30 w-8 h-8 rounded-full flex items-center justify-center">
                                    💬
                                </div>
                                <div>
                                    <h3 className="font-medium">Chat with this note</h3>
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">NEW!</span>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setIsChatOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="flex gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-500">Hi, I'm Cleverbot. Ask me anything about this note!</p>
                                </div>
                            </div>
                            {/* Add more messages here */}
                        </ScrollArea>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="relative">
                                <Input
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    placeholder="Type your question here"
                                    className="pr-24"
                                />
                                <Button 
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <p>This action cannot be undone. This will permanently delete your note.</p>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="deleteRelated"
                                    checked={deleteRelatedItems}
                                    onChange={(e) => setDeleteRelatedItems(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <label htmlFor="deleteRelated" className="text-sm text-gray-600 dark:text-gray-400">
                                    Also delete related items (flashcards, quizzes)
                                </label>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Loading Modals */}
            <LoadingModal 
                open={isFlashcardModalOpen} 
                type="flashcard" 
                title={t('loading_modal_creating_flashcards')}
                description={t('loading_modal_flashcard_description')}
            />
            <LoadingModal 
                open={isQuizModalOpen} 
                type="quiz" 
                title={t('loading_modal_generating_quiz')}
                description={t('loading_modal_quiz_description')}
            />
            <LoadingModal 
                open={isMindmapLoading} 
                type="mindmap" 
                title={t('loading_modal_building_mindmap')}
                description={t('loading_modal_mindmap_description')}
                onOpenChange={setIsMindmapLoading} 
            />

                  
        </AppLayout>
    );
}
