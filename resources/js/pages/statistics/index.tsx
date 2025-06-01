import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { StatisticsDashboard } from '@/components/statistics-dashboard';

interface Props {
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

export default function Index({ weeklyStats, yearlyHeatmap, overallStats }: Props) {
    return (
        <AppLayout>
            <Head title="Statistics" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
                        <p className="text-gray-600">Track your learning progress and performance</p>
                    </div>
                    
                    <StatisticsDashboard 
                        weeklyStats={weeklyStats}
                        yearlyHeatmap={yearlyHeatmap}
                        overallStats={overallStats}
                    />
                </div>
            </div>
        </AppLayout>
    );
}