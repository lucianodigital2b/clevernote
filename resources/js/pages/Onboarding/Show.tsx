import { Head } from '@inertiajs/react';
import OnboardingForm from '@/components/onboardingForm';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import languages from '@/utils/languages.json';

export default function OnboardingShow() {
    const { t, i18n } = useTranslation();
    const { auth } = usePage().props;
    const user = (auth as any).user;

    const handleComplete = () => {
        console.log('chegou');
        
        // Redirect to dashboard after completion
        // router.visit('/dashboard');
    };

    const handleLanguageChange = (value: string) => {
        if (value) {
            i18n.changeLanguage(value);
            localStorage.setItem('i18nextLng', value);
        }
    };

    return (
        <>
            <Head title={t('Welcome to Clevernote')} />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                {/* Language Selector - Top Right */}
                <div className="absolute top-4 right-4 z-10">
                    <Select onValueChange={handleLanguageChange} defaultValue={i18n.language}>
                        <SelectTrigger className="w-[140px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <SelectValue placeholder="Language" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {languages
                                .filter(lang => lang.value && ['en', 'es', 'pt'].includes(lang.value))
                                .map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value || ''}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="w-full max-w-2xl">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[600px]">
                        <div className="px-6 py-8 sm:px-8">
                            {/* <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {t('welcome_to_clevernote')}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {t('personalize_experience')}
                                </p>
                            </div> */}
                            
                            <OnboardingForm onComplete={handleComplete} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}