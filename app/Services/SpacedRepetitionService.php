<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use Carbon\Carbon;

class SpacedRepetitionService
{
    // Intervals in hours for spaced repetition
    protected const INTERVALS = [
        1 => 6,     // First review after 6 hours
        2 => 24,    // Second review after 1 day
        3 => 72,    // Third review after 3 days
        4 => 168,   // Fourth review after 1 week
        5 => 336,   // Fifth review after 2 weeks
        6 => 720,   // Sixth review after 1 month
        7 => 2160   // Seventh review after 3 months
    ];

    public function calculateNextAttemptDate(Quiz $quiz, QuizAttempt $attempt): Carbon
    {
        $scorePercentage = $attempt->score_percentage;
        $previousAttempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $attempt->user_id)
            ->count();

        // Reset interval if score is too low
        if ($scorePercentage < 70) {
            return Carbon::now()->addHours(self::INTERVALS[1]);
        }

        $interval = self::INTERVALS[min($previousAttempts + 1, count(self::INTERVALS))];
        return Carbon::now()->addHours($interval);
    }

    public function shouldAllowAttempt(Quiz $quiz, int $userId): bool
    {
        if (!$quiz->next_attempt_available_at) {
            return true;
        }

        return Carbon::now()->gte($quiz->next_attempt_available_at);
    }

    public function updateQuizInterval(Quiz $quiz, QuizAttempt $attempt): void
    {
        $nextAttemptDate = $this->calculateNextAttemptDate($quiz, $attempt);
        $quiz->update(['next_attempt_available_at' => $nextAttemptDate]);
    }
}