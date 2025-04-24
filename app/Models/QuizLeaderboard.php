<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizLeaderboard extends Model
{
    protected $fillable = [
        'quiz_id',
        'user_id',
        'best_score',
        'attempts_count',
        'last_attempt_at'
    ];

    protected $casts = [
        'last_attempt_at' => 'datetime'
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function updateScore(int $newScore): void
    {
        $this->attempts_count++;
        if ($newScore > $this->best_score) {
            $this->best_score = $newScore;
        }
        $this->last_attempt_at = now();
        $this->save();
    }
}