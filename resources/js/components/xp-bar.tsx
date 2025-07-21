import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface XPBarProps {
    user: {
        level: number;
        xp: number;
        name: string;
    };
}

export function XPBar({ user: initialUser }: XPBarProps) {
    const { props } = usePage();
    const [user, setUser] = useState(initialUser);

    // Update user data when page props change (live updates)
    useEffect(() => {
        if (props.auth?.user) {
            setUser({
                level: props.auth.user.level || initialUser.level,
                xp: props.auth.user.xp || initialUser.xp,
                name: props.auth.user.name || initialUser.name,
            });
        }
    }, [props.auth?.user, initialUser]);

    // Calculate level progress using the same formula as the PHP service with plateau system
    const getLevelProgress = (level: number, xp: number) => {
        const BASE_XP = 200;
        const GROWTH_FACTOR = 1.15;
        const PLATEAU_LEVEL = 20;

        // Calculate XP required for current level with plateau system (matches PHP exactly)
        const getXPForLevel = (targetLevel: number): number => {
            if (targetLevel <= 1) return 0;
            
            if (targetLevel <= PLATEAU_LEVEL) {
                // Exponential growth up to plateau level
                return Math.round(BASE_XP * Math.pow(GROWTH_FACTOR, targetLevel - 2));
            } else {
                // Linear progression after plateau level
                const plateauXP = Math.round(BASE_XP * Math.pow(GROWTH_FACTOR, PLATEAU_LEVEL - 2));
                const levelsAfterPlateau = targetLevel - PLATEAU_LEVEL;
                const xpPerLevelAfterPlateau = plateauXP * 0.1; // Each level after 20 requires 10% of level 20's total XP
                
                return plateauXP + Math.round(levelsAfterPlateau * xpPerLevelAfterPlateau);
            }
        };

        const currentLevelXP = getXPForLevel(level);
        const nextLevelXP = getXPForLevel(level + 1);

        const progressInLevel = xp - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;
        const progressPercentage = xpNeededForLevel > 0 ? (progressInLevel / xpNeededForLevel) * 100 : 100;

        return {
            progressInLevel: Math.max(0, progressInLevel),
            xpToNextLevel: Math.max(0, nextLevelXP - xp),
            progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
            isMaxLevel: false, // Never max level with infinite levels
            isPlateau: level >= PLATEAU_LEVEL,
            currentLevelXP,
            nextLevelXP,
            xpNeededForLevel,
        };
    };

    const progress = getLevelProgress(user.level, user.xp);

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            {/* Level Badge */}
            <div className="flex items-center gap-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    progress.isPlateau 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`}>
                    <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                    Lv.{user.level}
                    {progress.isPlateau && <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">★</span>}
                </span>
            </div>

            {/* XP Progress Bar */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {progress.progressInLevel.toLocaleString()} / {progress.xpNeededForLevel.toLocaleString()} XP
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {progress.xpToNextLevel.toLocaleString()} to next
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ease-out ${
                            progress.isPlateau 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                                : 'bg-gradient-to-r from-purple-500 to-blue-500'
                        }`}
                        style={{ width: `${progress.progressPercentage}%` }}
                    />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center">
                    {progress.progressPercentage.toFixed(1)}% ({user.xp.toLocaleString()} total XP)
                </div>
            </div>

            {/* Star Icon for visual appeal */}
            <Star className={`w-4 h-4 ${progress.isPlateau ? 'text-orange-500' : 'text-yellow-500'}`} fill="currentColor" />
        </div>
    );
}