<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStatistics extends Model
{
    protected $fillable = [
        'user_id',
        'date', // Daily statistics
        'quiz_attempts',
        'quiz_correct_answers',
        'quiz_total_questions',
        'flashcard_reviews',
        'flashcard_correct',
        'study_time_minutes',
        'current_streak',
        'max_streak'
    ];

    protected $casts = [
        'date' => 'date',
        'quiz_attempts' => 'integer',
        'quiz_correct_answers' => 'integer',
        'quiz_total_questions' => 'integer',
        'flashcard_reviews' => 'integer',
        'flashcard_correct' => 'integer',
        'study_time_minutes' => 'integer',
        'current_streak' => 'integer',
        'max_streak' => 'integer'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}