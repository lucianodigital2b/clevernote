import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import CalHeatmap from 'cal-heatmap';
import Legend from 'cal-heatmap/plugins/Legend';
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import 'cal-heatmap/cal-heatmap.css';

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
    };
}

export function StatisticsDashboard({ weeklyStats, yearlyHeatmap, overallStats }: StatisticsProps) {
    const { t } = useTranslation();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const calendarRef = useRef<HTMLDivElement>(null);
    const calInstanceRef = useRef<CalHeatmap | null>(null); // Added ref for CalHeatmap instance
    
    // Prepare weekly chart data
    const weeklyChartData = weekDays.map((day, index) => {
        const dayStats = weeklyStats.find(stat => new Date(stat.date).getDay() === (index + 1) % 7);
        return {
            day,
            questions: dayStats ? (dayStats.quiz_total_questions + dayStats.flashcard_reviews) : 0,
            accuracy: dayStats && dayStats.quiz_total_questions > 0 
                ? Math.round((dayStats.quiz_correct_answers / dayStats.quiz_total_questions) * 100) 
                : 0
        };
    });
    
    // Format data for Cal-Heatmap
    const formatCalHeatmapData = () => {
        const data = [];
        const startDate = new Date(new Date().getFullYear(), 0, 1);
        const endDate = new Date();
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayStats = yearlyHeatmap[dateStr];
            const activity = dayStats ? (dayStats.quiz_total_questions + dayStats.flashcard_reviews) : 0;
            
            if (activity > 0) {
                data.push({
                    date: dateStr,
                    value: activity
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return data;
    };
    
    useEffect(() => {
        if (calendarRef.current) {
            // Clear any existing calendar
            calendarRef.current.innerHTML = '';
            
            const cal = new CalHeatmap();
            calInstanceRef.current = cal; // Store instance in ref
            
            cal.paint({
                itemSelector: calendarRef.current,
                range: 1,
                domain: {
                    type: 'month',
                    label: {
                        text: null
                    }
                },
                subDomain: { 
                    type: 'day',
                    radius: 8,
                    width: 30,
                    height: 30,
                    gutter: 4,
                    sort: 'asc',
                    verticalOrientation: false,
                    colLimit: 7,
                    rowLimit: 7,
                    label: {
                        position: 'top',
                        offset: {
                            x: 0,
                            y: -25
                        },
                        text: (timestamp) => {
                            const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                            return days[new Date(timestamp).getDay()];
                        },
                        style: {
                            fontSize: '14px',
                            fill: '#374151',
                            fontWeight: 'bold'
                        }
                    }
                },
                date: { 
                    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    highlight: [new Date()]
                },
                data: {
                    source: formatCalHeatmapData(),
                    type: 'json',
                    x: 'date',
                    y: 'value'
                },
                scale: {
                    color: {
                        range: ['#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#31a354'],
                        domain: [1, 10, 25, 50, 100],
                        type: 'threshold'
                    }
                },
                theme: 'light',
                highlight: {
                    radius: 2,
                    borderWidth: 2,
                    borderColor: '#3b82f6'
                }
            }, [
                [Legend, {
                    itemSelector: '#cal-heatmap-legend-container',
                    label: null
                }],
                [Tooltip, {
                    text: function(date, value, dayjsDate) {
                        return value ? `${dayjsDate.format('LL')}: ${value} ${t('activities')}` : `${dayjsDate.format('LL')}: 0 ${t('activities')}`;
                    }
                }]
            ]);
        }
    }, [yearlyHeatmap, t]);

    const handlePrevious = () => {
        if (calInstanceRef.current) {
            calInstanceRef.current.previous();
        }
    };

    const handleNext = () => {
        if (calInstanceRef.current) {
            calInstanceRef.current.next();
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Weekly Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span>{t('performance_over_weeks')}</span>
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                {t('you')}
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                {t('goal')}
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                        <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded min-w-[40px] text-center">{t('one_month')}</button>
                        <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded min-w-[40px] text-center">3</button>
                        <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded min-w-[40px] text-center">6</button>
                        <button className="px-3 py-2 text-sm bg-blue-500 text-white rounded min-w-[40px] text-center">2025</button>
                    </div>
                    
                    <div className="h-64 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
                                <XAxis dataKey="day" tick={{ fill: '#6b7280' }} className="dark:fill-gray-300" />
                                <YAxis tick={{ fill: '#6b7280' }} className="dark:fill-gray-300" />
                                <RechartsTooltip 
                                    contentStyle={{
                                        backgroundColor: 'var(--background)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--foreground)'
                                    }}
                                />
                                <Bar dataKey="questions" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    

                </CardContent>
            </Card>
            
            {/* Question Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('question_statistics')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="w-full md:w-1/2 max-w-[300px] mx-auto md:mx-0">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    name: t('correct'),
                                                    value: Math.round(overallStats.totalQuestions * overallStats.accuracy / 100),
                                                    color: '#3b82f6'
                                                },
                                                {
                                                    name: t('incorrect'),
                                                    value: Math.round(overallStats.totalQuestions * (100 - overallStats.accuracy) / 100),
                                                    color: '#ef4444'
                                                }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={10}
                                        >
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{
                                                backgroundColor: 'var(--background)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                color: 'var(--foreground)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        <span className="text-sm">{t('correct')}</span>
                                    </div>
                                    <span className="font-bold text-lg">{Math.round(overallStats.totalQuestions * overallStats.accuracy / 100).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm">{t('incorrect')}</span>
                                    </div>
                                    <span className="font-bold text-lg">{Math.round(overallStats.totalQuestions * (100 - overallStats.accuracy) / 100).toLocaleString()}</span>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('total_questions')}</span>
                                        <span className="font-bold text-lg">{overallStats.totalQuestions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('accuracy')}</span>
                                        <span className="font-bold text-lg">{overallStats.accuracy}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Activity Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('study_activity')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevious} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">{t('previous')}</button>
                        <button onClick={handleNext} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">{t('next')}</button>
                    </div>
                    {/* Cal-Heatmap Container */}
                    <div ref={calendarRef} id="cal-heatmap-container" className="cal-heatmap-container w-full h-[250px] flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50"></div>
                    {/* Dedicated container for the legend */}
                    <div id="cal-heatmap-legend-container" className="mt-2 flex justify-center rounded-lg"></div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.dailyAverage} {t('cards')}</p>
                            <p className="text-gray-600 dark:text-gray-400">{t('daily_average')}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.daysLearnedPercentage}%</p>
                            <p className="text-gray-600 dark:text-gray-400">{t('days_learned')}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.maxStreak} {t('days')}</p>
                            <p className="text-gray-600 dark:text-gray-400">{t('longest_streak')}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.currentStreak} {t('days')}</p>
                            <p className="text-gray-600 dark:text-gray-400">{t('current_streak')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overall Statistics - This was duplicated and is now removed by ensuring the structure above is correct and not adding it again. */}
            {/* The original Overall Statistics card is above the Activity Heatmap card and should remain as is. */}
        </div>
    );
}