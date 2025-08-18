import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Clock, Target, Flame, Trophy, Calendar, BarChart3 } from 'lucide-react';

interface StatisticsProps {
    weeklyStats: any[];
    yearlyHeatmap: any;
    overallStats: {
        totalQuestions: number;
        accuracy: number;
        currentStreak: number;
        maxStreak: number;
        dailyAverage: number;
        daysLearnedPercentage: number;
        totalFlashcardReviews: number;
        totalSessions: number;
    };
}

export function StatisticsDashboard({ weeklyStats, yearlyHeatmap, overallStats }: StatisticsProps) {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const ENABLE_DUMMY_DATA = false;
    
    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Generate dummy data for every day until current date
    const generateDummyData = () => {
        const dummyData: any = {};
        const currentDate = new Date();
        const todayStr = currentDate.toISOString().split('T')[0];
        
        // Start from January 1st of current year
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date();
        
        // Generate data for every day from start of year until today
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            
            dummyData[dateStr] = {
                quiz_total_questions: Math.floor(Math.random() * 50) + 20, // 20-70 questions per day
                flashcard_reviews: Math.floor(Math.random() * 100) + 50, // 50-150 flashcards per day
                study_time_minutes: Math.floor(Math.random() * 180) + 60 // 1-4 hours per day
            };
        }
        
        return dummyData;
    };
    
    // Merge dummy data with existing data only if debug mode is enabled
    const enhancedYearlyHeatmap = ENABLE_DUMMY_DATA ? {
        ...yearlyHeatmap,
        ...generateDummyData()
    } : yearlyHeatmap;
    
    // Generate impressive dummy streaks when debug mode is active
    const enhancedStreaks = ENABLE_DUMMY_DATA ? {
        currentStreak: Math.floor(Math.random() * 15) + 12, // 12-26 days current streak
        maxStreak: Math.floor(Math.random() * 25) + 30 // 30-54 days best streak
    } : {
        currentStreak: overallStats.currentStreak,
        maxStreak: overallStats.maxStreak
    };
    
    // Calculate lifetime totals (all data) - moved here to be available for enhancedLifetimeStats
    const totalQuizQuestions = Object.values(enhancedYearlyHeatmap).reduce((sum: number, day: any) => 
        sum + (day.quiz_total_questions || 0), 0
    );
    
    const totalFlashcardReviews = Object.values(enhancedYearlyHeatmap).reduce((sum: number, day: any) => 
        sum + (day.flashcard_reviews || 0), 0
    );

    // Enhanced lifetime statistics with dummy data when debug mode is active
    const enhancedLifetimeStats = ENABLE_DUMMY_DATA ? {
        totalQuestions: Math.floor(Math.random() * 2000) + 3000,      // 3000-4999 questions
        totalFlashcardReviews: Math.floor(Math.random() * 5000) + 8000, // 8000-12999 reviews
        totalActiveDays: Math.floor(Math.random() * 50) + 120         // 120-169 active days
    } : {
        totalQuestions: overallStats.totalQuestions || totalQuizQuestions,
        totalFlashcardReviews: overallStats.totalFlashcardReviews || totalFlashcardReviews,
        totalActiveDays: Object.keys(enhancedYearlyHeatmap).filter(date => {
            const day = enhancedYearlyHeatmap[date];
            return day.quiz_total_questions > 0 || day.flashcard_reviews > 0;
        }).length
    };
    
    const monthNames = [
        t('month_january'), t('month_february'), t('month_march'), t('month_april'), 
        t('month_may'), t('month_june'), t('month_july'), t('month_august'), 
        t('month_september'), t('month_october'), t('month_november'), t('month_december')
    ];
    
    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats = enhancedYearlyHeatmap[today] || { quiz_total_questions: 0, flashcard_reviews: 0, study_time_minutes: 0 };
    const todayQuizzes = todayStats.quiz_total_questions || 0;
    const todayFlashcards = todayStats.flashcard_reviews || 0;
    
    // Calculate calendar data
    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
    
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
    
    // Generate calendar days
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
        calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayStats = enhancedYearlyHeatmap[dateStr];
        const hasActivity = dayStats && (dayStats.quiz_total_questions > 0 || dayStats.flashcard_reviews > 0);
        calendarDays.push({ day, hasActivity, dateStr });
    }
    
    // Calculate statistics for currently displayed month
    const totalDaysWithActivity = calendarDays.filter(dayData => 
        dayData && dayData.hasActivity
    ).length;
    
    // Calculate totals for currently displayed month only
    const currentMonthQuizQuestions = calendarDays.reduce((sum: number, dayData) => {
        if (dayData && dayData.dateStr && enhancedYearlyHeatmap[dayData.dateStr]) {
            return sum + (enhancedYearlyHeatmap[dayData.dateStr].quiz_total_questions || 0);
        }
        return sum;
    }, 0);
    
    const currentMonthFlashcardReviews = calendarDays.reduce((sum: number, dayData) => {
        if (dayData && dayData.dateStr && enhancedYearlyHeatmap[dayData.dateStr]) {
            return sum + (enhancedYearlyHeatmap[dayData.dateStr].flashcard_reviews || 0);
        }
        return sum;
    }, 0);
    

    
    const avgQuizQuestionsPerDay = totalDaysWithActivity > 0 ? Math.floor(currentMonthQuizQuestions / totalDaysWithActivity) : 0;
    const avgFlashcardsPerDay = totalDaysWithActivity > 0 ? Math.floor(currentMonthFlashcardReviews / totalDaysWithActivity) : 0;
    
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };
    
    return (
        <div className="space-y-6 py-6 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Today's Activity and Streaks */}
                <div className="space-y-6">
                    {/* Today's Activity */}
                    <Card className="bg-white  border-gray-200 dark:border-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                {t('stats_todays_activity')}
                            </CardTitle>
                            <p className="text-gray-600 dark:text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full mb-2 mx-auto">
                                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_quizzes_taken')}</p>
                                    <p className="text-gray-900 dark:text-white text-2xl font-bold">{todayQuizzes}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full mb-2 mx-auto">
                                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_flashcards_studied')}</p>
                                    <p className="text-gray-900 dark:text-white text-2xl font-bold">{todayFlashcards}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Streaks */}
                    <Card className="bg-white  border-gray-200 dark:border-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                                {t('stats_streaks')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded-full mb-2 mx-auto">
                                        <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_current_streak')}</p>
                                    <p className="text-gray-900 dark:text-white text-xl font-bold">{enhancedStreaks.currentStreak} {t('stats_days')}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 dark:bg-yellow-500/20 rounded-full mb-2 mx-auto">
                                        <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_best_streak')}</p>
                                    <p className="text-gray-900 dark:text-white text-xl font-bold">{enhancedStreaks.maxStreak} {t('stats_days')}</p>
                                </div>
                            </div>
                    </CardContent>
                </Card>
                </div>
                
                {/* Right Column - Calendar */}
                <div className="lg:col-span-2">
                    <Card className="bg-white  border-gray-200 dark:border-transparent">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={() => navigateMonth('prev')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                </button>
                                <div className="text-center">
                                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold">
                                        {monthNames[currentMonth]} {currentYear}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => navigateMonth('next')}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Calendar Header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {[t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')].map(day => (
                                    <div key={day} className="text-center text-gray-600 dark:text-slate-400 text-sm font-medium py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((dayData, index) => (
                                    <div key={index} className="h-12">
                                        {dayData ? (
                                            <div className={`
                                                w-full h-full flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                                                ${dayData.hasActivity 
                                                    ? 'text-white' 
                                                    : 'bg-gray-100 dark:bg-accent-foreground/5 text-gray-900 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800/50'
                                                }
                                            `}
                                            style={dayData.hasActivity ? { backgroundColor: '#AB9FF2' } : {}}>
                                                {dayData.day}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Calendar Stats */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-transparent">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-center md:gap-8">
                                    <div className="text-center mb-4 md:mb-0">
                                        <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_days_active')}</p>
                                        <p className="text-gray-900 dark:text-white text-lg font-bold">{totalDaysWithActivity} {t('stats_of')} {daysInMonth}</p>
                                    </div>
                                    <div className="hidden md:block text-gray-400 dark:text-slate-500">•</div>
                                    <div className="text-center mb-4 md:mb-0">
                                        <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_avg_quizzes_day')}</p>
                                        <p className="text-gray-900 dark:text-white text-lg font-bold">{avgQuizQuestionsPerDay}</p>
                                    </div>
                                    <div className="hidden md:block text-gray-400 dark:text-slate-500">•</div>
                                    <div className="text-center">
                                        <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_avg_flashcards_day')}</p>
                                        <p className="text-gray-900 dark:text-white text-lg font-bold">{avgFlashcardsPerDay}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            {/* Lifetime Statistics */}
            <Card className="bg-white  border-gray-200 dark:border-transparent">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Trophy className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                        {t('stats_lifetime_statistics')}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-slate-400 text-sm">{t('stats_lifetime_description')}</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-purple-50 dark:bg-purple-500/10 rounded-lg p-6 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full mb-3 mx-auto">
                                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">{t('stats_total_quiz_questions')}</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">{enhancedLifetimeStats.totalQuestions}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-6 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full mb-3 mx-auto">
                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">{t('stats_total_flashcard_reviews')}</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">{enhancedLifetimeStats.totalFlashcardReviews}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-6 text-center">
                            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-full mb-3 mx-auto">
                                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">{t('stats_active_days')}</p>
                            <p className="text-gray-900 dark:text-white text-2xl font-bold">{enhancedLifetimeStats.totalActiveDays}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}