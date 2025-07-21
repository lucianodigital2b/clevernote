<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class XPService
{
    // XP rewards for different actions
    const XP_REWARDS = [
        'complete_quiz' => 50,
        'complete_flashcard_set' => 30,
        'generate_note' => 20,
        'create_quiz' => 25,
        'create_flashcard_set' => 15,
        'daily_login' => 10,
    ];

    // Base XP required for level 2 (level 1 starts at 0)
    const BASE_XP = 200;
    
    // Growth factor for exponential level progression (up to level 20)
    const GROWTH_FACTOR = 1.15;
    
    // Level where difficulty plateaus
    const PLATEAU_LEVEL = 20;

    /**
     * Award XP to a user for a specific action
     */
    public function awardXP(User $user, string $action, int $customAmount = null): array
    {
        $xpAmount = $customAmount ?? self::XP_REWARDS[$action] ?? 0;
        
        if ($xpAmount <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid XP amount or action',
            ];
        }

        $oldXP = $user->xp;
        $oldLevel = $user->level;
        
        // Add XP
        $user->xp += $xpAmount;
        
        // Calculate new level
        $newLevel = $this->calculateLevel($user->xp);
        $leveledUp = $newLevel > $oldLevel;
        
        if ($leveledUp) {
            $user->level = $newLevel;
        }
        
        $user->save();

        Log::info("XP awarded", [
            'user_id' => $user->id,
            'action' => $action,
            'xp_amount' => $xpAmount,
            'old_xp' => $oldXP,
            'new_xp' => $user->xp,
            'old_level' => $oldLevel,
            'new_level' => $user->level,
            'leveled_up' => $leveledUp,
        ]);

        return [
            'success' => true,
            'xp_gained' => $xpAmount,
            'total_xp' => $user->xp,
            'old_level' => $oldLevel,
            'new_level' => $user->level,
            'leveled_up' => $leveledUp,
            'progress' => $this->getLevelProgress($user),
        ];
    }

    /**
     * Calculate level based on total XP using exponential formula with plateau
     */
    public function calculateLevel(int $totalXP): int
    {
        if ($totalXP < self::BASE_XP) {
            return 1;
        }
        
        // Calculate XP required for plateau level
        $plateauXP = $this->getXPForLevel(self::PLATEAU_LEVEL);
        
        if ($totalXP < $plateauXP) {
            // Use exponential growth up to plateau level
            $level = floor(log($totalXP / self::BASE_XP) / log(self::GROWTH_FACTOR)) + 2;
            return max(1, min(self::PLATEAU_LEVEL, (int) $level));
        } else {
            // Linear progression after plateau level
            $excessXP = $totalXP - $plateauXP;
            $xpPerLevelAfterPlateau = $plateauXP * 0.1; // Each level after 20 requires 10% of level 20's total XP
            $additionalLevels = floor($excessXP / $xpPerLevelAfterPlateau);
            
            return self::PLATEAU_LEVEL + (int) $additionalLevels;
        }
    }

    /**
     * Calculate XP required for a specific level with plateau system
     */
    public function getXPForLevel(int $level): int
    {
        if ($level <= 1) {
            return 0;
        }
        
        if ($level <= self::PLATEAU_LEVEL) {
            // Exponential growth up to plateau level
            return (int) round(self::BASE_XP * pow(self::GROWTH_FACTOR, $level - 2));
        } else {
            // Linear progression after plateau level
            $plateauXP = (int) round(self::BASE_XP * pow(self::GROWTH_FACTOR, self::PLATEAU_LEVEL - 2));
            $levelsAfterPlateau = $level - self::PLATEAU_LEVEL;
            $xpPerLevelAfterPlateau = $plateauXP * 0.1; // Each level after 20 requires 10% of level 20's total XP
            
            return $plateauXP + (int) round($levelsAfterPlateau * $xpPerLevelAfterPlateau);
        }
    }

    /**
     * Get level progress information
     */
    public function getLevelProgress(User $user): array
    {
        $currentLevel = $user->level;
        $currentXP = $user->xp;
        
        $currentLevelXP = $this->getXPForLevel($currentLevel);
        $nextLevel = $currentLevel + 1;
        $nextLevelXP = $this->getXPForLevel($nextLevel);
        
        $progressInLevel = $currentXP - $currentLevelXP;
        $xpNeededForLevel = $nextLevelXP - $currentLevelXP;
        $progressPercentage = $xpNeededForLevel > 0 ? ($progressInLevel / $xpNeededForLevel) * 100 : 100;
        
        return [
            'current_level' => $currentLevel,
            'current_xp' => $currentXP,
            'level_start_xp' => $currentLevelXP,
            'next_level_xp' => $nextLevelXP,
            'progress_in_level' => $progressInLevel,
            'xp_to_next_level' => $nextLevelXP - $currentXP,
            'progress_percentage' => min(100, max(0, $progressPercentage)),
            'is_max_level' => false, // Never max level with infinite levels
        ];
    }

    /**
     * Get available XP actions and their rewards
     */
    public function getXPRewards(): array
    {
        return self::XP_REWARDS;
    }

    /**
     * Get level calculation constants
     */
    public function getLevelThresholds(): array
    {
        return [
            'base_xp' => self::BASE_XP,
            'growth_factor' => self::GROWTH_FACTOR,
            'plateau_level' => self::PLATEAU_LEVEL,
        ];
    }
}