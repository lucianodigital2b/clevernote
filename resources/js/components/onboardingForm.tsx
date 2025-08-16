import { useForm } from '@inertiajs/react';
import languages from '@/utils/languages.json';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
// Removed UpgradeModal import as it's now handled in dashboard

// Custom components for onboarding form
const CustomButton = ({ children, onClick, type = 'button', disabled = false, variant = 'primary', className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 outline-none focus:ring-2 focus:ring-offset-2';
    const variants = {
        primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500',
        outline: 'border-2 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-indigo-500'
    };
    const sizeStyles = 'h-12 px-8 py-4';
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const CustomInput = ({ value, onChange, placeholder, className = '', ...props }) => {
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`text-black flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
};

const CustomLabel = ({ children, htmlFor, className = '', ...props }) => {
    return (
        <label
            htmlFor={htmlFor}
            className={`text-black text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
            {...props}
        >
            {children}
        </label>
    );
};

const CustomSelect = ({ value, onValueChange, children, placeholder, options = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);
    
    // Find the selected option label based on current value
    const getSelectedLabel = () => {
        if (!value) return '';
        // For languages, find the matching language
        const selectedLang = languages.find(lang => (lang.value ?? 'auto') === value);
        return selectedLang ? selectedLang.label : '';
    };
    
    const handleSelect = (selectedValue, label) => {
        onValueChange(selectedValue);
        setIsOpen(false);
    };
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    
    const selectedLabel = getSelectedLabel();
    
    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-base shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className={selectedLabel ? 'text-black' : 'text-gray-500'}>
                    {selectedLabel || placeholder}
                </span>
                <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-96 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="p-1">
                        {children({ handleSelect })}
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomSelectItem = ({ value, children, onSelect }) => {
    return (
        <div
            onClick={() => onSelect(value, children)}
            className="relative flex w-full cursor-pointer items-center rounded-sm py-2 px-2 text-sm text-black outline-none hover:bg-gray-100 focus:bg-gray-100"
        >
            {children}
        </div>
    );
};

export default function OnboardingForm({ onClose, onComplete }: { onClose?: () => void; onComplete?: () => void }) {
    const [step, setStep] = useState(1);
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        preferred_language: 'en',
        discovery_source: '',
        discovery_source_other: '',
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

    const isStepValid = (currentStep: number): boolean => {
        switch (currentStep) {
            case 1:
                return !!data.preferred_language;
            case 2:
                const hasDiscoverySource = !!data.discovery_source;
                const hasSubjectInterest = !!data.primary_subject_interest;
                // If 'other' is selected, ensure the text input is not empty
                const isOtherValid = data.discovery_source === 'other' ? (data.discovery_source_other?.trim()?.length > 0) : true;
                return hasDiscoverySource && hasSubjectInterest && isOtherValid;
            case 3:
                return !!surveyAnswers['study-experience'];
            case 4:
                return surveyAnswers['study-methods']?.length > 0;
            case 5:
                return !!surveyAnswers['goals'];
            case 6:
                return !!surveyAnswers['study-frequency'];
            default:
                return true;
        }
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        
        if (step !== 6) {
            if (!isStepValid(step)) {
                toast.error(t('please_answer_required_questions'));
                return;
            }
            nextStep();
            return;
        }

        if (!isStepValid(step)) {
            toast.error(t('please_answer_required_questions'));
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
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{t('onboarding_language_title')}</h2>
                            <div className="space-y-4">
                                <CustomLabel htmlFor="preferred_language" translate="yes" className="text-black text-base sm:text-lg font-medium">{t('onboarding_language_select')} <span className="text-red-500">*</span></CustomLabel>
                                <CustomSelect 
                                    value={data.preferred_language}
                                    onValueChange={(value) => setData('preferred_language', value)}
                                    placeholder={t('onboarding_language_placeholder')}
                                >
                                    {({ handleSelect }) => (
                                        languages.map((lang) => (
                                            <CustomSelectItem 
                                                key={lang.value ?? 'auto'} 
                                                value={lang.value ?? 'auto'} 
                                                onSelect={handleSelect}
                                                translate="no"
                                            >
                                                {lang.label}
                                            </CustomSelectItem>
                                        ))
                                    )}
                                </CustomSelect>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{t('onboarding_about_title')}</h2>
                            <div className="space-y-6">
                                <CustomLabel className='mb-4 sm:mb-6 text-black text-base sm:text-lg font-medium' translate="yes">{t('onboarding_discovery_question')} <span className="text-red-500">*</span></CustomLabel>
                                <div className="space-y-4">
                                    {[
                                        { id: 'tiktok', text: t('onboarding_source_tiktok'), icon: '📱' },
                                        { id: 'youtube', text: t('onboarding_source_youtube'), icon: '📺' },
                                        { id: 'instagram', text: t('onboarding_source_instagram'), icon: '📷' },
                                        { id: 'reddit', text: t('onboarding_source_reddit'), icon: '🔴' },
                                        { id: 'google', text: t('onboarding_source_google'), icon: '🔍' },
                                        { id: 'other', text: t('onboarding_source_other'), icon: '💭' }
                                    ].map((source) => (
                                        <div
                                            key={source.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                                data.discovery_source === source.id
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200'
                                            }`}
                                            onClick={() => setData('discovery_source', source.id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{source.icon}</span>
                                                <span className="text-black text-base font-medium">{source.text}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {data.discovery_source === 'other' && (
                                    <CustomInput
                                        className="mt-4"
                                        placeholder={t('onboarding_source_other_placeholder')}
                                        value={data.discovery_source_other}
                                        onChange={(e) => setData('discovery_source_other', e.target.value)}
                                        translate="yes"
                                    />
                                )}
                            </div>
                            <div className="space-y-4">
                                <CustomLabel htmlFor="primary_subject_interest" translate="yes" className="text-black text-base sm:text-lg font-medium">{t('onboarding_subject_interest')} <span className="text-red-500">*</span></CustomLabel>
                                <CustomInput
                                    id="primary_subject_interest"
                                    value={data.primary_subject_interest}
                                    onChange={(e) => setData('primary_subject_interest', e.target.value)}
                                    placeholder={t('onboarding_subject_placeholder')}
                                    translate="yes"
                                />
                            </div>
                        </div>
                    )}



                    {step === 3 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[0].question} <span className="text-red-500">*</span></h2>
                            <div className="space-y-4">
                                {surveyData[0].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                            surveyAnswers['study-experience'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200'
                                        }`}
                                        onClick={() => handleSurveyAnswer('study-experience', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-black text-base font-medium">{option.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[1].question} <span className="text-red-500">*</span></h2>
                            {surveyData[1].description && (
                                <p className="text-center text-black">{surveyData[1].description}</p>
                            )}
                            <div className="space-y-4">
                                {surveyData[1].options.map((option) => {
                                    const isSelected = surveyAnswers['study-methods']?.includes(option.id) || false;
                                    return (
                                        <div
                                            key={option.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200'
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
                                                <span className="text-black text-base font-medium">{option.text}</span>
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
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[2].question} <span className="text-red-500">*</span></h2>
                            <div className="space-y-4">
                                {surveyData[2].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                            surveyAnswers['goals'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200'
                                        }`}
                                        onClick={() => handleSurveyAnswer('goals', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-black text-base font-medium">{option.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6 sm:space-y-8 py-4">
                            <h2 className="text-black text-xl sm:text-2xl font-bold text-center" translate="yes">{surveyData[3].question} <span className="text-red-500">*</span></h2>
                            <div className="space-y-4">
                                {surveyData[3].options.map((option) => (
                                    <div
                                        key={option.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                            surveyAnswers['study-frequency'] === option.id
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200'
                                        }`}
                                        onClick={() => handleSurveyAnswer('study-frequency', option.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="text-black text-base font-medium">{option.text}</span>
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
                        <CustomButton type="button" variant="outline" onClick={prevStep} translate="yes" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4">
                            {t('onboarding_previous')}
                        </CustomButton>
                    )}
                    <CustomButton 
                        type="submit" 
                        className="ml-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={processing || !isStepValid(step)}
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
                    </CustomButton>
                </div>
                </form>
            </div>
        </>
    );
}