import { useState, useEffect } from 'react';
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
import { Share, MoreHorizontal, Maximize2, X } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Note } from '@/types';
import { toastConfig } from '@/lib/toast';
import dayjs from 'dayjs';
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

export default function Edit({ note }: { note: Note }) {

    const { errors } = usePage().props;
    
    // Add state for processing status and polling
    const [isProcessing, setIsProcessing] = useState(note.status === 'processing');
    const [currentNote, setCurrentNote] = useState(note);
    const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

    const handleUpdate = () => {
        router.patch(`/notes/${note.id}`, {
            title: note.title,
            content: content,
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

    const renderFolderModal = () => (
        <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
            <DialogContent>
                <h3 className="text-lg font-medium mb-4">Select Folder</h3>
                <div className="space-y-4">
                    <select 
                        className="w-full p-2 border rounded"
                        value={selectedFolder || ''}
                        onChange={(e) => setSelectedFolder(e.target.value ? parseInt(e.target.value) : null)}
                    >
                        <option value="">No folder</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
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
    );

    // Add this new state
    const [isActionsVisible, setIsActionsVisible] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatMessage, setChatMessage] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [content, setContent] = useState(note.content);

    const debouncedContent = useDebounce(content, 1000); // Debounce content by 1 second

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
        { icon: '📝', label: 'Create flashcards', action: handleCreateFlashcards },
        { icon: '❓', label: 'Create a quiz', action: handleCreateQuizz },
        { icon: '🗺️', label: 'Mindmap', action: handleCreateMindmap },
        // { icon: '💬', label: 'Chat with note', action: () => setIsChatOpen(true) },
        // { icon: '🌐', label: 'Translate', action: () => console.log('Translate') },
        // { icon: '🎥', label: 'Create video', action: () => console.log('Create video') },
    ];


    
    const editor = useEditor({
        extensions: [
            StarterKit, 
            DragHandle, 
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
        let intervalId: NodeJS.Timeout;

        if (isProcessing) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axios.get(`/api/notes/${note.id}`);
                    const updatedNote = response.data;
                    
                    if (updatedNote.status !== 'processing') {
                        setIsProcessing(false);
                        setCurrentNote(updatedNote);
                        if (editor) {
                            editor.commands.setContent(updatedNote.content);
                        }
                        setContent(updatedNote.content);
                        clearInterval(intervalId);
                    }
                } catch (error) {
                    console.error('Error checking note status:', error);
                    clearInterval(intervalId);
                    setIsProcessing(false);
                    toastConfig.error('Failed to check note status');
                }
            }, 3000); // Poll every 3 seconds

            setPollingIntervalId(intervalId);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            } else if (pollingIntervalId) { // Clear interval on component unmount
                clearInterval(pollingIntervalId);
            }
        };
    }, [isProcessing, note.id, editor, pollingIntervalId]);

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
            
            <div className="flex h-full">
                {/* Main Content */}
                <div className={`flex-1 p-6 ${isChatOpen ? 'mr-[400px]' : ''}`}>
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <span>Notes</span>
                                <span>/</span>
                                <span>Note details</span>
                            </div>
                            


                            <div className="flex items-center gap-2">

                                {/* <Button 
                                    variant="outline" 
                                    className="flex items-center gap-2"
                                >
                                    <Share className="h-4 w-4" />
                                    Share or export
                                </Button> */}
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsFolderModalOpen(true)}>Add to folder</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {isProcessing ? (
                            <div className="flex flex-col items-center justify-center min-h-[500px]">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">Processing note content...</p>
                                <p className="text-sm text-neutral-500">This may take a few moments.</p>
                            </div>
                        ) : (
                            <>
                                {/* Title */}
                                <h1 className="text-2xl font-semibold mb-4">{currentNote.title}</h1>
                                
                                {/* Date */}
                                <div className="text-sm text-neutral-500 mb-6">
                                    {dayjs(currentNote.created_at).format('DD MMM YYYY, hh:mm A')}
                                </div>


                                <ValidationErrors errors={errors} />

                                {/* Toggle Button */}
                                {/* <Button
                                    variant="outline"
                                    onClick={() => setIsActionsVisible(!isActionsVisible)}
                                    className="mb-4"
                                >
                                    {isActionsVisible ? 'Hide Actions' : 'Show Actions'}
                                </Button> */}

                                {/* Actions Grid with animation */}
                                <div className={`transition-all duration-300 ease-in-out ${isActionsVisible ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                        {actions.map((action, index) => (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                className="flex items-center gap-2 justify-start p-4 h-auto"
                                                onClick={action.action}
                                                disabled={isProcessing} // Disable actions while processing
                                            >
                                                <span className="text-lg">{action.icon}</span>
                                                <span>{action.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="">
                                    <div className="border-b border-neutral-200 dark:border-neutral-800 -mx-6 mb-6" />
                                    
                                    {/* Markdown Editor */}
                                    {editor ? (
                                        <>
                                            <TiptapToolbar editor={editor} />
                                            <EditorContent editor={editor} className="prose dark:prose-invert max-w-none min-h-[500px] focus:outline-none" />
                                        </>
                                    ) : (
                                        <p>Loading editor...</p>
                                    )}
                                    
                                    {/* Save Button */}
                                    {/* <div className="mt-6 flex justify-end">
                                        <Button
                                            onClick={handleUpdate}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                            disabled={isProcessing} // Disable save button while processing
                                        >
                                            Save Changes
                                        </Button>
                                    </div> */}
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
            
            {/* Spinner Modal for Flashcard Generation */}
            <Dialog open={isFlashcardModalOpen}>
                <DialogContent className="flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <div className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                            Generating flashcards...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Add Quiz Generation Modal */}
            <Dialog open={isQuizModalOpen}>
                <DialogContent className="flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <div className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                            Generating quiz...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Add this before the closing AppLayout tag */}
            <Dialog open={isMindmapLoading} onOpenChange={setIsMindmapLoading}>
                <DialogContent className="sm:max-w-[425px]">
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <h3 className="text-lg font-medium text-center">Generating Mindmap</h3>
                        <p className="text-sm text-neutral-500 text-center mt-2">
                            Please wait while we generate your mindmap...
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
