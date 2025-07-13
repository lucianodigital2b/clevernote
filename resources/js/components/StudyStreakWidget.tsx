import React from 'react';
import { useTranslation } from 'react-i18next';

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

interface StudyStreakWidgetProps {
    userStatistics?: UserStatistic[];
}

const StudyStreakWidget: React.FC<StudyStreakWidgetProps> = ({ userStatistics }) => {
    const { t } = useTranslation();

    // Get current date and check if user studied today
    const today = new Date().toISOString().split('T')[0];
    const todayStats = userStatistics?.find(stat => stat.date === today);
    const hasStudiedToday = (todayStats?.study_time_minutes || 0) > 0;

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

    return (
        <section className="w-1/2">
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-1">{t('study_streak_title')}</h2>
                    <p className="text-neutral-500">{t('study_streak_subtitle')}</p>
                </div>
                
                {/* Study Activity Grid - Current Week */}
                <div className="overflow-x-auto">
                    <div className="min-w-full">

                        
                        <div className="flex justify-start">
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 7 }, (_, index) => {
                                    const date = new Date();
                                    const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
                                    const currentDay = new Date(startOfWeek);
                                    currentDay.setDate(startOfWeek.getDate() + index);
                                    const dateString = currentDay.toISOString().split('T')[0];
                                    const dayStats = userStatistics?.find(stat => stat.date === dateString);
                                    const studyTime = dayStats?.study_time_minutes || 0;
                                    const isSunday = index === 0;
                                    const isToday = dateString === today;
                                    const hasStudied = studyTime > 0;
                                    
                                    let intensity = 0;
                                    if (studyTime > 0) {
                                        if (studyTime >= 120) intensity = 4; // 2+ hours
                                        else if (studyTime >= 60) intensity = 3; // 1+ hour
                                        else if (studyTime >= 30) intensity = 2; // 30+ minutes
                                        else intensity = 1; // any study time
                                    }
                                    
                                    const intensityColors = {
                                        0: 'bg-neutral-100 dark:bg-neutral-700',
                                        1: 'bg-purple-200 dark:bg-purple-800',
                                        2: 'bg-purple-400 dark:bg-purple-600',
                                        3: 'bg-purple-600 dark:bg-purple-500',
                                        4: 'bg-purple-800 dark:bg-purple-400'
                                    };
                                    
                                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    
                                    return (
                                        <div key={index} className="flex flex-col items-center gap-2">
                                            <div className="text-xs text-neutral-500 font-medium">
                                                {dayNames[index]}
                                            </div>
                                            <div
                                                className={`w-8 h-8 rounded-lg ${intensityColors[intensity]} hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer flex items-center justify-center relative ${
                                                    !hasStudied && !isSunday && !isToday ? 'opacity-50' : ''
                                                }`}
                                                title={`${currentDay.toLocaleDateString()}: ${studyTime} minutes studied`}
                                            >
                                                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                                    {currentDay.getDate()}
                                                </span>
                                                {!hasStudied && !isSunday && !isToday && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute"></div>
                                                        <div className="w-6 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {!hasStudiedToday && (
                            <div className="mt-4">
                                <div className="text-lg font-bold text-red-600">
                                    {String(countdown.hours).padStart(2, '0')}:
                                    {String(countdown.minutes).padStart(2, '0')}:
                                    {String(countdown.seconds).padStart(2, '0')}
                                </div>
                                <div className="text-sm text-neutral-500">{t('time_left_to_study')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StudyStreakWidget;