<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quiz extends Model
{
    protected $fillable = [
        'title',
        'description',
        'user_id',
        'is_published',
        'note_id',
        'status'
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function latestAttempt()
    {
        return $this->attempts()->latest()->first();
    }

    public function bestAttempt()
    {
        return $this->attempts()
            ->orderByRaw('(score / total_questions) DESC')
            ->first();
    }
}