<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Support\Str;

class Quiz extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($quiz) {
            if (empty($quiz->uuid)) {
                $quiz->uuid = (string) Str::uuid();
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('quiz-question-images')->useDisk('r2');
        $this->addMediaCollection('quiz-option-images')->useDisk('r2');
    }

    protected $fillable = [
        'title',
        'description',
        'user_id',
        'is_published',
        'note_id',
        'status',
        'uuid'
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

    public function feedback()
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
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