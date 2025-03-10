import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
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

export default function Note() {
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatMessage, setChatMessage] = useState('');

    const actions = [
        { icon: '🎯', label: 'Create quiz', action: () => console.log('Create quiz') },
        { icon: '📝', label: 'Create flashcards', action: () => console.log('Create flashcards') },
        { icon: '✏️', label: 'Edit note', action: () => console.log('Edit note') },
        { icon: '💬', label: 'Chat with note', action: () => setIsChatOpen(true) },
        { icon: '🌐', label: 'Translate', action: () => console.log('Translate') },
        { icon: '🎥', label: 'Create video', action: () => console.log('Create video') },
        { icon: '🗺️', label: 'Mindmap', action: () => console.log('Mindmap') },
    ];

    return (
        <AppLayout>
            <Head title="Note Details" />
            
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
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-semibold mb-4">Organização de Apontamentos em Markdown</h1>
                        
                        {/* Date */}
                        <div className="text-sm text-neutral-500 mb-6">Mar 9, 2023</div>

                        {/* Actions Grid */}
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

                        {/* Content */}
                        <div className="prose dark:prose-invert max-w-none">
                            <h2>Tópicos Importantes</h2>
                            <h3>Introdução</h3>
                            <p>Este texto é um exemplo ou teste para compreender a estrutura e formato esperados.</p>
                            
                            <h3>Objetivo</h3>
                            <p>Demonstrar como os apontamentos em markdown podem ser organizados.</p>
                            
                            <h3>Estrutura</h3>
                            {/* Add your note content here */}
                        </div>
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
        </AppLayout>
    );
}