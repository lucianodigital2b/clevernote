import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Clock, Target, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface LeaderboardEntry {
    rank: number;
    user_id: number;
    name: string;
    total_sessions: number;
    total_minutes: number;
    is_current_user: boolean;
}

interface LeaderboardData {
    period: string;
    leaderboard: LeaderboardEntry[];
    current_user: LeaderboardEntry | null;
}

const PERIODS = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
];

const FocusLeaderboard: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchLeaderboard(selectedPeriod);
    }, [selectedPeriod]);

    const fetchLeaderboard = async (period: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/focus/leaderboard?period=${period}`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboardData(data);
            } else {
                toast.error('Failed to load leaderboard');
            }
        } catch (error) {
            toast.error('Failed to load leaderboard');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
        }
    };

    const getRankBadgeColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 2:
                return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
            case 3:
                return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Period Selection */}
            <div className="flex flex-wrap gap-2">
                {PERIODS.map((period) => (
                    <Button
                        key={period.value}
                        variant={selectedPeriod === period.value ? 'default' : 'outline'}
                        onClick={() => setSelectedPeriod(period.value)}
                        disabled={isLoading}
                    >
                        {period.label}
                    </Button>
                ))}
            </div>

            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Focus Leaderboard - {PERIODS.find(p => p.value === selectedPeriod)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                        <div className="space-y-3">
                            {leaderboardData.leaderboard.map((entry) => (
                                <div
                                    key={entry.user_id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${
                                        entry.is_current_user
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10">
                                            {entry.rank <= 3 ? (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadgeColor(entry.rank)}`}>
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {entry.rank}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {entry.name}
                                                </span>
                                                {entry.is_current_user && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        You
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Target className="h-4 w-4" />
                                            <span>{entry.total_sessions} sessions</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTime(entry.total_minutes)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Current user rank if not in top list */}
                            {leaderboardData.current_user && !leaderboardData.current_user.rank && (
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    You
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {leaderboardData.current_user.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Target className="h-4 w-4" />
                                                <span>{leaderboardData.current_user.total_sessions} sessions</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{formatTime(leaderboardData.current_user.total_minutes)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No focus sessions recorded for this period yet.
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Start your first focus session to appear on the leaderboard!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FocusLeaderboard;