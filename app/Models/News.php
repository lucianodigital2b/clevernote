<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;

class News extends Model
{
    protected $fillable = [
        'title',
        'content',
        'featured_image',
        'is_active',
        'published_at',
        'priority'
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_active' => 'boolean'
    ];

    /**
     * Users who have viewed this news item
     */
    public function viewedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_news_views')
            ->withTimestamps()
            ->withPivot('viewed_at');
    }

    /**
     * Check if a user has viewed this news item
     */
    public function hasBeenViewedBy(User $user): bool
    {
        return $this->viewedByUsers()->where('user_id', $user->id)->exists();
    }

    /**
     * Mark this news as viewed by a user
     */
    public function markAsViewedBy(User $user): void
    {
        if (!$this->hasBeenViewedBy($user)) {
            $this->viewedByUsers()->attach($user->id, [
                'viewed_at' => now()
            ]);
        }
    }

    /**
     * Scope for active news items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for published news items
     */
    public function scopePublished($query)
    {
        return $query->where('published_at', '<=', now())
            ->orWhereNull('published_at');
    }

    /**
     * Scope for unread news by user
     */
    public function scopeUnreadByUser($query, User $user)
    {
        return $query->whereDoesntHave('viewedByUsers', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        });
    }

    /**
     * Get news ordered by priority
     */
    public function scopeOrderedByPriority($query)
    {
        return $query->orderBy('priority', 'desc')
            ->orderBy('published_at', 'desc')
            ->orderBy('created_at', 'desc');
    }
}
