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
}: {
    mustVerifyEmail: boolean;
    status?: string;
    subscriptions?: any[];
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
