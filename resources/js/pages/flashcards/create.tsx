import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { FlashcardEditor } from '@/components/flashcard-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Create() {
    const { post, processing } = useForm();

    const handleSubmit = (data: any) => {
        post(route('flashcards.store'), {
            data,
            onSuccess: () => {
                // Optionally handle success, like showing a notification
            },
        });
    };

    const handleCancel = () => {
        window.history.back(); // Or redirect using Inertia.visit
    };

    return (
        <AppLayout>
            <Head title="Create Flashcard" />

            <div className="container mx-auto py-6 px-4">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Create New Flashcard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FlashcardEditor
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