import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import languages from '@/utils/languages.json';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
// Removed UpgradeModal import as it's now handled in dashboard

export default function OnboardingForm({ onClose, onComplete }: { onClose?: () => void; onComplete?: () => void }) {
    const [step, setStep] = useState(1);
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        preferred_language: 'en',
        discovery_source: '',
        primary_subject_interest: '',
        study_experience: '',
        study_methods: [],
        goals: '',
        study_frequency: '',
        surveyData: {
            study_experience: '',
            study_methods: [],
            goals: '',
            study_frequency: ''
        }
    });

    const surveyData = [
        {
            id: 'study-experience',
            type: 'multiple-choice',
            question: t('study_experience_question'),
            options: [
            { id: 'beginner', text: t('study_experience_beginner'), icon: '📘' },
            { id: 'intermediate', text: t('study_experience_intermediate'), icon: '📚' },
            { id: 'advanced', text: t('study_experience_advanced'), icon: '🧠' },
            ],
        },
        {
            id: 'study-methods',
            type: 'multiple-select',
            question: t('study_methods_question'),
            description: t('study_methods_description'),
            options: [
            { id: 'notes', text: t('study_methods_notes'), icon: '📝' },
            { id: 'flashcards', text: t('study_methods_flashcards'), icon: '🃏' },
            { id: 'videos', text: t('study_methods_videos'), icon: '🎥' },
            { id: 'quizzes', text: t('study_methods_quizzes'), icon: '❓' },
            { id: 'summaries', text: t('study_methods_summaries'), icon: '📄' },
            ],
        },
        {
            id: 'goals',
            type: 'multiple-choice',
            question: t('goals_question'),
            options: [
            { id: 'improve-grades', text: t('goals_improve_grades'), icon: '🏆' },
            { id: 'stay-organized', text: t('goals_stay_organized'), icon: '📂' },
            { id: 'retain-better', text: t('goals_retain_better'), icon: '🧠' },
            { id: 'study-smarter', text: t('goals_study_smarter'), icon: '⚡' },
            ],
        },
        {
            id: 'study-frequency',
            type: 'multiple-choice',
            question: t('study_frequency_question'),
            options: [
            { id: 'daily', text: t('study_frequency_daily'), icon: '💯' },
            { id: 'few-weekly', text: t('study_frequency_few_weekly'), icon: '🗓️' },
            { id: 'weekly', text: t('study_frequency_weekly'), icon: '⏰' },
            { id: 'rarely', text: t('study_frequency_rarely'), icon: '📉' },
            ],
        },
    ];

    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSurveyAnswer = (questionId: string, answer: any) => {
        setSurveyAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (step !== 6) {
            nextStep();
            return;
        }

        // Update surveyData before submitting
        const updatedData = {
            ...data,
            surveyData: surveyAnswers
        };

        post(route('onboarding.store'), {
            data: updatedData,
            onSuccess: () => {
                toast.success(t('study_plan_generated'));
                // Redirect will be handled by the backend
            },
            onError: (errors) => {
                toast.error(t('onboarding_error'));
                console.error(errors);
            }
        });
    };

    // Upgrade modal handling removed - now handled in dashboard

    return (
        <>
            <div className="max-h-[90vh] overflow-y-auto px-4 py-2">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" translate="yes">
                <div className="mb-8 sm:mb-12 flex justify-center" translate="no">
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className={`h-3 w-12 rounded-full transition-colors duration-300 ${step >= i ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                            </div>
                        ))}
                    </div>
                </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    translate="yes"
                >
                    {step === 1 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{t('onboarding_language_title')}</h2>
                            <div className="space-y-4">
                                <Label htmlFor="preferred_language" translate="yes" className="text-base sm:text-lg font-medium">{t('onboarding_language_select')}</Label>
                                <Select 
                                    value={data.preferred_language}
                                    onValueChange={(value) => setData('preferred_language', value)}
                                >
                                    <SelectTrigger translate="no" className="h-12 text-base">
                                        <SelectValue placeholder={t('onboarding_language_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent translate="no">
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.value ?? 'auto'} value={lang.value ?? 'auto'} translate="no">
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{t('onboarding_about_title')}</h2>
                            <div className="space-y-6">
                                <Label className='mb-4 sm:mb-6 text-base sm:text-lg font-medium' translate="yes">{t('onboarding_discovery_question')}</Label>
                                <div className="space-y-4">
                                    {[
                                        { id: 'tiktok', text: t('onboarding_source_tiktok'), icon: '📱' },
                                        { id: 'youtube', text: t('onboarding_source_youtube'), icon: '📺' },
                                        { id: 'instagram', text: t('onboarding_source_instagram'), icon: '📷' },
                                        { id: 'google', text: t('onboarding_source_google'), icon: '🔍' },
                                        { id: 'other', text: t('onboarding_source_other'), icon: '💭' }
                                    ].map((source) => (
                                        <div
                                            key={source.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                data.discovery_source === source.id
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                            onClick={() => setData('discovery_source', source.id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{source.icon}</span>
                                                <span className="text-base font-medium">{source.text}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {data.discovery_source === 'other' && (
                                    <Input
                                        className="mt-4 h-12 text-base"
                                        placeholder={t('onboarding_source_other_placeholder')}
                                        value={data.discovery_source === 'other' ? data.discovery_source : ''}
                                        onChange={(e) => setData('discovery_source', e.target.value)}
                                        translate="yes"
                                    />
                                )}
                            </div>
                            <div className="space-y-4">
                                <Label htmlFor="primary_subject_interest" translate="yes" className="text-base sm:text-lg font-medium">{t('onboarding_subject_interest')}</Label>
                                <Input
                                    id="primary_subject_interest"
                                    value={data.primary_subject_interest}
                                    onChange={(e) => setData('primary_subject_interest', e.target.value)}
                                    placeholder={t('onboarding_subject_placeholder')}
                                    translate="yes"
                                    className="h-12 text-base"
                                />
                            </div>
                        </div>
                    )}



                    {step === 3 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[0].question}</h2>
                            <div className="space-y-4">
                                {surveyData[0].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            surveyAnswers['study-experience'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                        onClick={() => handleSurveyAnswer('study-experience', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-base font-medium">{option.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[1].question}</h2>
                            {surveyData[1].description && (
                                <p className="text-center text-gray-600 dark:text-gray-400">{surveyData[1].description}</p>
                            )}
                            <div className="space-y-4">
                                {surveyData[1].options.map((option) => {
                                    const isSelected = surveyAnswers['study-methods']?.includes(option.id) || false;
                                    return (
                                        <div
                                            key={option.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                            onClick={() => {
                                                const currentAnswers = surveyAnswers['study-methods'] || [];
                                                const newAnswers = isSelected
                                                    ? currentAnswers.filter((id: string) => id !== option.id)
                                                    : [...currentAnswers, option.id];
                                                handleSurveyAnswer('study-methods', newAnswers);
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{option.icon}</span>
                                                <span className="text-base font-medium">{option.text}</span>
                                                {isSelected && (
                                                    <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[2].question}</h2>
                            <div className="space-y-4">
                                {surveyData[2].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            surveyAnswers['goals'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                        onClick={() => handleSurveyAnswer('goals', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-base font-medium">{option.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[3].question}</h2>
                            <div className="space-y-4">
                                {surveyData[3].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                            surveyAnswers['study-frequency'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                        onClick={() => handleSurveyAnswer('study-frequency', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-base font-medium">{option.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

                <div className="flex justify-between space-x-4 sm:space-x-6 pt-8 sticky bottom-0 pb-6 sm:pb-8 mt-8">
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={prevStep} translate="yes" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                            {t('onboarding_previous')}
                        </Button>
                    )}
                    <Button 
                        type="submit" 
                        className="ml-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700" 
                        disabled={processing}
                        translate="yes"
                    >
                        {processing && step === 6 ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>{t('generating_study_plan')}</span>
                            </div>
                        ) : (
                            step < 6 ? t('onboarding_next') : t('onboarding_complete')
                        )}
                    </Button>
                </div>
                </form>
            </div>
        </>
    );
}