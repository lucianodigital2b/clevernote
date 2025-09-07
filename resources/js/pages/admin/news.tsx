import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface News {
    id: number;
    title: string;
    content: string;
    featured_image?: string;
    priority: 'low' | 'medium' | 'high';
    published_at: string;
    created_at: string;
    updated_at: string;
}

interface NewsFormData {
    title: string;
    content: string;
    featured_image?: string;
    priority: 'low' | 'medium' | 'high';
}

const initialFormData: NewsFormData = {
    title: '',
    content: '',
    featured_image: '',
    priority: 'medium'
};

export default function AdminNews() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [formData, setFormData] = useState<NewsFormData>(initialFormData);
    const queryClient = useQueryClient();

    // Fetch all news items
    const { data: newsItems = [], isLoading } = useQuery({
        queryKey: ['admin-news'],
        queryFn: async () => {
            const response = await axios.get('/api/news');
            return response.data.data || response.data;
        }
    });

    // Create news mutation
    const createNewsMutation = useMutation({
        mutationFn: async (data: NewsFormData) => {
            const response = await axios.post('/api/news', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            setIsCreateModalOpen(false);
            setFormData(initialFormData);
            toast.success('News item created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create news item');
        }
    });

    // Update news mutation
    const updateNewsMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: NewsFormData }) => {
            const response = await axios.put(`/api/news/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            setIsEditModalOpen(false);
            setEditingNews(null);
            setFormData(initialFormData);
            toast.success('News item updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update news item');
        }
    });

    // Delete news mutation
    const deleteNewsMutation = useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`/api/news/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-news'] });
            toast.success('News item deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete news item');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingNews) {
            updateNewsMutation.mutate({ id: editingNews.id, data: formData });
        } else {
            createNewsMutation.mutate(formData);
        }
    };

    const handleEdit = (news: News) => {
        setEditingNews(news);
        setFormData({
            title: news.title,
            content: news.content,
            featured_image: news.featured_image || '',
            priority: news.priority
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: number) => {
        deleteNewsMutation.mutate(id);
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingNews(null);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <AppLayout>
            <Head title="Admin - News Management" />
            
            <div className="container mx-auto py-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">News Management</h1>
                        <p className="text-muted-foreground">Create and manage news items for users</p>
                    </div>
                    
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create News
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create News Item</DialogTitle>
                                <DialogDescription>
                                    Create a new news item to notify users about updates, features, or announcements.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter news title"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="content">Content</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Enter news content (HTML supported)"
                                        rows={6}
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="featured_image">Featured Image URL</Label>
                                    <Input
                                        id="featured_image"
                                        value={formData.featured_image}
                                        onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        type="url"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createNewsMutation.isPending}>
                                        {createNewsMutation.isPending ? 'Creating...' : 'Create News'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>News Items</CardTitle>
                        <CardDescription>
                            Manage all news items that will be displayed to users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <p>Loading news items...</p>
                            </div>
                        ) : newsItems.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No news items found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Published</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {newsItems.map((news: News) => (
                                        <TableRow key={news.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {news.featured_image && (
                                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium">{news.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getPriorityColor(news.priority) as any}>
                                                    {news.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {dayjs(news.published_at).format('MMM DD, YYYY')}
                                            </TableCell>
                                            <TableCell>
                                                {dayjs(news.created_at).format('MMM DD, YYYY')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(news)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete News Item</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{news.title}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(news.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit News Item</DialogTitle>
                            <DialogDescription>
                                Update the news item information.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter news title"
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-content">Content</Label>
                                <Textarea
                                    id="edit-content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter news content (HTML supported)"
                                    rows={6}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-featured_image">Featured Image URL</Label>
                                <Input
                                    id="edit-featured_image"
                                    value={formData.featured_image}
                                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                    type="url"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="edit-priority">Priority</Label>
                                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateNewsMutation.isPending}>
                                    {updateNewsMutation.isPending ? 'Updating...' : 'Update News'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}