import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useCreateNote() {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const props = usePage().props;

    const createNote = async (type: string, data: {
        title?: string;
        folder_id: string;
        audio_file?: File | Blob;
        pdf_file?: File;
        link?: string;
        language?: string;
    }) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();

            if (data.title) formData.append('title', data.title);

            if (data.link) formData.append('link', data.link);
            
            formData.append('folder_id', data.folder_id);
            formData.append('type', type);

            if (data.language) formData.append('language', data.language);
            
            if ((type === 'record' || type === 'audio') && data.audio_file) {
                formData.append('audio_file', data.audio_file);
            } else if (type === 'pdf' && data.pdf_file) {
                formData.append('pdf_file', data.pdf_file);
            }

            router.post('/notes', formData, {
                forceFormData: true,
                onProgress: (progress: any) => {
                    setUploadProgress(Math.round(progress.percentage));
                },
                onError: (error: any) => {
                    console.error('Failed to create note:', error); 
                },
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['notes'] });
                },
                onFinish: () => {
                    setIsUploading(false);
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to create note:', error);
            setIsUploading(false);
            return false;
        }
    };

    return {
        createNote,
        isUploading,
        uploadProgress
    };
}