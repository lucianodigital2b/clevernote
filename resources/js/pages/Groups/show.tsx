import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InputError from '@/components/input-error';
import { toast } from 'sonner';
import { Users, Settings, UserPlus, ArrowLeft, Edit, Trash2, Crown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface Group {
    id: number;
    title: string;
    description: string;
    image?: string;
    created_at: string;
    updated_at: string;
    members: User[];
    owner: User;
    is_owner: boolean;
}

interface Props {
    group: Group;
}

export default function Show({ group }: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    
    const { data, setData, put, processing, errors } = useForm({
        title: group.title,
        description: group.description,
        image: null as File | null
    });

    const { data: inviteData, setData: setInviteData, post: postInvite, processing: inviteProcessing, reset: resetInvite, errors: inviteErrors } = useForm({
        email: ''
    });

    const handleUpdate = (event: React.FormEvent) => {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        if (data.image) {
            formData.append('image', data.image);
        }
        formData.append('_method', 'PUT');

        router.post(`/groups/${group.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Group updated successfully!'));
            },
            onError: () => {
                toast.error(t('Failed to update group'));
            },
        });
    };

    const handleInvite = (event: React.FormEvent) => {
        event.preventDefault();
        
        postInvite(`/groups/${group.id}/invite`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('Invitation sent successfully!'));
                resetInvite();
            },
            onError: () => {
                toast.error(t('Failed to send invitation'));
            },
        });
    };

    const handleRemoveMember = (userId: number) => {
        if (confirm(t('Are you sure you want to remove this member?'))) {
            router.delete(`/groups/${group.id}/members/${userId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t('Member removed successfully!'));
                },
                onError: () => {
                    toast.error(t('Failed to remove member'));
                },
            });
        }
    };

    const handleDeleteGroup = () => {
        if (confirm(t('Are you sure you want to delete this group? This action cannot be undone.'))) {
            router.delete(`/groups/${group.id}`, {
                onSuccess: () => {
                    toast.success(t('Group deleted successfully!'));
                },
                onError: () => {
                    toast.error(t('Failed to delete group'));
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title={`Group: ${group.title}`} />
            
            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {group.title}
                    </h1>
                    <Button asChild variant="outline">
                        <Link href="/groups" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {t('Back to Groups')}
                        </Link>
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
                        <TabsTrigger value="members">{t('Members')} ({group.members.length})</TabsTrigger>
                        {group.is_owner && <TabsTrigger value="settings">{t('Settings')}</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Group Information')}</CardTitle>
                                <CardDescription>{t('Details about this group')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {group.image && (
                                    <div className="w-32 h-32 rounded-lg overflow-hidden">
                                        <img 
                                            src={group.image} 
                                            alt={group.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-lg">{group.title}</h3>
                                    <p className="text-muted-foreground mt-2">{group.description}</p>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{t('Created')}: {new Date(group.created_at).toLocaleDateString()}</span>
                                    <span>{t('Members')}: {group.members.length}</span>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Crown className="h-3 w-3" />
                                        {t('Owner')}: {group.owner.name}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-6">
                        {group.is_owner && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        {t('Invite Members')}
                                    </CardTitle>
                                    <CardDescription>{t('Send an invitation to join this group')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleInvite} className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="email"
                                                placeholder={t('Enter email address')}
                                                value={inviteData.email}
                                                onChange={e => setInviteData('email', e.target.value)}
                                                required
                                            />
                                            <InputError message={inviteErrors.email} />
                                        </div>
                                        <Button type="submit" disabled={inviteProcessing}>
                                            {inviteProcessing ? t('Sending...') : t('Send Invite')}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Group Members')}</CardTitle>
                                <CardDescription>{t('People in this group')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {group.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                    {member.avatar ? (
                                                        <img 
                                                            src={member.avatar} 
                                                            alt={member.name}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        {member.name}
                                                        {member.id === group.owner.id && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Crown className="h-3 w-3 mr-1" />
                                                                {t('Owner')}
                                                            </Badge>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            {group.is_owner && member.id !== group.owner.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {group.is_owner && (
                        <TabsContent value="settings" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Edit className="h-5 w-5" />
                                        {t('Edit Group')}
                                    </CardTitle>
                                    <CardDescription>{t('Update group information')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdate} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">{t('Group Title')}</Label>
                                                <Input
                                                    id="title"
                                                    value={data.title}
                                                    onChange={e => setData('title', e.target.value)}
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
                                                    rows={4}
                                                />
                                                <InputError message={errors.description} />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label htmlFor="image">{t('Group Image')}</Label>
                                                <Input
                                                    id="image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                                />
                                                <InputError message={errors.image} />
                                            </div>

                                            <Button type="submit" disabled={processing}>
                                                {processing ? t('Updating...') : t('Update Group')}
                                            </Button>
                                        </form>
                                </CardContent>
                            </Card>

                            <Card className="border-destructive">
                                <CardHeader>
                                    <CardTitle className="text-destructive flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" />
                                        {t('Danger Zone')}
                                    </CardTitle>
                                    <CardDescription>{t('Permanently delete this group')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t('Once you delete a group, there is no going back. Please be certain.')}
                                    </p>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleDeleteGroup}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {t('Delete Group')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AppLayout>
    );
}