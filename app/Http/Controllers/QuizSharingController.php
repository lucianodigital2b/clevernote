<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizLeaderboard;
use App\Services\SpacedRepetitionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class QuizSharingController extends Controller
{
    protected $spacedRepetition;

    public function __construct(SpacedRepetitionService $spacedRepetition)
    {
        $this->spacedRepetition = $spacedRepetition;
    }

    public function index()
    {
        $sharedQuizzes = Quiz::with(['category', 'tags', 'user'])
            ->where('is_public', true)
            ->latest()
            ->paginate(10);

        return Inertia::render('Quiz/SharedQuizzes', [
            'quizzes' => $sharedQuizzes
        ]);
    }

    public function show(Quiz $quiz)
    {
        if (!$quiz->is_public && $quiz->user_id !== Auth::id()) {
            abort(403);
        }

        $canAttempt = $this->spacedRepetition->shouldAllowAttempt($quiz, Auth::id());
        $leaderboard = QuizLeaderboard::with('user')
            ->where('quiz_id', $quiz->id)
            ->orderByDesc('best_score')
            ->orderBy('attempts_count')
            ->take(10)
            ->get();

        return Inertia::render('Quiz/SharedQuizDetail', [
            'quiz' => $quiz->load(['category', 'tags']),
            'canAttempt' => $canAttempt,
            'leaderboard' => $leaderboard,
            'nextAttemptAt' => $quiz->next_attempt_available_at
        ]);
    }

    public function showByUuid($uuid)
    {
        $quiz = Quiz::where('uuid', $uuid)->firstOrFail();
        
        if (!$quiz->is_published) {
            abort(404, 'Quiz not found or not published');
        }

        $userId = Auth::id();
        $canAttempt = $userId ? $this->spacedRepetition->shouldAllowAttempt($quiz, $userId) : true;
        
        $leaderboard = QuizLeaderboard::with('user')
            ->where('quiz_id', $quiz->id)
            ->orderByDesc('best_score')
            ->orderBy('attempts_count')
            ->take(10)
            ->get();

        return Inertia::render('Quizzes/Public', [
            'quiz' => $quiz->load(['questions.options']),
            'canAttempt' => $canAttempt,
            'leaderboard' => $leaderboard,
            'nextAttemptAt' => $quiz->next_attempt_available_at ?? null
        ]);
    }

    public function toggleSharing(Quiz $quiz)
    {
        $this->authorize('update', $quiz);

        $quiz->update([
            'is_public' => !$quiz->is_public
        ]);

        return back()->with('success', $quiz->is_public ? 'Quiz is now public' : 'Quiz is now private');
    }

    public function leaderboard(Quiz $quiz)
    {
        if (!$quiz->is_public && $quiz->user_id !== Auth::id()) {
            abort(403);
        }

        $leaderboard = QuizLeaderboard::with('user')
            ->where('quiz_id', $quiz->id)
            ->orderByDesc('best_score')
            ->orderBy('attempts_count')
            ->paginate(20);

        return Inertia::render('Quiz/Leaderboard', [
            'quiz' => $quiz,
            'leaderboard' => $leaderboard
        ]);
    }
}