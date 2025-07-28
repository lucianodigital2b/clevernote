import React, { useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import InputError from '@/components/input-error';
import { toast } from 'sonner';
import { Users, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Create() {
    const { t } = useTranslation();
    const nameInput = useRef<HTMLInputElement>(null);
    
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        image: null as File | null
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.image) {
            formData.append('image', data.image);
        }

        post('/groups', {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Group created successfully!'));
                reset();
            },
            onError: (errors) => {
                if (errors.title) {
                    reset('title');
                    nameInput.current?.focus();
                }
                toast.error(t('Failed to create group'));
            },
        });
    };

    return (
        <AppLayout>
            <Head title={t('Create Group')} />
            
            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {t('Create Group')}
                    </h1>
                    <Button asChild variant="outline">
                        <Link href="/groups" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {t('Back to Groups')}
                        </Link>
                    </Button>
                </div>
                
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">{t('Group Title')}</Label>
                                <Input
                                    id="title"
                                    ref={nameInput}
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder={t('Enter group title')}
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('Description')}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder={t('Describe your group')}
                                    rows={4}
                                />
                                <InputError message={errors.description} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="image">{t('Group Image')} ({t('Optional')})</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                />
                                <InputError message={errors.image} />
                                <p className="text-sm text-muted-foreground">
                                    {t('Upload an image to represent your group')}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/groups">{t('Cancel')}</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('Creating...') : t('Create Group')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}