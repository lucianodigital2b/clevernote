import React, { useState } from 'react';
import { X, Calendar, ChevronDown, Loader2 } from 'lucide-react';

type NewsItem = {
    id: number;
    title: string;
    content: string;
    featured_image?: string;
    published_at: string;
    priority: number;
    is_viewed?: boolean;
};

type NewsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    newsItems: NewsItem[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onMarkAsViewed: (newsId: number) => Promise<void>;
};

export function NewsModal({ 
    isOpen, 
    onClose, 
    newsItems, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    onLoadMore, 
    onMarkAsViewed 
}: NewsModalProps) {
    const [markingAsViewed, setMarkingAsViewed] = useState<Set<number>>(new Set());

    if (!isOpen) return null;

    const handleMarkAsViewed = async (newsId: number) => {
        setMarkingAsViewed(prev => new Set(prev).add(newsId));
        try {
            await onMarkAsViewed(newsId);
        } catch (error) {
            console.error('Failed to mark news as viewed:', error);
        } finally {
            setMarkingAsViewed(prev => {
                const newSet = new Set(prev);
                newSet.delete(newsId);
                return newSet;
            });
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking the backdrop itself, not child elements
        if (e.target === e.currentTarget) {
            // Mark all unread news as viewed asynchronously
            const unreadNewsIds = newsItems
                .filter(item => !item.is_viewed)
                .map(item => item.id);
            
            // Close modal immediately
            onClose();
            
            // Send API calls asynchronously in the background
            unreadNewsIds.forEach(newsId => {
                onMarkAsViewed(newsId).catch(error => {
                    console.error('Failed to mark news as viewed:', error);
                });
            });
        }
    };

    const handleCloseClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Close the modal first
        onClose();

        
        // Mark all unread news as viewed asynchronously
        const unreadNewsIds = newsItems
            .filter(item => !item.is_viewed)
            .map(item => item.id);
        unreadNewsIds.forEach(newsId => {
            onMarkAsViewed(newsId).catch(error => {
                console.error('Failed to mark news as viewed:', error);
            });
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Latest News & Updates
                    </h2>
                    <button
                        onClick={handleCloseClick}
                        className="text-gray-400 hover:text-gray-600 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                            <span className="ml-2 text-gray-600 dark:text-neutral-300">Loading news...</span>
                        </div>
                    ) : newsItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                            <p>No news available at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {newsItems.map((newsItem) => (
                                <div 
                                    key={newsItem.id} 
                                    className="border border-gray-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800 transition-all"
                                >
                                    <div className="flex items-center justify-end mb-4">
                                        <div className="flex items-center text-gray-500 dark:text-neutral-400 text-sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span>
                                                {new Date(newsItem.published_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {newsItem.featured_image && (
                                        <img
                                            src={newsItem.featured_image}
                                            alt={newsItem.title}
                                            className="w-full h-48 object-cover rounded-lg mb-4"
                                        />
                                    )}
                                    
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                        {newsItem.title}
                                    </h3>
                                    
                                    <div 
                                        className="prose prose-sm max-w-none text-gray-700 dark:text-neutral-300 mb-4 dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: newsItem.content }}
                                    />


                                </div>
                            ))}

                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                        className="flex items-center px-6 py-3 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Loading more...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4 mr-2" />
                                                Load More News
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    <button
                        onClick={handleCloseClick}
                        className="px-6 py-2 bg-gray-600 dark:bg-neutral-600 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-neutral-500 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}