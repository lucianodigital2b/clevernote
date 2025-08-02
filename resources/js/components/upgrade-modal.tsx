import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

type PricingData = {
    amount: number;
    currency: string;
    interval: string;
    formatted_amount: string;
};

type UpgradeModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const { t } = useTranslation();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
    const [pricingData, setPricingData] = useState<{
        monthly: PricingData | null;
        yearly: PricingData | null;
    }>({
        monthly: null,
        yearly: null
    });
    const [loadingPricing, setLoadingPricing] = useState(true);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    // Reset timer when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(120);
        }
    }, [isOpen]);

    // Fetch pricing data when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchPricingData = async () => {
            setLoadingPricing(true);
            try {
                // Fetch both monthly and yearly pricing
                const [monthlyResponse, yearlyResponse] = await Promise.all([
                    fetch('/api/pricing-data?plan=monthly', { credentials: 'include' }),
                    fetch('/api/pricing-data?plan=yearly', { credentials: 'include' })
                ]);

                const monthlyData = await monthlyResponse.json();
                const yearlyData = await yearlyResponse.json();

                setPricingData({
                    monthly: monthlyData,
                    yearly: yearlyData
                });
            } catch (error) {
                console.error('Failed to fetch pricing data:', error);
            } finally {
                setLoadingPricing(false);
            }
        };

        fetchPricingData();
    }, [isOpen]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Calculate savings percentage
    const calculateSavingsPercentage = () => {
        if (!pricingData.monthly || !pricingData.yearly) return 0;
        
        const monthlyYearlyTotal = pricingData.monthly.amount * 12;
        const yearlyTotal = pricingData.yearly.amount;
        const savings = ((monthlyYearlyTotal - yearlyTotal) / monthlyYearlyTotal) * 100;
        
        return Math.round(savings);
    };

    // Format yearly price per month
    const getYearlyPricePerMonth = () => {
        if (!pricingData.yearly) return '$0.00';
        const monthlyEquivalent = pricingData.yearly.amount / 12;
        return `$${monthlyEquivalent.toFixed(2)}`;
    };

    const handleUpgrade = () => {
        router.visit('/billing/checkout', {
            method: 'get',
            data: {
                plan: billingCycle
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full h-full overflow-y-auto relative"
            >
                {/* Timer Badge and Close Button */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
                    {/* Countdown Timer Badge */}
                    <div className="px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                        <span className="text-sm font-medium text-gray-700">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex items-center justify-center min-h-full py-14 px-4 md:p-8">
                    <div className="w-full max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {t('upgrade_modal_title')} <span className="text-purple-600">{t('upgrade_modal_title_highlight')}</span>
                            </h1>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Left Side - Features and Pricing */}
                            <div className="space-y-8">
                                {/* Features */}
                                <div className="space-y-4">
                                    {[
                                        t('upgrade_modal_feature_unlimited'),
                                        t('upgrade_modal_feature_quizzes'),
                                        t('upgrade_modal_feature_sources'),
                                        t('upgrade_modal_feature_chat'),
                                        t('upgrade_modal_feature_secure')
                                    ].map((feature, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <CheckIcon className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <span className="text-gray-700 font-medium">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pricing Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                                            billingCycle === 'yearly'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        {/* Green Save Banner */}
                                        <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
                                            {loadingPricing ? t('upgrade_modal_save_percent') : `Save ${calculateSavingsPercentage()}%`}
                                        </div>
                                        
                                        <div className="p-4">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {loadingPricing ? t('upgrade_modal_price_yearly') : `${getYearlyPricePerMonth()} / month`}
                                                </div>
                                                <div className="text-sm text-gray-500">{t('upgrade_modal_price_yearly_billing')}</div>
                                            </div>
                                        </div>
                                        
                                        {billingCycle === 'yearly' && (
                                            <div className="absolute top-12 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                <CheckIcon className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`relative rounded-xl border-2 transition-all ${
                                            billingCycle === 'monthly'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {loadingPricing ? t('upgrade_modal_price_monthly') : `${pricingData.monthly?.formatted_amount || '$0.00'} / month`}
                                                </div>
                                                <div className="text-sm text-gray-500">{t('upgrade_modal_price_monthly_billing')}</div>
                                            </div>
                                        </div>
                                        
                                        {billingCycle === 'monthly' && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                                <CheckIcon className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Main CTA Button */}
                                <Button
                                    onClick={handleUpgrade}
                                    className="w-full py-4 text-lg font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                                >
                                    {t('upgrade_modal_cta_button')}
                                </Button>

                                {/* No risk text */}
                                <p className="text-center text-sm text-gray-600">
                                    {t('upgrade_modal_no_risk')}
                                </p>

                                {/* User avatars and count */}
                                <div className="flex items-center justify-center gap-3">
                                    <div className="flex -space-x-2">
                                        {['300-1.jpg', '300-12.jpg', '300-20.jpg', '300-5.jpg'].map((avatar, i) => (
                                            <img
                                                key={i}
                                                src={`/avatars/${avatar}`}
                                                alt={`User ${i + 1}`}
                                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 font-medium">
                                        {t('upgrade_modal_others_started')}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side - Creative Notebook and Timeline */}
                            <div className="flex flex-col items-center space-y-8">
                                {/* Creative Notebook Illustration */}
                                <div className="relative">
                                    <img src="/criatividade.png" alt="" className='w-50' />
                                </div>

                                {/* Timeline */}
                                <div className="w-full max-w-sm space-y-4">
                                    {(() => {
                                        const today = new Date();
                                        const reminderDate = new Date(today);
                                        reminderDate.setDate(today.getDate() + 6); // Day 7 of trial
                                        const endDate = new Date(today);
                                        endDate.setDate(today.getDate() + 7); // Day 8, trial ends
                                        
                                        const formatDate = (date: Date) => {
                                            return date.toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                day: 'numeric' 
                                            });
                                        };
                                        
                                        return (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-purple-600 font-bold text-sm">1</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{t('trial_timeline_today')}</div>
                                                        <div className="text-sm text-gray-600">{t('trial_timeline_today_description')}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-purple-600 font-bold text-sm">7</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{formatDate(reminderDate)}</div>
                                                        <div className="text-sm text-gray-600">{t('trial_timeline_reminder_description')}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-purple-600 font-bold text-sm">8</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{formatDate(endDate)}</div>
                                                        <div className="text-sm text-gray-600">{t('trial_timeline_end_description')}</div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}