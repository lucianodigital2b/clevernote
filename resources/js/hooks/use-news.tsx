import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

type NewsItem = {
    id: number;
    title: string;
    content: string;
    featured_image?: string;
    published_at: string;
    priority: number;
    is_viewed?: boolean;
};

type NewsResponse = {
    news: NewsItem | null;
};

type PaginatedNewsResponse = {
    data: NewsItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more: boolean;
};

export function useNews() {
    const [unreadNews, setUnreadNews] = useState<NewsItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUnreadNews = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await axios.get<NewsResponse>('/api/news/unread');
            setUnreadNews(response.data.news);
        } catch (err) {
            console.error('Failed to fetch unread news:', err);
            setError('Failed to load news');
        } finally {
            setIsLoading(false);
        }
    };

    const markAsViewed = async (newsId: number) => {
        // Optimistically clear unread news synchronously to prevent auto-reopen
        const previous = unreadNews;
        setUnreadNews(null);
        try {
            await axios.post(`/api/news/${newsId}/mark-viewed`);
        } catch (err) {
            console.error('Failed to mark news as viewed:', err);
            // Rollback if request fails
            setUnreadNews(previous);
        }
    };

    useEffect(() => {
        fetchUnreadNews();
    }, []);

    return {
        unreadNews,
        isLoading,
        error,
        markAsViewed,
        refetch: fetchUnreadNews
    };
}

export function usePaginatedNews() {
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    const fetchNews = useCallback(async (page: number = 1, reset: boolean = false) => {
        try {
            if (page === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }
            setError(null);
            
            const response = await axios.get<PaginatedNewsResponse>('/api/news/paginated', {
                params: { page, per_page: 6 }
            });
            
            const { data, has_more, total: totalCount } = response.data;
            
            if (reset || page === 1) {
                setNewsItems(data);
            } else {
                setNewsItems(prev => [...prev, ...data]);
            }
            
            setCurrentPage(page);
            setHasMore(has_more);
            setTotal(totalCount);
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError('Failed to load news');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const loadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            fetchNews(currentPage + 1);
        }
    }, [currentPage, hasMore, isLoadingMore, fetchNews]);

    const markAsViewed = async (newsId: number) => {
        try {
            await axios.post(`/api/news/${newsId}/mark-viewed`);
            // Update the local state to mark the news as viewed
            setNewsItems(prev => 
                prev.map(item => 
                    item.id === newsId ? { ...item, is_viewed: true } : item
                )
            );
        } catch (err) {
            console.error('Failed to mark news as viewed:', err);
        }
    };

    const refresh = useCallback(() => {
        setCurrentPage(1);
        setHasMore(true);
        fetchNews(1, true);
    }, [fetchNews]);

    useEffect(() => {
        fetchNews(1);
    }, [fetchNews]);

    return {
        newsItems,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        total,
        loadMore,
        markAsViewed,
        refresh
    };
}