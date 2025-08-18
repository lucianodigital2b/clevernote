import React from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import FocusLeaderboard from '@/components/Focus/FocusLeaderboard';

export default function FocusLeaderboardPage() {
    const { t } = useTranslation();

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Focus Timer',
                    href: '/focus',
                },
                {
                    title: 'Leaderboard',
                    href: '/focus/leaderboard',
                },
            ]}
        >
            <Head title="Focus Leaderboard" />
            
            <div className="py-4 sm:py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-[#212121] overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                        <Trophy className="h-8 w-8 text-yellow-500" />
                                        Focus Leaderboard
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">
                                        See how you rank against other focused minds
                                    </p>
                                </div>
                            </div>

                            <div className="px-2 sm:px-0">
                                <FocusLeaderboard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}