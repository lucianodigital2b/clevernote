import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Target } from 'lucide-react';

interface TodayStats {
    sessions_completed: number;
    total_focus_time: number;
}

interface Props {
    stats: TodayStats;
}

const FocusStats: React.FC<Props> = ({ stats }) => {
    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <div className="flex gap-4">
            <Card className="min-w-[120px]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.sessions_completed}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sessions Today
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="min-w-[120px]">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatTime(stats.total_focus_time)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Focus Time Today
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FocusStats;