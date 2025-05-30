import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import InputError from '@/components/input-error';
import { toast } from 'sonner';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import { Flashcard } from '@/types';


export default function Create() {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    
    const fetchFlashcards = async () => {
        try {
            const response = await axios.get(`/flashcards?page=${page}`);
            const newFlashcards = response.data.data;
            console.log(newFlashcards);
            
            setFlashcards(prev => [...prev, ...newFlashcards]);
            setHasMore(response.data.current_page < response.data.last_page);
            setPage(prev => prev + 1);
        } catch (error) {
            console.error('Error fetching flashcards:', error);
        }
    };
    
    // Add useEffect to fetch flashcards on component mount
    useEffect(() => {
        fetchFlashcards();
    }, []);
    
    const nameInput = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: '',
        flashcard_ids: [] as number[]
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/flashcard-sets', {
            ...data,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Flashcard set created successfully');
                reset();
            },
            onError: (errors) => {
                if (errors.name) {
                    reset('name');
                    nameInput.current?.focus();
                }
                toast.error('Failed to create flashcard set');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Flashcard Set" />
            
            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Create Flashcard Set</h1>
                    <Button asChild variant="outline">
                        <Link href="/flashcard-sets">Back to Sets</Link>
                    </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                ref={nameInput}
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-2">
                            <Label>Select Flashcards</Label>
                            <InfiniteScroll
                                dataLength={flashcards.length}
                                next={fetchFlashcards}
                                hasMore={hasMore}
                                loader={<div className="flex justify-center py-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div></div>}
                                className="max-h-96 overflow-y-auto border rounded-md p-2 space-y-2"
                            >
                                {flashcards.map(flashcard => (
                                    <label htmlFor={`flashcard-${flashcard.id}`} key={flashcard.id} className="flex items-center space-x-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`flashcard-${flashcard.id}`}
                                            checked={data.flashcard_ids.includes(flashcard.id)}
                                            onChange={() => {
                                                setData('flashcard_ids', 
                                                    data.flashcard_ids.includes(flashcard.id)
                                                        ? data.flashcard_ids.filter(id => id !== flashcard.id)
                                                        : [...data.flashcard_ids, flashcard.id]
                                                );
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <div className="flex flex-col ml-2">
                                            <div className="font-medium">{flashcard.question}</div>
                                            <div className="text-sm text-neutral-500 dark:text-neutral-400">{flashcard.answer}</div>
                                        </div>
                                    </label>
                                ))}
                            </InfiniteScroll>
                        </div>
                        
                    </div>


                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Set'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}