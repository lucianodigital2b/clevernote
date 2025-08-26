<?php

namespace App\Http\Controllers;

use App\Models\FocusSession;
use App\Models\Tag;
use App\Models\UserStatistics;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class FocusController extends Controller
{
    /**
     * Display the focus timer page
     */
    public function index(): Response
    {
        $user = auth()->user();
        $activeSession = FocusSession::getActiveSession($user->id);
        $userTags = Tag::where('user_id', $user->id)->orderBy('name')->get();
        
        return Inertia::render('Focus/Index', [
            'activeSession' => $activeSession ? $activeSession->load('tag') : null,
            'tags' => $userTags,
            'todayStats' => $this->getTodayStats($user->id)
        ]);
    }

    /**
     * Start a new focus session
     */
    public function start(Request $request): JsonResponse
    {
        $request->validate([
            'tag_id' => 'nullable|exists:tags,id',
            'duration' => 'integer|min:1|max:120' // 1-120 minutes
        ]);

        $user = auth()->user();
        $duration = $request->input('duration', 25); // Default 25 minutes
        $tagId = $request->input('tag_id');

        // Verify tag belongs to user if provided
        if ($tagId) {
            $tag = Tag::where('id', $tagId)->where('user_id', $user->id)->first();
            if (!$tag) {
                return response()->json(['error' => 'Tag not found'], 404);
            }
        }

        $session = FocusSession::startSession($user->id, $tagId, $duration);

        return response()->json([
            'session' => $session->load('tag'),
            'message' => 'Focus session started successfully'
        ]);
    }

    /**
     * Pause the current session
     */
    public function pause(): JsonResponse
    {
        $user = auth()->user();
        $session = FocusSession::getActiveSession($user->id);

        if (!$session) {
            return response()->json(['error' => 'No active session found'], 404);
        }

        if ($session->pause()) {
            return response()->json([
                'session' => $session->fresh()->load('tag'),
                'message' => 'Session paused'
            ]);
        }

        return response()->json(['error' => 'Cannot pause session'], 400);
    }

    /**
     * Resume the paused session
     */
    public function resume(): JsonResponse
    {
        $user = auth()->user();
        $session = FocusSession::getActiveSession($user->id);

        if (!$session) {
            return response()->json(['error' => 'No paused session found'], 404);
        }

        if ($session->resume()) {
            return response()->json([
                'session' => $session->fresh()->load('tag'),
                'message' => 'Session resumed'
            ]);
        }

        return response()->json(['error' => 'Cannot resume session'], 400);
    }

    /**
     * Complete the current session
     */
    public function complete(Request $request): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        $user = auth()->user();
        $session = FocusSession::getActiveSession($user->id);

        if (!$session) {
            return response()->json(['error' => 'No active session found'], 404);
        }

        // Add notes if provided
        if ($request->has('notes')) {
            $session->update(['notes' => $request->input('notes')]);
        }

        if ($session->complete()) {
            // Update user statistics
            $this->updateUserStatistics($user->id, $session);

            return response()->json([
                'session' => $session->fresh()->load('tag'),
                'message' => 'Session completed successfully!',
                'stats' => $this->getTodayStats($user->id)
            ]);
        }

        return response()->json(['error' => 'Cannot complete session'], 400);
    }

    /**
     * Cancel the current session
     */
    public function cancel(): JsonResponse
    {
        $user = auth()->user();
        $session = FocusSession::getActiveSession($user->id);

        if (!$session) {
            return response()->json(['error' => 'No active session found'], 404);
        }

        if ($session->cancel()) {
            return response()->json([
                'message' => 'Session cancelled'
            ]);
        }

        return response()->json(['error' => 'Cannot cancel session'], 400);
    }

    /**
     * Get current session status
     */
    public function status(): JsonResponse
    {
        $user = auth()->user();
        $session = FocusSession::getActiveSession($user->id);

        return response()->json([
            'session' => $session ? $session->load('tag') : null,
            'stats' => $this->getTodayStats($user->id)
        ]);
    }

    /**
     * Get leaderboard data
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $period = $request->input('period', 'day'); // day, week, month, year
        $user = auth()->user();

        $leaderboard = $this->getLeaderboardData($period, $user->id);

        return response()->json($leaderboard);
    }

    /**
     * Get level-based leaderboard data
     */
    public function levelLeaderboard(Request $request): JsonResponse
    {
        $currentUser = auth()->user();
        $limit = $request->input('limit', 50);

        $leaderboard = User::select('id', 'name', 'level', 'xp')
            ->orderBy('level', 'desc')
            ->orderBy('xp', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($user, $index) use ($currentUser) {
                return [
                    'rank' => $index + 1,
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'level' => $user->level,
                    'xp' => $user->xp,
                    'is_current_user' => $user->id === $currentUser->id
                ];
            });

        // Find current user's rank if not in top list
        $currentUserRank = $leaderboard->firstWhere('is_current_user');
        if (!$currentUserRank) {
            // Calculate current user's rank
            $usersAbove = User::where('level', '>', $currentUser->level)
                ->orWhere(function ($query) use ($currentUser) {
                    $query->where('level', $currentUser->level)
                          ->where('xp', '>', $currentUser->xp);
                })
                ->count();

            $currentUserRank = [
                'rank' => $usersAbove + 1,
                'user_id' => $currentUser->id,
                'name' => $currentUser->name,
                'level' => $currentUser->level,
                'xp' => $currentUser->xp,
                'is_current_user' => true
            ];
        }

        return response()->json([
            'leaderboard' => $leaderboard->values(),
            'current_user' => $currentUserRank
        ]);
    }

    /**
     * Get user's focus session history
     */
    public function history(Request $request): JsonResponse
    {
        $user = auth()->user();
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 20);

        $sessions = FocusSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->with('tag')
            ->orderBy('started_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($sessions);
    }

    /**
     * Update user statistics after completing a session
     */
    private function updateUserStatistics(int $userId, FocusSession $session): void
    {
        $today = now()->toDateString();
        
        $userStats = UserStatistics::updateOrCreate(
            ['user_id' => $userId, 'date' => $today],
            []
        );
        
        $userStats->increment('focus_sessions_completed');
        $userStats->increment('focus_time_minutes', $session->actual_duration_minutes);
    }

    /**
     * Get focus session statistics for charts
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = auth()->user();
        $days = $request->input('days', 7); // Default to last 7 days
        
        $startDate = now()->subDays($days - 1)->startOfDay();
        $endDate = now()->endOfDay();
        
        // Get focus sessions with tags for the specified period
        $sessions = FocusSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('started_at', [$startDate, $endDate])
            ->with('tag')
            ->get();
        
        // Group sessions by date and tag
        $statisticsData = [];
        $allTags = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($days - 1 - $i)->toDateString();
            $dayName = now()->subDays($days - 1 - $i)->format('M j');
            
            $daySessions = $sessions->filter(function ($session) use ($date) {
                return $session->started_at->toDateString() === $date;
            });
            
            $tagData = [];
            $totalMinutes = 0;
            
            foreach ($daySessions as $session) {
                $tagName = $session->tag ? $session->tag->name : 'No Tag';
                $tagColor = $session->tag ? $session->tag->color : '#6B7280';
                $minutes = $session->actual_duration_minutes ?? 0;
                
                if (!isset($tagData[$tagName])) {
                    $tagData[$tagName] = [
                        'name' => $tagName,
                        'color' => $tagColor,
                        'minutes' => 0
                    ];
                }
                
                $tagData[$tagName]['minutes'] += $minutes;
                $totalMinutes += $minutes;
                
                if (!in_array($tagName, $allTags)) {
                    $allTags[] = $tagName;
                }
            }
            
            $statisticsData[] = [
                'date' => $date,
                'day' => $dayName,
                'tags' => array_values($tagData),
                'total_minutes' => $totalMinutes
            ];
        }
        
        return response()->json([
            'data' => $statisticsData,
            'all_tags' => $allTags
        ]);
    }

    /**
     * Get today's focus statistics for the user
     */
    private function getTodayStats(int $userId): array
    {
        $today = now()->toDateString();
        $stats = UserStatistics::where('user_id', $userId)
            ->where('date', $today)
            ->first();

        return [
            'sessions_completed' => $stats->focus_sessions_completed ?? 0,
            'total_focus_time' => $stats->focus_time_minutes ?? 0
        ];
    }

    /**
     * Get leaderboard data for different periods
     */
    private function getLeaderboardData(string $period, int $currentUserId): array
    {
        $query = UserStatistics::select(
            'user_id',
            DB::raw('SUM(focus_sessions_completed) as total_sessions'),
            DB::raw('SUM(focus_time_minutes) as total_minutes')
        )->with('user:id,name');

        switch ($period) {
            case 'day':
                $query->where('date', now()->toDateString());
                break;
            case 'week':
                $query->whereBetween('date', [
                    now()->startOfWeek()->toDateString(),
                    now()->endOfWeek()->toDateString()
                ]);
                break;
            case 'month':
                $query->whereBetween('date', [
                    now()->startOfMonth()->toDateString(),
                    now()->endOfMonth()->toDateString()
                ]);
                break;
            case 'year':
                $query->whereBetween('date', [
                    now()->startOfYear()->toDateString(),
                    now()->endOfYear()->toDateString()
                ]);
                break;
        }

        $leaderboard = $query->groupBy('user_id')
            ->orderBy('total_minutes', 'desc')
            ->orderBy('total_sessions', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($item, $index) use ($currentUserId) {
                return [
                    'rank' => $index + 1,
                    'user_id' => $item->user_id,
                    'name' => $item->user->name,
                    'total_sessions' => $item->total_sessions,
                    'total_minutes' => $item->total_minutes,
                    'is_current_user' => $item->user_id === $currentUserId
                ];
            });

        // Find current user's rank if not in top 50
        $currentUserRank = $leaderboard->firstWhere('is_current_user');
        if (!$currentUserRank) {
            $currentUserStats = UserStatistics::select(
                'user_id',
                DB::raw('SUM(focus_sessions_completed) as total_sessions'),
                DB::raw('SUM(focus_time_minutes) as total_minutes')
            )->where('user_id', $currentUserId);

            // Apply same date filter
            switch ($period) {
                case 'day':
                    $currentUserStats->where('date', now()->toDateString());
                    break;
                case 'week':
                    $currentUserStats->whereBetween('date', [
                        now()->startOfWeek()->toDateString(),
                        now()->endOfWeek()->toDateString()
                    ]);
                    break;
                case 'month':
                    $currentUserStats->whereBetween('date', [
                        now()->startOfMonth()->toDateString(),
                        now()->endOfMonth()->toDateString()
                    ]);
                    break;
                case 'year':
                    $currentUserStats->whereBetween('date', [
                        now()->startOfYear()->toDateString(),
                        now()->endOfYear()->toDateString()
                    ]);
                    break;
            }

            $userStats = $currentUserStats->groupBy('user_id')->first();
            if ($userStats) {
                $currentUserRank = [
                    'rank' => null, // Will be calculated
                    'user_id' => $currentUserId,
                    'name' => auth()->user()->name,
                    'total_sessions' => $userStats->total_sessions ?? 0,
                    'total_minutes' => $userStats->total_minutes ?? 0,
                    'is_current_user' => true
                ];
            }
        }

        return [
            'period' => $period,
            'leaderboard' => $leaderboard->values(),
            'current_user' => $currentUserRank
        ];
    }
}