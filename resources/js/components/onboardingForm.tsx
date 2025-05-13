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

export default function OnboardingForm({ onClose }: { onClose?: () => void }) {
    const [step, setStep] = useState(1);
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        preferred_language: 'en',
        discovery_source: '',
        primary_subject_interest: '',
        learning_goals: ''
    });

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (step !== 3) {
            nextStep();
            return;
        }
        post(route('onboarding.store'), {
            onSuccess: () => {
                toast.success(t('onboarding_success'));
                window.location.reload()
            },
            onError: (errors) => {
                toast.error(t('onboarding_error'));
                console.error(errors);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-8 flex justify-center">
                <div className="flex items-center space-x-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className={`h-2 w-2 rounded-full ${step >= i ? 'bg-primary' : 'bg-gray-300'}`} />
                            {i < 3 && <div className={`h-0.5 w-8 ${step > i ? 'bg-primary' : 'bg-gray-300'}`} />}
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
                >
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">{t('onboarding_language_title')}</h2>
                            <div className="space-y-2">
                                <Label htmlFor="preferred_language">{t('onboarding_language_select')}</Label>
                                <Select 
                                    value={data.preferred_language}
                                    onValueChange={(value) => setData('preferred_language', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('onboarding_language_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.value ?? 'auto'} value={lang.value ?? 'auto'}>
                                                {lang.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">{t('onboarding_about_title')}</h2>
                            <div className="space-y-3">
                                <Label className='mb-5'>{t('onboarding_discovery_question')}</Label>
                                <RadioGroup
                                    value={data.discovery_source}
                                    onValueChange={(value) => setData('discovery_source', value)}
                                    className="space-y-2"
                                >
                                    {['TikTok', 'YouTube', 'Instagram', 'Google', 'Other'].map((source) => (
                                        <div key={source} className="flex items-center space-x-2">
                                            <RadioGroupItem value={source.toLowerCase()} id={`source-${source.toLowerCase()}`} />
                                            <Label htmlFor={`source-${source.toLowerCase()}`}>{t(`onboarding_source_${source.toLowerCase()}`)}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {data.discovery_source === 'other' && (
                                    <Input
                                        className="mt-2"
                                        placeholder={t('onboarding_source_other_placeholder')}
                                        value={data.discovery_source === 'other' ? data.discovery_source : ''}
                                        onChange={(e) => setData('discovery_source', e.target.value)}
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primary_subject_interest">{t('onboarding_subject_interest')}</Label>
                                <Input
                                    id="primary_subject_interest"
                                    value={data.primary_subject_interest}
                                    onChange={(e) => setData('primary_subject_interest', e.target.value)}
                                    placeholder={t('onboarding_subject_placeholder')}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">{t('onboarding_goals_title')}</h2>
                            <div className="space-y-2">
                                <Label htmlFor="learning_goals">{t('onboarding_goals_question')}</Label>
                                <Input
                                    id="learning_goals"
                                    value={data.learning_goals}
                                    onChange={(e) => setData('learning_goals', e.target.value)}
                                    placeholder={t('onboarding_goals_placeholder')}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="flex justify-between space-x-4 pt-4">
                {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                        {t('onboarding_previous')}
                    </Button>
                )}
                <Button 
                    type="submit" 
                    className="ml-auto" 
                    disabled={processing}
                >
                    {step < 3 ? t('onboarding_next') : (processing ? t('onboarding_saving') : t('onboarding_complete'))}
                </Button>
            </div>
        </form>
    );
}