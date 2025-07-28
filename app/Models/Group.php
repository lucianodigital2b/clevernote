<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Group extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image',
        'invite_code',
        'created_by',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($group) {
            if (empty($group->invite_code)) {
                $group->invite_code = static::generateUniqueInviteCode();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_memberships')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_memberships')
            ->wherePivot('role', 'admin')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get leaderboard data for the group
     */
    public function getLeaderboard($period = 'week')
    {
        $startDate = match($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'all' => null,
            default => now()->startOfWeek(),
        };

        $query = $this->members()
            ->select([
                'users.id',
                'users.name',
                'users.xp',
                'users.level'
            ])
            ->selectRaw('
                COALESCE(SUM(user_statistics.study_time_minutes), 0) as total_study_time,
                COALESCE(SUM(user_statistics.quiz_attempts), 0) as total_quiz_attempts,
                COALESCE(SUM(user_statistics.flashcard_reviews), 0) as total_flashcard_reviews,
                COALESCE(MAX(user_statistics.current_streak), 0) as current_streak
            ')
            ->leftJoin('user_statistics', 'users.id', '=', 'user_statistics.user_id');

        if ($startDate) {
            $query->where('user_statistics.date', '>=', $startDate);
        }

        return $query
            ->groupBy(['users.id', 'users.name', 'users.xp', 'users.level'])
            ->orderByDesc('total_study_time')
            ->orderByDesc('users.xp')
            ->get();
    }

    /**
     * Generate a unique invite code
     */
    protected static function generateUniqueInviteCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (static::where('invite_code', $code)->exists());

        return $code;
    }

    /**
     * Regenerate invite code
     */
    public function regenerateInviteCode(): string
    {
        $this->invite_code = static::generateUniqueInviteCode();
        $this->save();
        
        return $this->invite_code;
    }
}