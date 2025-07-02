import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

type Plan = {
    id: string;
    name: string;
    monthlyPrice: string;
    annualPrice: string;
    billedMonthly: string;
    billedAnnually: string;
    description: string;
    features: string[];
    cta: string;
    popular: boolean;
    stripeProductId: string;
    monthlyPriceId: string;
    yearlyPriceId: string;
};

type UpgradeModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch pricing plans from API
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/pricing-plans');
                const data = await response.json();
                setPlans(data);
                if (data.length > 0) {
                    setSelectedPlan(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen]);

    const handleUpgrade = () => {
        const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
        if (!selectedPlanData) return;

        const priceId = billingCycle === 'yearly' ? selectedPlanData.yearlyPriceId : selectedPlanData.monthlyPriceId;
        const amount = billingCycle === 'yearly' ? selectedPlanData.annualPrice : selectedPlanData.monthlyPrice;
        
        router.visit('/checkout', {
            method: 'get',
            data: {
                plan: billingCycle,
                product_id: selectedPlanData.id,
                price_id: priceId,
                amount: amount
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="p-6 pb-0 sticky top-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 z-10">
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <SparklesIcon className="h-6 w-6 text-yellow-400 animate-pulse" />
                        <span>{t('upgrade_to_clevernote_pro')}</span>
                        <SparklesIcon className="h-6 w-6 text-yellow-400 animate-pulse" />
                    </DialogTitle>
                    <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
                        {t('unlock_full_potential')}
                    </p>
                </DialogHeader>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Billing Cycle Toggle */}
                            <div className="flex justify-center mb-8">
                                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            billingCycle === 'monthly'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                        onClick={() => setBillingCycle('monthly')}
                                    >
                                        {t('monthly')}
                                    </button>
                                    <button
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            billingCycle === 'yearly'
                                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                        onClick={() => setBillingCycle('yearly')}
                                    >
                                        {t('yearly')}
                                        <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                            {t('save_50')}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div className="flex justify-center mb-8">
                                <div className="w-full max-w-md">
                                    <AnimatePresence>
                                        {plans.map((plan) => {
                                            const currentPrice = billingCycle === 'yearly' ? plan.billedAnnually : plan.monthlyPrice;
                                            const period = billingCycle === 'yearly' ? t('month') : t('month');
                                            const billedText = billingCycle === 'yearly' ? t('billed_annually') : t('billed_monthly');
                                            
                                            return (
                                                <motion.div
                                                    key={plan.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3, delay: plans.indexOf(plan) * 0.1 }}
                                                    className={`w-full rounded-xl p-6 border-2 cursor-pointer transition-all duration-300 relative ${
                                                        selectedPlan === plan.id 
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg scale-[1.02]' 
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                    }`}
                                                    onClick={() => setSelectedPlan(plan.id)}
                                                >
                                                   
                                                    <div className="text-center">
                                                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                                        <div className="mb-4">
                                                            <span className="text-4xl font-bold">{currentPrice}</span>
                                                            <span className="text-gray-500 dark:text-gray-400">/{period}</span>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                {billedText}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedPlan === plan.id && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="absolute top-3 right-3 bg-indigo-500 rounded-full p-1"
                                                        >
                                                            <CheckIcon className="h-4 w-4 text-white" />
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Features List */}
                    {!loading && plans.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                            <h3 className="text-lg font-bold mb-4">{t('everything_you_get')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {plans.find(plan => plan.id === selectedPlan)?.features?.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="flex items-start gap-2"
                                    >
                                        <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{typeof feature === 'string' ? t(feature) : t(feature.text)}</span>
                                    </motion.div>
                                )) || []}
                            </div>
                        </div>
                    )}


                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button 
                            className="dark:text-white w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleUpgrade}
                            disabled={loading || plans.length === 0}
                        >
                            {loading ? t('loading') : t(plans.find(plan => plan.id === selectedPlan)?.cta || 'upgrade_now')}
                        </Button>
                        
                        {/* Money-back guarantee */}
                        {/* <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <ShieldCheckIcon className="h-4 w-4" />
                            <span>30-day money-back guarantee</span>
                        </div> */}
                        
                        {/* Star rating */}
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                                ))}
                            </div>
                            <span>4.9/5 from 500+ reviews</span>
                        </div>
                        
                        <button 
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={onClose}
                        >
                            {t('maybe_later')}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}