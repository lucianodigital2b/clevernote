<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Notifications\NewUserFeedback;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Jijunair\LaravelReferral\Traits\Referrable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class User extends Authenticatable implements HasMedia
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Billable, HasApiTokens, Referrable, InteractsWithMedia;

    protected $with = ['subscriptions', 'activeSubscriptions'];
    protected $withCount = ['notes'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name', 'email', 'password', 'google_id', 'apple_id',
        'preferred_language', 'discovery_source',
        'primary_subject_interest', 'learning_goals', 'onboarding_completed', 'notes_count', 'survey_data', 'study_plan', 'xp', 'level', 'last_login', 'registered_from_mobile',
        'revenuecat_user_id'
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
            'last_login' => 'datetime',
            'registered_from_mobile' => 'boolean',
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
        return $this->hasMany(Subscription::class)->active();
    }

    /**
     * Get all subscriptions (both Stripe and RevenueCat)
     */
    public function allSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get Stripe subscriptions only
     */
    public function stripeSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->stripe();
    }

    /**
     * Get RevenueCat subscriptions only
     */
    public function revenueCatSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class)->revenueCat();
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

    // Group relationships
    public function groupMemberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_memberships')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function createdGroups(): HasMany
    {
        return $this->hasMany(Group::class, 'created_by');
    }

    public function focusSessions(): HasMany
    {
        return $this->hasMany(FocusSession::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Get level progress information
     */
    public function getLevelProgress(): array
    {
        $xpService = app(\App\Services\XPService::class);
        return $xpService->getLevelProgress($this);
    }

    /**
     * Register media collections
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('profile_pictures')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp'])
            ->useDisk('public');
    }

    /**
     * Register media conversions
     */
    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10)
            ->performOnCollections('profile_pictures');

        $this->addMediaConversion('avatar')
            ->width(300)
            ->height(300)
            ->sharpen(10)
            ->performOnCollections('profile_pictures');
    }

    /**
     * Get the user's profile picture URL
     */
    public function getProfilePictureUrl(string $conversion = 'avatar'): ?string
    {
        $media = $this->getFirstMedia('profile_pictures');
        
        if (!$media) {
            return null;
        }

        return $media->getUrl($conversion);
    }

    /**
     * Get the avatar attribute (for API serialization)
     */
    public function getAvatarAttribute(): ?string
    {
        return $this->getProfilePictureUrl();
    }

    /**
     * Check if user is currently on trial (unified method)
     */
    public function onTrial(): bool
    {
        return $this->allSubscriptions()->get()->some(function ($subscription) {
            return $subscription->onTrial();
        });
    }

    /**
     * Check if user has active subscription or is on trial (unified method)
     */
    public function hasActiveSubscriptionOrTrial(): bool
    {
        return $this->activeSubscriptions()->exists() || $this->onTrial();
    }

    /**
     * Check if user should see premium features (active subscription or trial)
     */
    public function shouldHidePremiumBanners(): bool
    {
        return $this->hasAnyActiveSubscription();
    }

    /**
     * Check if user has any active subscription (unified method)
     */
    public function hasAnyActiveSubscription(): bool
    {
        return $this->activeSubscriptions()->exists();
    }

    /**
     * Get all subscription details (unified method)
     */
    public function getSubscriptionDetails(): array
    {
        $activeSubscriptions = $this->activeSubscriptions()->get();
        
        if ($activeSubscriptions->isEmpty()) {
            return [
                'has_active_subscription' => false,
                'subscriptions' => [],
                'primary_subscription' => null
            ];
        }

        $subscriptionData = $activeSubscriptions->map(function ($subscription) {
            return [
                'provider' => $subscription->provider,
                'platform' => $subscription->platform ?? ($subscription->provider === 'stripe' ? 'web' : 'unknown'),
                'expires_at' => $subscription->getExpirationDate(),
                'product_id' => $subscription->provider === 'stripe' ? $subscription->stripe_price : $subscription->revenuecat_product_id,
                'is_trial' => $subscription->onTrial(),
                'is_active' => $subscription->active()
            ];
        });

        // Primary subscription is the one that expires last
        $primarySubscription = $activeSubscriptions->sortByDesc(function ($subscription) {
            return $subscription->getExpirationDate();
        })->first();

        return [
            'has_active_subscription' => true,
            'subscriptions' => $subscriptionData->toArray(),
            'primary_subscription' => [
                'provider' => $primarySubscription->provider,
                'platform' => $primarySubscription->platform ?? ($primarySubscription->provider === 'stripe' ? 'web' : 'unknown'),
                'expires_at' => $primarySubscription->getExpirationDate(),
                'product_id' => $primarySubscription->provider === 'stripe' ? $primarySubscription->stripe_price : $primarySubscription->revenuecat_product_id,
                'is_trial' => $primarySubscription->onTrial()
            ]
        ];
    }
}
