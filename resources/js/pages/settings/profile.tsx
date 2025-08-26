import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useEffect, useState } from 'react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    subscriptions: initialSubscriptions = [],
    profilePictureUrl,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    subscriptions?: any[];
    profilePictureUrl?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    // Use the subscriptions from props instead of fetching via axios
    const [subscriptions, setSubscriptions] = useState<any[]>(initialSubscriptions);
    
    // Profile picture upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profilePictureUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setUploadError('Please select a JPEG, PNG, or WebP image.');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setUploadError('File size must be less than 2MB.');
            return;
        }

        setSelectedFile(file);
        setUploadError(null);
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('profile_picture', selectedFile);

        try {
            const response = await axios.post('/settings/profile/picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Reset form
            setSelectedFile(null);
            // Keep the preview URL as it should now be the uploaded image
        } catch (error: any) {
            setUploadError(error.response?.data?.message || 'Failed to upload profile picture.');
            // Reset preview to original
            setPreviewUrl(profilePictureUrl || null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete('/settings/profile/picture');
            setPreviewUrl(null);
            setSelectedFile(null);
        } catch (error) {
            setUploadError('Failed to delete profile picture.');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            // Call backend to cancel on Stripe
            const response = await axios.post(`/subscriptions/cancel/${id}`);
            if (response.data && response.data.success) {
                // If the backend returns ends_at, update it in the local state
                setSubscriptions(subs =>
                    subs.map(sub =>
                        sub.id === id
                            ? {
                                ...sub,
                                stripe_status: 'canceled',
                                ends_at: response.data.ends_at || sub.ends_at,
                            }
                            : sub
                    )
                );
            } else {
                alert('Failed to cancel subscription.');
            }
        } catch (error) {
            alert('Failed to cancel subscription.');
        }
    };

    const handleResume = async (id: string) => {
        try {
            const response = await axios.post(`/subscriptions/resume/${id}`);
            if (response.data && response.data.success) {
                setSubscriptions(subs =>
                    subs.map(sub =>
                        sub.id === id
                            ? {
                                ...sub,
                                stripe_status: response.data.stripe_status,
                                ends_at: response.data.ends_at,
                            }
                            : sub
                    )
                );
            } else {
                alert('Failed to resume subscription.');
            }
        } catch (error) {
            alert('Failed to resume subscription.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <HeadingSmall title="Profile Picture" description="Upload and manage your profile picture" />
                        
                        <div className="flex items-start gap-6">
                            {/* Profile Picture Preview */}
                            <div className="flex-shrink-0">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Profile picture"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">No image</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Upload Controls */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <Input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="mb-2"
                                    />
                                    <p className="text-sm text-gray-600">
                                        Upload a JPEG, PNG, or WebP image. Max size: 2MB.
                                    </p>
                                </div>
                                
                                {uploadError && (
                                    <p className="text-sm text-red-600">{uploadError}</p>
                                )}
                                
                                <div className="flex gap-2">
                                    {selectedFile && (
                                        <Button
                                            onClick={handleUpload}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? 'Uploading...' : 'Upload'}
                                        </Button>
                                    )}
                                    
                                    {previewUrl && (
                                        <Button
                                            variant="outline"
                                            onClick={handleDelete}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <HeadingSmall title="Profile information" description="Update your name and email address" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification email.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
                <div className="space-y-6">
                    {/* Subscription Section */}
                    <div>
                        <HeadingSmall title="Your Subscriptions" description="Manage your active subscriptions" />
                        <div>
                            {subscriptions.length === 0 && <p>No subscriptions found.</p>}
                            {subscriptions.map(sub => (
                                <div key={sub.id} className="border p-4 rounded mb-2">
                                    <div>
                                        <strong>{sub.name}</strong> - Status: {sub.stripe_status}
                                    </div>
                                    {/* Only show cancel if subscription is active and not scheduled to end */}
                                    {sub.stripe_status === 'active' && !sub.ends_at && (
                                        <Button onClick={() => handleCancel(sub.id)}>Cancel</Button>
                                    )}
                                    {/* Show banner if ends_at is set */}
                                    {sub.ends_at && (
                                        <div className="bg-yellow-100 text-yellow-800 p-2 rounded mt-2 flex items-center gap-4">
                                            <span>
                                                Subscription canceled. You have access until {new Date(sub.ends_at).toLocaleDateString()}.
                                            </span>
                                            {/* Show Resume button if subscription is canceled and can be resumed */}
                                            {sub.stripe_status === 'canceled' && (
                                                <Button variant="outline" onClick={() => handleResume(sub.id)}>
                                                    Resume
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
