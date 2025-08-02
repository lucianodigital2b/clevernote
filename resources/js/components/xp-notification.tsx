import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';

interface XPNotificationProps {
    xpReward?: {
        success: boolean;
        xp_gained: number;
        total_xp: number;
        old_level: number;
        new_level: number;
        leveled_up: boolean;
    };
    onClose?: () => void;
}

export function XPNotification({ xpReward, onClose }: XPNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (xpReward?.success) {
            setIsVisible(true);
            // Small delay to ensure the element is mounted before starting animation
            setTimeout(() => setIsAnimating(true), 25);
            
            // Hide floating XP after 1.5 seconds (faster)
            const timer = setTimeout(() => {
                setIsAnimating(false);
                // Wait for fade out animation before hiding completely
                setTimeout(() => {
                    setIsVisible(false);
                    onClose?.();
                }, 250);
            }, 1500);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [xpReward, onClose]);

    if (!xpReward?.success || !isVisible) {
        return null;
    }

    const getEmoji = () => {
        if (xpReward.leveled_up) return "🎉";
        if (xpReward.xp_gained >= 50) return "⭐";
        if (xpReward.xp_gained >= 25) return "✨";
        return "💫";
    };

    return (
        <>
            {/* Floating XP Animation */}
            <div className="fixed top-32 left-32 z-50 pointer-events-none">
                <div className={`transition-all duration-300 ease-out transform ${
                    isAnimating 
                        ? 'translate-x-0 opacity-100 scale-100' 
                        : '-translate-x-16 opacity-0 scale-90'
                }`}>
                    <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 px-8 py-6 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                        <div className="text-5xl animate-bounce">
                            {getEmoji()}
                        </div>
                        <div className="text-center space-y-1">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 animate-pulse">
                                +{xpReward.xp_gained} XP
                            </div>
                            {xpReward.leveled_up && (
                                <div className="flex items-center gap-2 justify-center">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                        Level {xpReward.new_level}!
                                    </div>
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                </div>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {xpReward.leveled_up ? 'Congratulations!' : 'Experience gained!'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                Total: {xpReward.total_xp} XP
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}