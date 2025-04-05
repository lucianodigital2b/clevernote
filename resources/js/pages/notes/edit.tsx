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

export default function Edit({ note }: { note: Note }) {

    const { errors } = usePage().props;
    
    const handleUpdate = () => {
        router.patch(`/notes/${note.id}`, {
            title: note.title,
            content: content,
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

    // Add this new state
    const [isActionsVisible, setIsActionsVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatMessage, setChatMessage] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [content, setContent] = useState(note.content);

    const actions = [
        { icon: '🎯', label: 'Create quiz', action: () => console.log('Create quiz') },
        { icon: '📝', label: 'Create flashcards', action: () => console.log('Create flashcards') },
        { icon: '💬', label: 'Chat with note', action: () => setIsChatOpen(true) },
        { icon: '🌐', label: 'Translate', action: () => console.log('Translate') },
        { icon: '🎥', label: 'Create video', action: () => console.log('Create video') },
        { icon: '🗺️', label: 'Mindmap', action: () => console.log('Mindmap') },
    ];

    const handleDelete = () => {
        router.delete(`/notes/${note.id}`, {
            onSuccess: () => {
                // Redirect to notes list after successful deletion
                router.visit('/notes');
            },
        });
    };

    // In the return statement, add this before the closing div of the content section
    <div className="mt-6 flex justify-end">
        <Button 
            onClick={handleUpdate}
            className="bg-purple-600 hover:bg-purple-700"
        >
            Save Changes
        </Button>
    </div>

    return (
        <AppLayout>
            <Head title={`${note.title} - Note`} />
            
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

                                <Button 
                                    variant="outline" 
                                    className="flex items-center gap-2"
                                >
                                    <Share className="h-4 w-4" />
                                    Share or export
                                </Button>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Add to folder</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-semibold mb-4">{note.title}</h1>
                        
                        {/* Date */}
                        <div className="text-sm text-neutral-500 mb-6">
                            {dayjs(note.created_at).format('DD MMM YYYY, hh:mm A')}
                        </div>


                        <ValidationErrors errors={errors} />

                        {/* Toggle Button */}
                        <Button
                            variant="outline"
                            onClick={() => setIsActionsVisible(!isActionsVisible)}
                            className="mb-4"
                        >
                            {isActionsVisible ? 'Hide Actions' : 'Show Actions'}
                        </Button>

                        {/* Actions Grid with animation */}
                        <div className={`transition-all duration-300 ease-in-out ${isActionsVisible ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className="flex items-center gap-2 justify-start p-4 h-auto"
                                        onClick={action.action}
                                    >
                                        <span className="text-lg">{action.icon}</span>
                                        <span>{action.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
                            <Input
                                value={note.title}
                                onChange={(e) => {/* Handle title update */}}
                                className="text-2xl font-semibold border-0 px-0 mb-4 focus-visible:ring-0"
                                placeholder="Note title"
                            />
                            <div className="border-b border-neutral-200 dark:border-neutral-800 -mx-6 mb-6" />
                            
                            {/* Markdown Editor */}
                            <div className="prose dark:prose-invert max-w-none">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-[500px] bg-transparent border-0 focus:ring-0 resize-none font-mono"
                                    placeholder="Write your markdown here..."
                                />
                            </div>
                            
                            {/* Save Button */}
                            <div className="mt-6 flex justify-end">
                                <Button 
                                    onClick={handleUpdate}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                        {/* Editor Toolbar */}
                        

                    </div>
                </div>

                {/* Chat Sidebar */}
                {isChatOpen && (
                    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
                        {/* Chat Header */}
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

                        {/* Chat Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-500">Hi, I'm Coco bot. Ask me anything about this note!</p>
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
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your note.
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
        </AppLayout>
    );
}