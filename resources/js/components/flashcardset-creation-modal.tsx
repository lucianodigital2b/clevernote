import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from '@inertiajs/react';
import InputError from './input-error';
import { toast } from 'sonner';

interface FlashcardCreationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const FlashcardCreationModal: React.FC<FlashcardCreationModalProps> = ({ open, onOpenChange }) => {
    const nameInput = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, reset, errors, recentlySuccessful } = useForm({
        name: '',
        description: ''
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset('name', 'description');
        }
        onOpenChange(open);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post('/flashcard-sets', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Flashcard set created successfully');
                reset();
                onOpenChange(false);
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Flashcard Set</DialogTitle>
                    <DialogDescription>
                        Create a new set of flashcards to study.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="">
                                Name
                            </Label>
                            <Input
                                id="name"
                                ref={nameInput}
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="col-span-3"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                className="col-span-3"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Set'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FlashcardCreationModal;