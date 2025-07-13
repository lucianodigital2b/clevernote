<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Notifications\NewUserFeedback;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Jijunair\LaravelReferral\Traits\Referrable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Billable, HasApiTokens, Referrable;

    protected $with = ['subscriptions', 'activeSubscriptions'];
    protected $withCount = ['notes'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name', 'email', 'password', 'google_id', 'apple_id',
        'preferred_language', 'discovery_source', 'timezone',
        'primary_subject_interest', 'learning_goals', 'onboarding_completed', 'notes_count', 'survey_data', 'study_plan'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
            'survey_data' => 'array',
            'study_plan' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::created(function ($user) {
            $user->notify(new NewUserFeedback());
        });
    }

    public function flashcards(): HasMany
    {
        return $this->hasMany(Flashcard::class);
    }

    public function activeSubscriptions()
    {
        return $this->hasMany(\Laravel\Cashier\Subscription::class)
            ->whereNull('ends_at') // not cancelled
            ->where('stripe_status', 'active'); // still billed
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    // Add these new relationships
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function statistics(): HasMany
    {
        return $this->hasMany(UserStatistics::class);
    }

    public function flashcardProgress(): HasMany
    {
        return $this->hasMany(FlashcardProgress::class);
    }
}
