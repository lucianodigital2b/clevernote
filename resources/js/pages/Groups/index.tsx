import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, MoreVertical, Trophy } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Group {
    id: number;
    title: string;
    description: string;
    image: string | null;
    invite_code: string;
    created_by: string;
    is_creator: boolean;
    role: 'admin' | 'member';
    members_count: number;
    joined_at: string;
}

export default function Index() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    // Fetch user's groups
    const { data: groups = [], isLoading } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const response = await axios.get('/api/groups');
            return response.data;
        }
    });

    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) {
            toast.error(t('Please enter an invite code'));
            return;
        }

        setIsJoining(true);
        try {
            await axios.post('/api/groups/join', {
                invite_code: inviteCode.trim()
            });
            
            toast.success(t('Successfully joined the group!'));
            setIsJoinModalOpen(false);
            setInviteCode('');
            
            // Refresh the groups list
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.error(t('Invalid invite code'));
            } else if (error.response?.status === 409) {
                toast.error(t('You are already a member of this group'));
            } else {
                toast.error(t('Failed to join group'));
            }
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Groups" />
            <div className="container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        {t('Groups')}
                    </h1>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t('Join Group')}
                        </Button>
                        <Button asChild>
                            <Link href="/groups/create" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {t('Create Group')}
                            </Link>
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">{t('Loading groups...')}</div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                            {t('You haven\'t joined any groups yet')}
                        </h3>
                        <p className="text-neutral-500 mb-6">
                            {t('Create a new group or join one with an invite code to start collaborating!')}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button 
                                variant="outline"
                                onClick={() => setIsJoinModalOpen(true)}
                            >
                                {t('Join Group')}
                            </Button>
                            <Button asChild>
                                <Link href="/groups/create">{t('Create Group')}</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group: Group) => (
                            <Card key={group.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{group.title}</CardTitle>
                                            <CardDescription className="mt-1">{group.description}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/groups/${group.id}`}>
                                                        {t('View Details')}
                                                    </Link>
                                                </DropdownMenuItem>
                                                {group.is_creator && (
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/groups/${group.id}/edit`}>
                                                            {t('Edit Group')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Badge variant={group.role === 'admin' ? 'default' : 'secondary'}>
                                            {t(group.role)}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {group.members_count} {t('members')}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{t('Created by')} {group.created_by}</span>
                                        <span>{t('Joined')} {new Date(group.joined_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/groups/${group.id}`} className="flex items-center gap-2">
                                                <Trophy className="h-4 w-4" />
                                                {t('Leaderboard')}
                                            </Link>
                                        </Button>
                                        {group.is_creator && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                {t('Code')}: {group.invite_code}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Join Group Modal */}
            <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Join a Group')}</DialogTitle>
                        <DialogDescription>
                            {t('Enter the invite code to join a group')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-code">{t('Invite Code')}</Label>
                            <Input
                                id="invite-code"
                                placeholder={t('Enter invite code')}
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleJoinGroup();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsJoinModalOpen(false);
                                    setInviteCode('');
                                }}
                                disabled={isJoining}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button 
                                onClick={handleJoinGroup}
                                disabled={isJoining || !inviteCode.trim()}
                            >
                                {isJoining ? t('Joining...') : t('Join Group')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}