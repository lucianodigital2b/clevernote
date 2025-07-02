import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StudyPlanPreviewProps {
    user: {
        study_plan?: {
            plan_title?: string;
            plan_description?: string;
            weekly_goals?: Array<{
                week: number;
                title: string;
                description: string;
            }>;
        };
    };
    onViewStudyPlan: () => void;
}

export default function StudyPlanPreview({ user, onViewStudyPlan }: StudyPlanPreviewProps) {
    const { t } = useTranslation();

    if (!user.study_plan) {
        return (
            <section className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">{t('study_plan')}</h2>
                        <p className="text-neutral-500">{t('your_personalized_study_schedule')}</p>
                    </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('no_study_plan_available')}
                    </h3>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold">{t('study_plan')}</h2>
                    <p className="text-neutral-500">{t('your_personalized_study_schedule')}</p>
                </div>
                <Button 
                    onClick={onViewStudyPlan}
                    className="flex items-center gap-2"
                >
                    <FileText className="h-4 w-4" />
                    {t('view_study_plan')}
                </Button>
            </div>
            
            {/* Study Plan Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            {user.study_plan.plan_title || t('personalized_study_plan')}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {user.study_plan.plan_description || t('ai_generated_study_schedule')}
                        </p>
                    </div>
                </div>
                
                {user.study_plan.weekly_goals && user.study_plan.weekly_goals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                        {user.study_plan.weekly_goals.slice(0, 4).map((goal: any, index: number) => (
                            <div key={goal.week} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                    {t('week')} {goal.week}
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                    {goal.title}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {goal.description}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}