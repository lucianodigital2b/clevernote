import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatisticsProps {
    weeklyStats: any[];
    yearlyHeatmap: any;
    overallStats: {
        totalQuestions: number;
        accuracy: number;
        currentStreak: number;
        maxStreak: number;
        dailyAverage: number;
    };
}

export function StatisticsDashboard({ weeklyStats, yearlyHeatmap, overallStats }: StatisticsProps) {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
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
    
    // Generate heatmap grid (similar to GitHub)
    const generateHeatmapGrid = () => {
        const weeks = [];
        const startDate = new Date(new Date().getFullYear(), 0, 1);
        const endDate = new Date();
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayStats = yearlyHeatmap[dateStr];
            const activity = dayStats ? (dayStats.quiz_total_questions + dayStats.flashcard_reviews) : 0;
            
            weeks.push({
                date: dateStr,
                activity,
                level: getActivityLevel(activity)
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return weeks;
    };
    
    const getActivityLevel = (activity: number) => {
        if (activity === 0) return 0;
        if (activity < 10) return 1;
        if (activity < 25) return 2;
        if (activity < 50) return 3;
        return 4;
    };
    
    const heatmapData = generateHeatmapGrid();
    
    return (
        <div className="space-y-6">
            {/* Weekly Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Performance over the weeks</span>
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                You
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                Goal
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex gap-2">
                        <button className="px-3 py-1 text-sm bg-gray-100 rounded">1 month</button>
                        <button className="px-3 py-1 text-sm bg-gray-100 rounded">3</button>
                        <button className="px-3 py-1 text-sm bg-gray-100 rounded">6</button>
                        <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded">2025</button>
                    </div>
                    
                    <div className="h-64 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="questions" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-3xl font-bold">{overallStats.accuracy}%</p>
                            <p className="text-sm text-gray-600">Your accuracy</p>
                            <p className="text-xs text-gray-500">Goal: 98%</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{overallStats.totalQuestions.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Questions answered</p>
                            <p className="text-xs text-gray-500">Goal: 12413</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Activity Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle>Study Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            Studied {overallStats.dailyAverage} cards in {Math.round(overallStats.dailyAverage * 0.15)} minutes today ({(overallStats.dailyAverage * 0.15).toFixed(1)}s/card)
                        </p>
                    </div>
                    
                    {/* Month labels */}
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Jan '25</span>
                        <span>Feb '25</span>
                        <span>Mar '25</span>
                        <span>Apr '25</span>
                        <span>May '25</span>
                        <span>Jun '25</span>
                        <span>Jul '25</span>
                        <span>Aug '25</span>
                        <span>Sep '25</span>
                    </div>
                    
                    {/* Day labels */}
                    <div className="flex">
                        <div className="flex flex-col text-xs text-gray-500 mr-2 justify-between h-20">
                            <span>M</span>
                            <span>W</span>
                            <span>F</span>
                            <span>S</span>
                        </div>
                        
                        {/* Heatmap Grid */}
                        <div className="grid grid-cols-53 gap-1 mb-4">
                            {heatmapData.map((day, index) => (
                                <div
                                    key={index}
                                    className={`w-3 h-3 rounded-sm ${
                                        day.level === 0 ? 'bg-gray-100' :
                                        day.level === 1 ? 'bg-green-200' :
                                        day.level === 2 ? 'bg-green-300' :
                                        day.level === 3 ? 'bg-green-400' :
                                        'bg-green-500'
                                    }`}
                                    title={`${day.date}: ${day.activity} activities`}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.dailyAverage} cards</p>
                            <p className="text-gray-600">Daily average</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">100%</p>
                            <p className="text-gray-600">Days learned</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.maxStreak} days</p>
                            <p className="text-gray-600">Longest streak</p>
                        </div>
                        <div>
                            <p className="font-semibold text-green-600">{overallStats.currentStreak} days</p>
                            <p className="text-gray-600">Current streak</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}