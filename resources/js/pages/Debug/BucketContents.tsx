import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Download, FileText, Database, HardDrive, Search, Calendar, User, Folder } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Note {
    id: number;
    title: string;
    content: string;
    transcription: string;
    summary: string;
    status: string;
    source_type: string;
    source_url: string;
    created_at: string;
    podcast_file_path: string;
    podcast_status: string;
    user_id: number;
    folder_id: number;
    tags: Array<{ name: string }>;
    folder: { name: string } | null;
}

interface BucketFile {
    path: string;
    size: number;
    last_modified: number;
    url: string;
}

interface MediaFile {
    id: number;
    model_type: string;
    model_id: number;
    collection_name: string;
    name: string;
    file_name: string;
    disk: string;
    size: number;
    created_at: string;
    url: string;
}

interface PaginationData<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface BucketFilesPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface MediaFilesPagination {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface Props {
    notes: PaginationData<Note>;
    bucketFiles: BucketFile[] | { error: string };
    mediaFiles: MediaFile[] | { error: string };
    bucketFilesPagination: BucketFilesPagination | null;
    mediaFilesPagination: MediaFilesPagination | null;
    totalNotes: number;
    totalBucketFiles: number;
    totalMediaFiles: number;
    pagination: {
        per_page: number;
        notes_page: number;
        bucket_page: number;
        media_page: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Debug',
        href: '/debug/bucket-contents',
    },
];

export default function BucketContents({ 
    notes, 
    bucketFiles, 
    mediaFiles, 
    bucketFilesPagination,
    mediaFilesPagination,
    totalNotes, 
    totalBucketFiles, 
    totalMediaFiles,
    pagination
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const filteredNotes = notes.data.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || note.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const handlePageChange = (page: number, type: 'notes' | 'bucket' | 'media') => {
        const params = new URLSearchParams(window.location.search);
        params.set(`${type}_page`, page.toString());
        router.get(`/debug/bucket-contents?${params.toString()}`);
    };

    const PaginationControls = ({ pagination, type }: { pagination: any, type: 'notes' | 'bucket' | 'media' }) => {
        if (!pagination || pagination.last_page <= 1) return null;
        
        return (
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {pagination.from} to {pagination.to} of {pagination.total} results
            </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.current_page === 1}
                        onClick={() => handlePageChange(pagination.current_page - 1, type)}
                    >
                        Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.current_page === pagination.last_page}
                        onClick={() => handlePageChange(pagination.current_page + 1, type)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    const handleDownloadFile = (filePath: string) => {
        window.open(`/debug/download-file?file_path=${encodeURIComponent(filePath)}`, '_blank');
    };

    const handleExportNotes = () => {
        window.open('/debug/export-notes', '_blank');
    };

    const handleDownloadNoteFiles = (noteId: number) => {
        window.location.href = `/debug/download-note-files?note_id=${noteId}`;
    };

    const formatFileSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatDate = (timestamp: number | string) => {
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
        return date.toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processed': return 'bg-green-100 text-green-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Debug - Bucket Contents" />
            
            <div className="flex sm:flex-start h-full flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full relative">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Debug - Bucket Contents</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Administrative debugging interface for CleverNote storage</p>
                </div>
                                <Button onClick={handleExportNotes} className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Export All Notes Data
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totalNotes}</div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Bucket Files</CardTitle>
                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totalBucketFiles}</div>
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totalMediaFiles}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Tabs defaultValue="notes" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="notes">Notes Data</TabsTrigger>
                                    <TabsTrigger value="bucket">Bucket Files</TabsTrigger>
                                    <TabsTrigger value="media">Media Library</TabsTrigger>
                                </TabsList>

                                <TabsContent value="notes" className="space-y-4">
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <Input
                                placeholder="Search notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                                            <option value="all">All Status</option>
                                            <option value="processed">Processed</option>
                                            <option value="processing">Processing</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        {filteredNotes.map((note) => (
                                            <Card key={note.id}>
                                                <CardHeader>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg">{note.title}</CardTitle>
                                                            <CardDescription className="flex items-center gap-4 mt-2">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    {formatDate(note.created_at)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-4 w-4" />
                                                                    User ID: {note.user_id}
                                                                </span>
                                                                {note.folder && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Folder className="h-4 w-4" />
                                                                        {note.folder.name}
                                                                    </span>
                                                                )}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleDownloadNoteFiles(note.id)}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Download className="h-3 w-3" />
                                                                Download Files
                                                            </Button>
                                                            <Badge className={getStatusColor(note.status)}>
                                                                {note.status}
                                                            </Badge>
                                                            {note.source_type && (
                                                                <Badge variant="outline">
                                                                    {note.source_type}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {note.content && (
                                                            <div>
                                                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Content Preview:</h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                                                    {note.content.substring(0, 200)}...
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        {note.podcast_file_path && (
                                                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                                <div>
                                                                    <p className="text-sm font-medium dark:text-gray-200">Podcast File</p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{note.podcast_file_path}</p>
                                                                    <Badge className="mt-1" variant={note.podcast_status === 'completed' ? 'default' : 'secondary'}>
                                                                        {note.podcast_status}
                                                                    </Badge>
                                                                </div>
                                                                {note.podcast_status === 'completed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleDownloadFile(note.podcast_file_path)}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {note.tags && note.tags.length > 0 && (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {note.tags.map((tag, index) => (
                                                                    <Badge key={index} variant="outline" className="text-xs">
                                                                        {tag.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <PaginationControls pagination={notes} type="notes" />
                                </TabsContent>

                                <TabsContent value="bucket" className="space-y-4">
                                    {Array.isArray(bucketFiles) ? (
                                        <div className="space-y-2">
                                            {bucketFiles.map((file, index) => (
                                                <Card key={index}>
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <p className="font-medium dark:text-gray-200">{file.path}</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {formatFileSize(file.size)} • {formatDate(file.last_modified)}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(file.url, '_blank')}
                                                                >
                                                                    View
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleDownloadFile(file.path)}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-red-600 dark:text-red-400">Error: {bucketFiles.error}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <PaginationControls pagination={bucketFilesPagination} type="bucket" />
                                </TabsContent>

                                <TabsContent value="media" className="space-y-4">
                                    {Array.isArray(mediaFiles) ? (
                                        <div className="space-y-2">
                                            {mediaFiles.map((file) => (
                                                <Card key={file.id}>
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <p className="font-medium dark:text-gray-200">{file.name}</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {file.collection_name} • {formatFileSize(file.size)} • {formatDate(file.created_at)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {file.model_type} ID: {file.model_id} • Disk: {file.disk}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => window.open(file.url, '_blank')}
                                                            >
                                                                View
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="p-4">
                                                <p className="text-red-600 dark:text-red-400">Error: {mediaFiles.error}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <PaginationControls pagination={mediaFilesPagination} type="media" />
                                </TabsContent>
                            </Tabs>
            </div>
        </AppLayout>
    );
}