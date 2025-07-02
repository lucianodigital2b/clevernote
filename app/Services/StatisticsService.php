<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserStatistics;
use App\Models\QuizAttempt;
use App\Models\FlashcardProgress;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    public function updateDailyStats(User $user, ?Carbon $date = null): UserStatistics
    {
        $date = $date ?? Carbon::today();
        
        $stats = UserStatistics::firstOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            ['current_streak' => 0, 'max_streak' => 0]
        );
        
        // Calculate quiz stats for the day
        $quizStats = QuizAttempt::where('user_id', $user->id)
            ->whereDate('completed_at', $date)
            ->selectRaw('COUNT(*) as attempts, SUM(score) as correct, SUM(total_questions) as total')
            ->first();
            
        // Calculate flashcard stats for the day
        $flashcardStats = FlashcardProgress::where('user_id', $user->id)
            ->whereDate('updated_at', $date)
            ->count();
        
        $stats->update([
            'quiz_attempts' => $quizStats->attempts ?? 0,
            'quiz_correct_answers' => $quizStats->correct ?? 0,
            'quiz_total_questions' => $quizStats->total ?? 0,
            'flashcard_reviews' => $flashcardStats,
        ]);
        
        $this->updateStreaks($user, $date);
        
        return $stats;
    }
    
    public function getWeeklyStats(User $user, ?Carbon $startDate = null): array
    {
        $startDate = $startDate ?? Carbon::now()->startOfWeek();
        $endDate = $startDate->copy()->endOfWeek();
        
        return UserStatistics::where('user_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->get()
            ->toArray();
    }
    
    public function getOverallStats(User $user): array
    {
        // Get total questions from quiz attempts
        $totalQuestions = $user->quizAttempts()->sum('total_questions');
        
        // Calculate accuracy
        $totalCorrect = $user->quizAttempts()->sum('score');
        $accuracy = $totalQuestions > 0 ? round(($totalCorrect / $totalQuestions) * 100, 1) : 0;
        
        // Get current and max streak
        $latestStats = $user->statistics()->latest('date')->first();
        $currentStreak = $latestStats ? $latestStats->current_streak : 0;
        $maxStreak = $user->statistics()->max('max_streak') ?? 0;
        
        // Calculate daily average (last 30 days)
        $recentStats = $user->statistics()
            ->where('date', '>=', Carbon::now()->subDays(30))
            ->get();
            
        $totalActivity = $recentStats->sum(function($stat) {
            return $stat->quiz_total_questions + $stat->flashcard_reviews;
        });
        
        $dailyAverage = $recentStats->count() > 0 ? round($totalActivity / $recentStats->count()) : 0;
        
        // Calculate days learned percentage (days with activity in last 30 days)
        $daysWithActivity = $recentStats->filter(function($stat) {
            return ($stat->quiz_total_questions + $stat->flashcard_reviews) > 0;
        })->count();
        
        $daysLearnedPercentage = $recentStats->count() > 0 ? round(($daysWithActivity / min(30, $recentStats->count())) * 100) : 0;
        
        return [
            'totalQuestions' => $totalQuestions,
            'accuracy' => $accuracy,
            'currentStreak' => $currentStreak,
            'maxStreak' => $maxStreak,
            'dailyAverage' => $dailyAverage,
            'daysLearnedPercentage' => $daysLearnedPercentage
        ];
    }
    
    public function getYearlyHeatmap(User $user, ?int $year = null): array
    {
        $year = $year ?? Carbon::now()->year;
        
        return UserStatistics::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->get()
            ->keyBy(function($stat) {
                return $stat->date->format('Y-m-d');
            })
            ->toArray();
    }
    
    public function getDailyStats(User $user, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate = $startDate ?? Carbon::now()->startOfMonth();
        $endDate = $endDate ?? Carbon::now()->endOfMonth();
        
        return UserStatistics::where('user_id', $user->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date')
            ->get()
            ->map(function($stat) {
                return [
                    'date' => $stat->date->format('Y-m-d'),
                    'quiz_attempts' => $stat->quiz_attempts,
                    'quiz_correct_answers' => $stat->quiz_correct_answers,
                    'quiz_total_questions' => $stat->quiz_total_questions,
                    'flashcard_reviews' => $stat->flashcard_reviews,
                    'flashcard_correct' => $stat->flashcard_correct,
                    'study_time_minutes' => $stat->study_time_minutes,
                    'current_streak' => $stat->current_streak,
                    'max_streak' => $stat->max_streak
                ];
            })
            ->toArray();
    }
    
    private function updateStreaks(User $user, Carbon $date): void
    {
        $yesterday = $date->copy()->subDay();
        $yesterdayStats = UserStatistics::where('user_id', $user->id)
            ->where('date', $yesterday)
            ->first();
            
        $todayStats = UserStatistics::where('user_id', $user->id)
            ->where('date', $date)
            ->first();
            
        if (!$todayStats) return;
        
        $hasActivity = ($todayStats->quiz_attempts > 0 || $todayStats->flashcard_reviews > 0);
        
        if ($hasActivity) {
            if ($yesterdayStats && $yesterdayStats->current_streak > 0) {
                $todayStats->current_streak = $yesterdayStats->current_streak + 1;
            } else {
                $todayStats->current_streak = 1;
            }
            
            $todayStats->max_streak = max($todayStats->max_streak, $todayStats->current_streak);
        } else {
            $todayStats->current_streak = 0;
        }
        
        $todayStats->save();
    }
}