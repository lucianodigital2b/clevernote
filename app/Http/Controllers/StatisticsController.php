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
        $overallStats = $this->statisticsService->getOverallStats($user);

        return Inertia::render('statistics/index', [
            'weeklyStats' => $weeklyStats,
            'yearlyHeatmap' => $yearlyHeatmap,
            'overallStats' => $overallStats
        ]);
    }
    
    public function daily(Request $request)
    {
        $user = Auth::user();
        
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : null;
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : null;
        
        $dailyStats = $this->statisticsService->getDailyStats($user, $startDate, $endDate);
        
        return response()->json([
            'data' => $dailyStats
        ]);
    }

}