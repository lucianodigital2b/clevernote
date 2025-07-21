import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, FileText, Grid3X3, Loader2, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toastConfig } from '@/lib/toast';
import axios from 'axios';
import { useState } from 'react';

dayjs.extend(relativeTime);

interface Crossword {
    id: number;
    uuid: string;
    title: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    failure_reason?: string;
    puzzle_data: any;
    created_at: string;
    updated_at: string;
    note: {
        id: number;
        title: string;
    };
}

interface CrosswordsIndexProps {
    crosswords: {
        data: Crossword[];
        links: any;
        meta: any;
    };
}

export default function Index({ crosswords }: CrosswordsIndexProps) {
    const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());

    const handleRetry = async (crosswordId: number) => {
        setRetryingIds(prev => new Set(prev).add(crosswordId));
        
        try {
            await axios.post(`/crosswords/${crosswordId}/retry`);
            toastConfig.success('Crossword regeneration started');
            
            // Refresh the page after a short delay
            setTimeout(() => {
                router.reload();
            }, 1000);
        } catch (error) {
            console.error('Error retrying crossword:', error);
            toastConfig.error('Failed to retry crossword generation');
        } finally {
            setRetryingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(crosswordId);
                return newSet;
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'generating':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'generating':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        }
    };

    return (
        <AppLayout>
            <Head title="Crosswords" />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.visit('/dashboard')}
                                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                            <div className="hidden sm:block h-4 w-px bg-neutral-300" />
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    Crossword Puzzles
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Interactive crossword puzzles generated from your notes
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Crosswords Grid */}
                    {crosswords.data.length === 0 ? (
                        <div className="text-center py-12">
                            <Grid3X3 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                                No crosswords yet
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                                Generate crossword puzzles from your notes to make learning more interactive.
                            </p>
                            <Button onClick={() => router.visit('/notes')}>
                                Go to Notes
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {crosswords.data.map((crossword) => (
                                <Card key={crossword.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-semibold truncate">
                                                    {crossword.title}
                                                </CardTitle>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 truncate">
                                                    From: {crossword.note.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2">
                                                {getStatusIcon(crossword.status)}
                                                <Badge className={getStatusColor(crossword.status)}>
                                                    {crossword.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                                <Clock className="h-4 w-4" />
                                                <span>Created {dayjs(crossword.created_at).fromNow()}</span>
                                            </div>
                                            
                                            {crossword.status === 'failed' && crossword.failure_reason && (
                                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                    {crossword.failure_reason}
                                                </div>
                                            )}
                                            
                                            <div className="flex gap-2">
                                                {crossword.status === 'completed' && (
                                                    <Button 
                                                        onClick={() => router.visit(`/crosswords/${crossword.id}`)}
                                                        className="flex-1"
                                                    >
                                                        <Grid3X3 className="h-4 w-4 mr-2" />
                                                        Play Crossword
                                                    </Button>
                                                )}
                                                
                                                {crossword.status === 'failed' && (
                                                    <Button 
                                                        onClick={() => handleRetry(crossword.id)}
                                                        disabled={retryingIds.has(crossword.id)}
                                                        variant="outline"
                                                        className="flex-1"
                                                    >
                                                        {retryingIds.has(crossword.id) ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                        )}
                                                        Retry
                                                    </Button>
                                                )}
                                                
                                                {(crossword.status === 'pending' || crossword.status === 'generating') && (
                                                    <Button disabled className="flex-1">
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Generating...
                                                    </Button>
                                                )}
                                                
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => router.visit(`/notes/${crossword.note.id}/edit`)}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {crosswords.data.length > 0 && crosswords.links && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex gap-2">
                                {crosswords.links.map((link: any, index: number) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => link.url && router.visit(link.url)}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}