import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface LevelLeaderboardEntry {
    rank: number;
    user_id: number;
    name: string;
    level: number;
    xp: number;
    is_current_user: boolean;
}

interface LevelLeaderboardData {
    leaderboard: LevelLeaderboardEntry[];
    current_user: LevelLeaderboardEntry | null;
}

const LevelLeaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LevelLeaderboardData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchLevelLeaderboard();
    }, []);

    const fetchLevelLeaderboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/focus/level-leaderboard');
            if (response.ok) {
                const data = await response.json();
                setLeaderboardData(data);
            } else {
                toast.error('Failed to load level leaderboard');
            }
        } catch (error) {
            toast.error('Failed to load level leaderboard');
        } finally {
            setIsLoading(false);
        }
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

    const getLevelBadgeColor = (level: number) => {
        if (level >= 20) {
            return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
        } else if (level >= 15) {
            return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
        } else if (level >= 10) {
            return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
        } else if (level >= 5) {
            return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
        } else {
            return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
        }
    };

    const formatXP = (xp: number): string => {
        if (xp >= 1000000) {
            return `${(xp / 1000000).toFixed(1)}M`;
        } else if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)}K`;
        }
        return xp.toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Level Leaderboard
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
                                            <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getLevelBadgeColor(entry.level)}`}>
                                                <Trophy className="h-3 w-3" />
                                                Lv.{entry.level}
                                                {entry.level >= 20 && <Star className="h-3 w-3" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Zap className="h-4 w-4" />
                                            <span>{formatXP(entry.xp)} XP</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Current user rank if not in top list */}
                            {leaderboardData.current_user && !leaderboardData.leaderboard.some(entry => entry.is_current_user) && (
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    #{leaderboardData.current_user.rank}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {leaderboardData.current_user.name}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        You
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getLevelBadgeColor(leaderboardData.current_user.level)}`}>
                                                    <Trophy className="h-3 w-3" />
                                                    Lv.{leaderboardData.current_user.level}
                                                    {leaderboardData.current_user.level >= 20 && <Star className="h-3 w-3" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap className="h-4 w-4" />
                                                <span>{formatXP(leaderboardData.current_user.xp)} XP</span>
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
                                No users found in the leaderboard yet.
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                Start earning XP to appear on the leaderboard!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LevelLeaderboard;