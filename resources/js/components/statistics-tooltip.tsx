import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Check, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface UserStatistic {
    date: string;
    quiz_attempts: number;
    quiz_correct_answers: number;
    quiz_total_questions: number;
    flashcard_reviews: number;
    flashcard_correct: number;
    study_time_minutes: number;
    current_streak: number;
    max_streak: number;
}

export function StatisticsTooltip() {
    const { t } = useTranslation();

    // Query for user statistics (current week)
    const { data: userStatistics } = useQuery({
        queryKey: ['userStatistics'],
        queryFn: async () => {
            const today = new Date();
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            const response = await axios.get('/api/statistics/daily', {
                params: {
                    start_date: startOfWeek.toISOString().split('T')[0],
                    end_date: endOfWeek.toISOString().split('T')[0]
                }
            });
            return response.data.data;
        },
        staleTime: 30000, // Data remains fresh for 30 seconds
        refetchOnWindowFocus: false // Prevent refetch on window focus
    });

    // Get current date and check if user studied today
    const today = new Date().toISOString().split('T')[0];
    const todayStats = userStatistics?.find(stat => stat.date === today);
    const hasStudiedToday = (todayStats?.flashcard_reviews || 0) > 0 || (todayStats?.quiz_attempts || 0) > 0;

    // Calculate countdown to midnight
    const getCountdownToMidnight = () => {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight.getTime() - now.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds };
    };

    const [countdown, setCountdown] = React.useState(getCountdownToMidnight());

    React.useEffect(() => {
        if (!hasStudiedToday) {
            const interval = setInterval(() => {
                setCountdown(getCountdownToMidnight());
            }, 1000);
            
            return () => clearInterval(interval);
        }
    }, [hasStudiedToday]);

    const renderStudyGrid = () => {
        return (
            <div className="grid grid-cols-7 gap-1 mb-3">
                {Array.from({ length: 7 }, (_, index) => {
                    // Start week on Sunday (index 0 = Sunday)
                    const today = new Date();
                    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
                    
                    const currentDay = new Date(startOfWeek);
                    currentDay.setDate(startOfWeek.getDate() + index);
                    const dateString = currentDay.toISOString().split('T')[0];
                    const dayStats = userStatistics?.find(stat => stat.date === dateString);
                    const flashcardReviews = dayStats?.flashcard_reviews || 0;
                    const quizAttempts = dayStats?.quiz_attempts || 0;
                    const totalActivities = flashcardReviews + quizAttempts;
                    const isToday = dateString === today.toISOString().split('T')[0];
                    const hasStudied = totalActivities > 0;
                    
                    // Check if this day is in the past (before today)
                    const isPastDay = currentDay < new Date(today.toISOString().split('T')[0]);
                    
                    let intensity = 0;
                    if (totalActivities > 0) {
                        if (totalActivities >= 50) intensity = 4; // 50+ activities
                        else if (totalActivities >= 25) intensity = 3; // 25+ activities
                        else if (totalActivities >= 10) intensity = 2; // 10+ activities
                        else intensity = 1; // any activity
                    }
                    
                    const intensityColors = {
                        0: 'bg-neutral-100 dark:bg-neutral-700',
                        1: 'bg-purple-200/50 dark:bg-purple-800',
                        2: 'bg-purple-400/50 dark:bg-purple-600',
                        3: 'bg-purple-600/50 dark:bg-purple-500',
                        4: 'bg-purple-800/50 dark:bg-purple-400'
                    };
                    
                    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                    
                    return (
                        <div key={index} className="flex flex-col items-center gap-1">
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                {dayNames[index]}
                            </div>
                            <div
                                className={`w-6 h-6 rounded-md ${
                                    isToday 
                                        ? hasStudied
                                            ? 'bg-green-500 dark:bg-green-600 text-white border border-green-400 dark:border-green-500'
                                            : 'bg-green-50 dark:bg-green-900/30 dark:border-green-700 text-neutral-700 dark:text-green-300 border border-green-200'
                                        : intensityColors[intensity]
                                } flex items-center justify-center relative ${
                                    isPastDay && !hasStudied ? 'opacity-50' : ''
                                }`}
                                title={`${currentDay.toLocaleDateString()}: ${flashcardReviews} flashcards, ${quizAttempts} quizzes`}
                            >
                                {isToday && hasStudied ? (
                                    <Check className="w-3 h-3 text-white" />
                                ) : (
                                    <span className={`text-xs font-medium ${
                                        isToday 
                                            ? 'text-neutral-700 dark:text-green-300'
                                            : hasStudied 
                                                ? 'text-white dark:text-white' 
                                                : 'text-neutral-600 dark:text-neutral-200'
                                    }`}>
                                        {currentDay.getDate()}
                                    </span>
                                )}
                                {/* Only show crossed out X for past days where user didn't study */}
                                {isPastDay && !hasStudied && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-0.5 bg-red-500 rotate-45 absolute"></div>
                                        <div className="w-4 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="group h-9 w-9 cursor-pointer"
                    >
                        <Flame className="h-4 w-4 opacity-80 group-hover:opacity-100 text-orange-500" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80 p-4">
                    <div>
                        <div className="mb-3">
                            <h3 className="font-semibold text-sm mb-1">{t('study_streak_title')}</h3>
                            <p className="text-xs text-neutral-500">{t('study_streak_subtitle')}</p>
                        </div>
                        
                        {/* Study Activity Grid - Current Week */}
                        <div className="mb-3">
                            {renderStudyGrid()}
                        </div>
                        
                        {!hasStudiedToday && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-zinc-200 ">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3 h-3 text-gray-700 " />
                                    <span className="text-xs font-medium text-gray-700 ">
                                        {t('time_left_to_study')}
                                    </span>
                                </div>
                                <div className="text-sm font-mono text-gray-700 ">
                                    {String(countdown.hours).padStart(2, '0')}:
                                    {String(countdown.minutes).padStart(2, '0')}:
                                    {String(countdown.seconds).padStart(2, '0')}
                                </div>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}