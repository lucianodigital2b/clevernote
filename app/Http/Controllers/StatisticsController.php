<?php

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function __construct(
        private StatisticsService $statisticsService
    ) {}
    
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $weeklyStats = $this->statisticsService->getWeeklyStats($user);
        $yearlyHeatmap = $this->statisticsService->getYearlyHeatmap($user);
        
        // Calculate overall statistics
        $overallStats = [
            'totalQuestions' => $user->quizAttempts()->sum('total_questions'),
            'accuracy' => $this->calculateOverallAccuracy($user),
            'currentStreak' => $this->getCurrentStreak($user),
            'maxStreak' => $this->getMaxStreak($user),
            'dailyAverage' => $this->getDailyAverage($user)
        ];
        
        return Inertia::render('statistics/index', [
            'weeklyStats' => $weeklyStats,
            'yearlyHeatmap' => $yearlyHeatmap,
            'overallStats' => $overallStats
        ]);
    }
    
    private function calculateOverallAccuracy($user): float
    {
        $attempts = $user->quizAttempts();
        $totalQuestions = $attempts->sum('total_questions');
        $correctAnswers = $attempts->sum('score');
        
        return $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 1) : 0;
    }
    
    private function getCurrentStreak($user): int
    {
        return $user->statistics()
            ->latest('date')
            ->value('current_streak') ?? 0;
    }
    
    private function getMaxStreak($user): int
    {
        return $user->statistics()
            ->max('max_streak') ?? 0;
    }
    
    private function getDailyAverage($user): int
    {
        $stats = $user->statistics()
            ->where('date', '>=', Carbon::now()->subDays(30))
            ->get();
            
        $totalActivity = $stats->sum(function($stat) {
            return $stat->quiz_total_questions + $stat->flashcard_reviews;
        });
        
        return $stats->count() > 0 ? round($totalActivity / $stats->count()) : 0;
    }
}