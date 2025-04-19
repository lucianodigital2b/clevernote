import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { FlashcardEditor } from '@/components/flashcard-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Folder } from '@/types'; // Import Folder type

interface Props {
    folder: Folder; // Add folder prop
}

export default function Create({ folder }: Props) {
    const { post, processing } = useForm();

    const handleSubmit = (data: any) => {
        // Ensure folder_id is included in the data being sent
        const submitData = { ...data, folder_id: folder.id };
        post(route('folders.flashcards.store', { folder: folder.id }), {
            data: submitData,
            onSuccess: () => {
                // Optionally handle success
            },
        });
    };

    const handleCancel = () => {
        window.history.back(); // Or use Inertia.visit to go back to the folder's flashcard list
        // Inertia.visit(route('folders.flashcards.index', { folder: folder.id }));
    };

    return (
        <AppLayout>
            <Head title={`Create Flashcard in ${folder.name}`} />

            <div className="container mx-auto py-6 px-4">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Create New Flashcard</CardTitle>
                        <CardDescription>Adding flashcard to folder: "{folder.name}"</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FlashcardEditor
                            folder={folder} // Pass the folder context
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            processing={processing}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}