import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Zap, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function How() {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        {
            id: 1,
            title: t('how_upload_your_content'),
            description: t('how_upload_description'),
            icon: Upload,
            details: [
                t('how_upload_detail_1'),
                t('how_upload_detail_2'),
                t('how_upload_detail_3')
            ]
        },
        {
            id: 2,
            title: t('how_choose_what_to_create'),
            description: t('how_choose_description'),
            icon: Zap,
            details: [
                t('how_choose_detail_1'),
                t('how_choose_detail_2'),
                t('how_choose_detail_3'),
                t('how_choose_detail_4')
            ]
        },
        {
            id: 3,
            title: t('how_study_smarter'),
            description: t('how_study_description'),
            icon: BookOpen,
            details: [
                t('how_study_detail_1'),
                t('how_study_detail_2'),
                t('how_study_detail_3'),
                t('how_study_detail_4')
            ]
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = steps[currentStep - 1];
    const IconComponent = currentStepData.icon;

    return (
        <>
            <Head title={t('how_page_title')} />
            
            <div className="min-h-screen py-12 px-4" style={{backgroundColor: '#1D1E1E'}}>
                <div className="max-w-4xl mx-auto">
                    {/* Back to Dashboard Button */}
                    <div className="mb-8">
                        <Button 
                            variant="outline" 
                            asChild
                            className="text-white border-gray-600 hover:bg-gray-700"
                        >
                            <a href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                {t('back')}
                            </a>
                        </Button>
                    </div>
                    
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('how_main_title')}
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t('how_main_subtitle')}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="relative flex justify-center items-center mb-4">
                            {/* Background line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-600 transform -translate-y-1/2" />
                            
                            {/* Animated progress line */}
                            <div 
                                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 transform -translate-y-1/2 transition-all duration-500 ease-in-out"
                                style={{
                                    width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
                                }}
                            />
                            
                            {/* Step circles */}
                            <div className="relative flex justify-between w-full">
                                {steps.map((step) => (
                                    <div 
                                        key={step.id} 
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 cursor-pointer ${
                                            currentStep >= step.id 
                                                ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                        }`}
                                        onClick={() => setCurrentStep(step.id)}
                                    >
                                        {step.id}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center text-sm text-gray-400">
                            {t('how_step')} {currentStep} of {steps.length}
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <Card className="mb-8 shadow-xl">
                        <CardHeader className="text-center pb-6">
                            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl mb-2">{currentStepData.title}</CardTitle>
                            <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {currentStepData.details.map((detail, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                                        <p className="text-gray-700 dark:text-gray-300">{detail}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <Button 
                            variant="ghost" 
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="px-6"
                        >
                            {t('how_previous')}
                        </Button>
                        
                        <div className="flex gap-2">
                            {steps.map((step) => (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        currentStep === step.id 
                                            ? 'bg-blue-600' 
                                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                    }`}
                                />
                            ))}
                        </div>

                        {currentStep < steps.length ? (
                            <Button onClick={nextStep} className="px-6">
                                {t('how_next')}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button asChild className="px-6">
                                <a href="/dashboard">
                                    {t('how_get_started')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}