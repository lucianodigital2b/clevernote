import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Tag, Play, Pause, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface FocusSession {
    id: number;
    started_at: string;
    ended_at: string | null;
    planned_duration_minutes: number;
    actual_duration_minutes: number | null;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    pause_intervals: any[];
    notes: string | null;
    tag: {
        id: number;
        name: string;
    } | null;
}

interface HistoryResponse {
    data: FocusSession[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const FocusHistory: React.FC = () => {
    const [sessions, setSessions] = useState<FocusSession[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchHistory(currentPage);
    }, [currentPage]);

    const fetchHistory = async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/focus/history?page=${page}`);
            if (response.ok) {
                const data: HistoryResponse = await response.json();
                setSessions(data.data);
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
                setTotal(data.total);
            } else {
                toast.error('Failed to load focus history');
            }
        } catch (error) {
            toast.error('Failed to load focus history');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <Play className="h-4 w-4 text-green-500" />;
            case 'paused':
                return <Pause className="h-4 w-4 text-yellow-500" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
            active: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
            paused: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
            completed: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
            cancelled: { variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
        };

        const config = variants[status] || variants.cancelled;
        
        return (
            <Badge variant={config.variant} className={config.className}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const calculatePauseTime = (pauseIntervals: any[]): number => {
        if (!pauseIntervals || pauseIntervals.length === 0) return 0;
        
        return pauseIntervals.reduce((total, interval) => {
            if (interval.paused_at && interval.resumed_at) {
                const pausedAt = new Date(interval.paused_at);
                const resumedAt = new Date(interval.resumed_at);
                return total + Math.floor((resumedAt.getTime() - pausedAt.getTime()) / (1000 * 60));
            }
            return total;
        }, 0);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Focus Session History
                        {total > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {total} sessions
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="space-y-4">
                            {sessions.map((session) => {
                                const pauseTime = calculatePauseTime(session.pause_intervals);
                                
                                return (
                                    <div
                                        key={session.id}
                                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(session.status)}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {formatDateTime(session.started_at)}
                                                        </span>
                                                        {getStatusBadge(session.status)}
                                                    </div>
                                                    {session.tag && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <Tag className="h-3 w-3" />
                                                            <span>{session.tag.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Planned:</span>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {formatDuration(session.planned_duration_minutes)}
                                                </div>
                                            </div>
                                            
                                            {session.actual_duration_minutes !== null && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {formatDuration(session.actual_duration_minutes)}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {pauseTime > 0 && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">Paused:</span>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {formatDuration(pauseTime)}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {session.ended_at && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">Ended:</span>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {formatDateTime(session.ended_at)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {session.notes && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Notes:</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {session.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {lastPage > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Showing page {currentPage} of {lastPage}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1 || isLoading}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === lastPage || isLoading}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No focus sessions recorded yet.
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Start your first focus session to see your history here!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FocusHistory;