import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Flashcard, Folder } from '@/types';

interface FlashcardEditorProps {
    flashcard?: Flashcard | null; // Optional flashcard data for editing
    folder?: Folder | null; // Optional folder context
    onSubmit: (data: any) => void; // Function to handle form submission
    onCancel: () => void; // Function to handle cancellation
    processing: boolean; // Form processing state
}

export const FlashcardEditor: React.FC<FlashcardEditorProps> = ({ flashcard, folder, onSubmit, onCancel, processing }) => {
    const { data, setData, errors, reset } = useForm({
        front: flashcard?.front || '',
        back: flashcard?.back || '',
        details: flashcard?.details || '',
        folder_id: folder?.id || flashcard?.folder_id || null, // Pre-fill folder_id if available
    });

    useEffect(() => {
        // Reset form if flashcard data changes (e.g., switching between edit/create)
        reset({
            front: flashcard?.front || '',
            back: flashcard?.back || '',
            details: flashcard?.details || '',
            folder_id: folder?.id || flashcard?.folder_id || null,
        });
    }, [flashcard, folder, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="front">Front</Label>
                <Textarea
                    id="front"
                    value={data.front}
                    onChange={(e) => setData('front', e.target.value)}
                    className="mt-1 block w-full"
                    required
                    rows={3}
                />
                <InputError message={errors.front} className="mt-2" />
            </div>

            <div>
                <Label htmlFor="back">Back</Label>
                <Textarea
                    id="back"
                    value={data.back}
                    onChange={(e) => setData('back', e.target.value)}
                    className="mt-1 block w-full"
                    required
                    rows={3}
                />
                <InputError message={errors.back} className="mt-2" />
            </div>

            <div>
                <Label htmlFor="details">Details (Optional)</Label>
                <Textarea
                    id="details"
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    className="mt-1 block w-full"
                    rows={5}
                />
                <InputError message={errors.details} className="mt-2" />
            </div>

            {/* Hidden input for folder_id if creating within a folder */}
            {folder && (
                <input type="hidden" name="folder_id" value={data.folder_id ?? ''} />
            )}

            {/* TODO: Add Folder Selection Dropdown if creating globally */} 
            {/* {!folder && !flashcard?.folder_id && (
                <div>
                    <Label htmlFor="folder_id">Folder (Optional)</Label>
                    <Select onValueChange={(value) => setData('folder_id', value ? parseInt(value) : null)} defaultValue={data.folder_id?.toString() ?? ''}>
                        <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {/* Map through available folders */}
                            {/* Example: folders.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>) */}
                        {/* </SelectContent>
                    </Select>
                    <InputError message={errors.folder_id} className="mt-2" />
                </div>
            )} */}

            <div className="flex items-center justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : (flashcard ? 'Update Flashcard' : 'Create Flashcard')}
                </Button>
            </div>
        </form>
    );
};