import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

type Plan = {
    id: string;
    name: string;
    price: string;
    period: string;
    billed?: string;
    popular: boolean;
    savings?: string;
};

type UpgradeModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

    // Plan details
    const plans: Plan[] = [
        { id: 'weekly', name: 'Weekly', price: '9.99', period: 'week', popular: false },
        { id: 'monthly', name: 'Monthly', price: '17.99', period: 'month', popular: true },
        { id: 'yearly', name: 'Yearly', price: '12.99', period: 'month', billed: 'yearly', popular: false, savings: '28%' }
    ];

    // Features list
    const features = [
        "Unlimited note generations",
        "Unlimited audio or phone calls",
        "Unlimited podcasts and youtube videos",
        "Unlimited quiz and flashcards",
        "Support for 100+ languages",
        "Best-in-class Transcription and Summarization",
        "Customer support 24/7",
        "Priority Access to new features",
        "And more..."
    ];

    const handleUpgrade = () => {
        // Handle the upgrade logic here
        console.log(`Upgrading to ${selectedPlan} plan`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-yellow-400 animate-pulse" />
                        <span>Upgrade to CleverNote Pro</span>
                        <SparklesIcon className="h-6 w-6 text-yellow-400 animate-pulse" />
                    </DialogTitle>
                    <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
                        Unlock the full potential of your note-taking experience
                    </p>
                </DialogHeader>

                <div className="p-6">
                    {/* Plan Selection */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <AnimatePresence>
                            {plans.map((plan) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: plans.indexOf(plan) * 0.1 }}
                                    className={`flex-1 rounded-xl p-5 border-2 cursor-pointer transition-all duration-300 ${
                                        selectedPlan === plan.id 
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-[1.02]' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.popular && (
                                        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
                                            MOST POPULAR
                                        </div>
                                    )}
                                    {plan.savings && (
                                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 ml-2">
                                            SAVE {plan.savings}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-bold">{plan.name}</h3>
                                    <div className="mt-2 mb-4">
                                        <span className="text-3xl font-bold">${plan.price}</span>
                                        <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                                        {plan.billed && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400 block">
                                                Billed {plan.billed}
                                            </span>
                                        )}
                                    </div>
                                    {selectedPlan === plan.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute top-3 right-3 bg-blue-500 rounded-full p-1"
                                        >
                                            <CheckIcon className="h-4 w-4 text-white" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Features List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                        <h3 className="text-lg font-bold mb-4">Everything you get:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex items-start gap-2"
                                >
                                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button 
                            className="w-full py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                            onClick={handleUpgrade}
                        >
                            Upgrade Now
                        </Button>
                        <button 
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={onClose}
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}