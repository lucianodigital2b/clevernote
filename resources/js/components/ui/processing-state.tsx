import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Brain, FileText, Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type ProcessingStateProps = {
    state: 'processing' | 'failed';
    onRetry?: () => void;
};

const steps = [
    {
        id: 1,
        title: 'Analyzing Content',
        description: 'Reading and understanding your note',
        icon: FileText,
        duration: 2000
    },
    {
        id: 2,
        title: 'AI Processing',
        description: 'Applying intelligent algorithms',
        icon: Zap,
        duration: 3000
    },
    {
        id: 3,
        title: 'Finalizing',
        description: 'Preparing your enhanced content',
        icon: CheckCircle,
        duration: 1500
    }
];

function AnimatedStepper() {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentStep < steps.length - 1) {
                setCompletedSteps(prev => [...prev, currentStep]);
                setCurrentStep(prev => prev + 1);
            }
        }, steps[currentStep]?.duration || 2000);

        return () => clearTimeout(timer);
    }, [currentStep]);

    return (
        <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800" style={{ height: `${(steps.length - 1) * 8 * 4}px` }}></div>
            
            {/* Animated Progress Line */}
            <motion.div 
                className="absolute left-6 top-6 w-0.5 bg-gradient-to-b from-blue-500 to-blue-600"
                initial={{ height: 0 }}
                animate={{ 
                    height: `${(completedSteps.length / (steps.length - 1)) * (steps.length - 1) * 8 * 4}px`
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            
            <div className="space-y-8">
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isCurrent = currentStep === index;
                    const Icon = step.icon;
                    
                    return (
                        <motion.div
                            key={step.id}
                            className="relative flex items-start"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                        >
                            {/* Step Circle */}
                            <motion.div
                                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                                    isCompleted
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : isCurrent
                                        ? 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'
                                }`}
                                animate={{
                                    scale: isCurrent ? [1, 1.1, 1] : 1,
                                    rotate: isCompleted ? 360 : 0
                                }}
                                transition={{
                                    scale: {
                                        duration: 2,
                                        repeat: isCurrent ? Infinity : 0,
                                        ease: "easeInOut"
                                    },
                                    rotate: {
                                        duration: 0.6,
                                        ease: "easeInOut"
                                    }
                                }}
                            >
                                <Icon className="w-5 h-5" />
                                
                                {/* Pulse Effect for Current Step */}
                                {isCurrent && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                                        animate={{
                                            scale: [1, 2.2],
                                            opacity: [0.7, 0]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                            repeatType: "loop"
                                        }}
                                    />
                                )}
                            </motion.div>
                            
                            {/* Step Content */}
                            <div className="ml-4 flex-1">
                                <motion.h4
                                    className={`font-semibold transition-colors duration-300 ${
                                        isCompleted || isCurrent
                                            ? 'text-neutral-900 dark:text-neutral-100'
                                            : 'text-neutral-500 dark:text-neutral-400'
                                    }`}
                                    animate={{
                                        opacity: isCurrent ? [0.7, 1, 0.7] : 1
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: isCurrent ? Infinity : 0,
                                        ease: "easeInOut"
                                    }}
                                >
                                    {step.title}
                                </motion.h4>
                                <p className={`text-sm transition-colors duration-300 ${
                                    isCompleted || isCurrent
                                        ? 'text-neutral-600 dark:text-neutral-300'
                                        : 'text-neutral-400 dark:text-neutral-500'
                                }`}>
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export function ProcessingState({ state, onRetry }: ProcessingStateProps) {
    if (state === 'processing') {
        return (
            <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/5">
                <CardContent className="flex flex-col items-center justify-center min-h-[500px] p-12">
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                            Processing Your Note
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400">
                            Our AI is working its magic on your content
                        </p>
                    </motion.div>
                    
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <AnimatedStepper />
                    </motion.div>
                </CardContent>
            </Card>
        );
    }

    if (state === 'failed') {
        return (
            <Card className="border-2 border-dashed border-red-200 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="flex flex-col items-center justify-center min-h-[500px] p-12">
                    <div className="relative">
                        <div className="rounded-full h-16 w-16 bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div className="text-center mt-6">
                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            Processing failed
                        </h3>
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                            We encountered an error while processing your note. This could be due to content complexity or a temporary service issue.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                                onClick={onRetry}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Brain className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                        <p className="text-xs text-neutral-500 mt-4">
                            If this problem persists, please contact support
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}