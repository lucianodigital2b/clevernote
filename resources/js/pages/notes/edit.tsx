import { router, Head, usePage } from '@inertiajs/react';
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
import { Share, MoreHorizontal, Maximize2, X, ArrowLeft, Save, Clock, CheckCircle2, Folder, Trash2, Sparkles, Brain, Map, FileText, Loader2, ChevronRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    const { t } = useTranslation();
    const { errors } = usePage().props;
    
    // Add state for processing status and polling
    const [isProcessing, setIsProcessing] = useState(note.status === 'processing');
    const [isFailed, setIsFailed] = useState(note.status === 'failed');
    const [currentNote, setCurrentNote] = useState(note);
    const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
    
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
    


    const handleUpdate = () => {
        router.patch(`/notes/${note.id}`, {
            content,
            folder_id: selectedFolder,
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

    // Add this function near your other handlers
    const handleRetryProcessing = async () => {
        try {
            setIsFailed(false);
            setIsProcessing(true);
            
            const response = await axios.post(`/notes/${note.id}/retry`);
            
            if (response.data.message) {
                toastConfig.success('Processing retry initiated');
            }
        } catch (error) {
            console.error('Error retrying processing:', error);
            setIsFailed(true);
            setIsProcessing(false);
            toastConfig.error('Failed to retry processing');
        }
    };

    // Add this new state
    const [isActionsVisible, setIsActionsVisible] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [content, setContent] = useState(note.content);

    // Calculate word count from current content using useMemo for real-time updates
    const wordCount = useMemo(() => {
        return getWordCount(content || note.content);
    }, [content, note.content]);

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
                router.visit(`/flashcard-sets/${note.flashcard_sets[0].id}`);
                return;
            }

            // If no existing flashcard set, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-flashcards`);
            if (response.data && response.data.flashcardSetId) {
                setIsFlashcardModalOpen(false);
                router.visit(`/flashcard-sets/${response.data.flashcardSetId}/study`);
            }
        } catch (error) {
            setIsFlashcardModalOpen(false);
            toastConfig.error("Failed to generate flashcards");
        }
    };


    // Add new state for quiz generation
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(note.folder_id || null);
    const [folders, setFolders] = useState<Array<{id: number; name: string}>>([]);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    
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
                router.visit(`/quizzes/${note.quizzes[0].id}`);
                return;
            }

            // If no existing quiz, create a new one
            const response = await axios.post(`/quizzes/generate-from-note/${note.id}`);
            if (response.data) {
                setIsQuizModalOpen(false);
                router.visit(`/quizzes/${response.data.quiz.id}`);
                toastConfig.success("Quiz generated successfully");
            }
        } catch (error) {
            setIsQuizModalOpen(false);
            toastConfig.error("Failed to generate quiz");
        }
    };

    // Add new state for mindmap loading modal
    const [isMindmapLoading, setIsMindmapLoading] = useState(false);

    const handleCreateMindmap = async () => {
        setIsMindmapLoading(true);
        try {
            // Check if mindmap already exists in preloaded data
            if (note.mindmaps && note.mindmaps.length > 0) {
                router.visit(`/mindmaps/${note.mindmaps[0].id}`);
                return;
            }

            // If no existing mindmap, create a new one
            const response = await axios.post(`/notes/${note.id}/generate-mindmap`);
            if (response.data && response.data.mindmap) {
                router.visit(`/mindmaps/${response.data.mindmap.id}`);
                toastConfig.success("Mindmap generated successfully");
            }
        } catch (error) {
            toastConfig.error("Failed to generate mindmap");
        } finally {
            setIsMindmapLoading(false);
        }
    };

    const actions = [
        { 
            icon: FileText, 
            label: t('create_flashcards'), 
            description: t('generate_study_cards'),
            action: handleCreateFlashcards,
            color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-900',
            loading: isFlashcardModalOpen
        },
        { 
            icon: Brain, 
            label: t('create_quiz'), 
            description: t('test_knowledge_ai'),
            action: handleCreateQuizz,
            color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
            loading: isQuizModalOpen
        },
        { 
            icon: Map, 
            label: t('generate_mindmap'), 
            description: t('visualize_concepts'),
            action: handleCreateMindmap,
            color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
            loading: isMindmapLoading
        },
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
        content: note.content,
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


    // Add useEffect for polling mechanism
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isProcessing) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axios.get(`/api/notes/${note.id}`);
                    const updatedNote = response.data;
                    
                    if (updatedNote.status !== 'processing') {
                        clearInterval(intervalId);
                        setIsProcessing(false);
                        
                        if (updatedNote.status === 'failed') {
                            setIsFailed(true);
                        } else {
                            setIsFailed(false);
                            setCurrentNote(updatedNote);
                            if (editor) {
                                editor.commands.setContent(updatedNote.content);
                            }
                            setContent(updatedNote.content);
                        }
                    }
                } catch (error) {
                    console.error('Error checking note status:', error);
                    clearInterval(intervalId);
                    setIsProcessing(false);
                    setIsFailed(true);
                    toastConfig.error('Failed to check note status');
                }
            }, 3000); // Poll every 3 seconds
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isProcessing, note.id, editor]);
    
    // Add useEffect for autosave
    useEffect(() => {
        // Only save if the editor is ready, content has changed (debounced), and not currently processing
        if (editor && debouncedContent !== note.content && !isProcessing) {
            handleUpdate();
        }
    }, [debouncedContent, editor, isProcessing, note.content]);



    const [deleteRelatedItems, setDeleteRelatedItems] = useState(false);

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

    // In the return statement, add this before the closing div of the content section
    // <div className="mt-6 flex justify-end">
    //     <Button
    //         onClick={handleUpdate}
    //         className="bg-purple-600 hover:bg-purple-700"
    //     >
    //         Save Changes
    //     </Button>
    // </div>

    return (
        <AppLayout>
            <Head title={`${currentNote.title} - Note`} />
            
            <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Select Folder</h3>
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
                                Cancel
                            </Button>
                            <Button onClick={handleSaveFolder}>
                                Save
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
                            
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-white">
                                    {!isProcessing && (
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span>Auto-saved</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Badge variant="secondary" className="text-xs ">
                                            {wordCount} {wordCount === 1 ? t('word') : t('words')}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsFolderModalOpen(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Folder className="h-4 w-4" />
                                    <span className="hidden sm:inline">Folder</span>
                                </Button>
                                
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

                        {isProcessing ? (
            <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
                <CardContent className="flex flex-col items-center justify-center min-h-[500px] p-12">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Processing your note
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-1">
                            Our AI is analyzing and enhancing your content
                        </p>
                        <p className="text-sm text-neutral-500">
                            This usually takes 30-60 seconds
                        </p>
                    </div>
                </CardContent>
            </Card>
        ) : isFailed ? (
            <Card className="border-2 border-dashed border-red-200 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="flex flex-col items-center justify-center min-h-[500px] p-12">
                    <div className="relative">
                        <div className="rounded-full h-16 w-16 bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Processing failed
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                            We encountered an error while processing your note. This could be due to content complexity or a temporary service issue.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                                onClick={handleRetryProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Brain className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            
                        </div>
                        <p className="text-xs text-neutral-500 mt-4">
                            If this problem persists, please contact support
                        </p>
                    </div>
                </CardContent>
            </Card>
        ) : (
                            <>
                                {/* Title Section */}
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-3 leading-tight">
                                        {currentNote.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                        <span>Created {dayjs(currentNote.created_at).format('MMM DD, YYYY')}</span>
                                        <span>•</span>
                                        <span>Last updated {dayjs(currentNote.updated_at).fromNow()}</span>
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
                                                    {index > 0 && <Separator className="my-4" />}
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
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="h-5 w-5 text-purple-600" />
                                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                            AI-Powered Study Tools
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                        {actions.map((action, index) => {
                                            const IconComponent = action.icon;
                                            return (
                                                <Card key={index} className={` py-2 transition-all duration-200 cursor-pointer hover:shadow-md word-break ${action.color}`}>
                                                    <CardContent className="p-2 sm:p-3 md:p-1">
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full h-auto p-1 sm:p-2 flex items-start gap-2 sm:gap-3 md:gap-4 text-left hover:bg-transparent word-break overflow-visible whitespace-normal"
                                                            onClick={action.action}
                                                            disabled={isProcessing || action.loading}
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
                                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                                        {editor ? (
                                            <>
                                                <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                    <TiptapToolbar editor={editor} />
                                                </div>
                                                <div className="p-6">
                                                    <EditorContent 
                                                        editor={editor} 
                                                        className="prose dark:prose-invert max-w-none min-h-[500px] focus:outline-none prose-headings:text-neutral-900 dark:prose-headings:text-neutral-100 prose-p:text-neutral-700 dark:prose-p:text-neutral-300" 
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
            
            {/* Enhanced Loading Modals */}
            <Dialog open={isFlashcardModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Creating Flashcards
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                AI is analyzing your note to create study cards
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isQuizModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Generating Quiz
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Creating intelligent questions from your content
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isMindmapLoading} onOpenChange={setIsMindmapLoading}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Map className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Building Mindmap
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Mapping concepts and connections visually
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
