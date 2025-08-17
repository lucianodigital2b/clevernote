<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class FocusSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tag_id',
        'started_at',
        'ended_at',
        'planned_duration_minutes',
        'actual_duration_minutes',
        'status',
        'pause_intervals',
        'notes'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'planned_duration_minutes' => 'integer',
        'actual_duration_minutes' => 'integer',
        'pause_intervals' => 'array'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tag(): BelongsTo
    {
        return $this->belongsTo(Tag::class);
    }

    /**
     * Get the current active session for a user
     */
    public static function getActiveSession(int $userId): ?self
    {
        return self::where('user_id', $userId)
            ->whereIn('status', ['active', 'paused'])
            ->first();
    }

    /**
     * Start a new focus session
     */
    public static function startSession(int $userId, ?int $tagId = null, int $duration = 25): self
    {
        // End any existing active session
        self::where('user_id', $userId)
            ->whereIn('status', ['active', 'paused'])
            ->update(['status' => 'cancelled']);

        return self::create([
            'user_id' => $userId,
            'tag_id' => $tagId,
            'started_at' => now(),
            'planned_duration_minutes' => $duration,
            'status' => 'active',
            'pause_intervals' => []
        ]);
    }

    /**
     * Pause the current session
     */
    public function pause(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $pauseIntervals = $this->pause_intervals ?? [];
        $pauseIntervals[] = [
            'paused_at' => now()->toISOString(),
            'resumed_at' => null
        ];

        return $this->update([
            'status' => 'paused',
            'pause_intervals' => $pauseIntervals
        ]);
    }

    /**
     * Resume the paused session
     */
    public function resume(): bool
    {
        if ($this->status !== 'paused') {
            return false;
        }

        $pauseIntervals = $this->pause_intervals ?? [];
        if (!empty($pauseIntervals)) {
            $lastIndex = count($pauseIntervals) - 1;
            $pauseIntervals[$lastIndex]['resumed_at'] = now()->toISOString();
        }

        return $this->update([
            'status' => 'active',
            'pause_intervals' => $pauseIntervals
        ]);
    }

    /**
     * Complete the session
     */
    public function complete(): bool
    {
        if (!in_array($this->status, ['active', 'paused'])) {
            return false;
        }

        $actualDuration = $this->calculateActualDuration();

        return $this->update([
            'status' => 'completed',
            'ended_at' => now(),
            'actual_duration_minutes' => $actualDuration
        ]);
    }

    /**
     * Cancel the session
     */
    public function cancel(): bool
    {
        if (!in_array($this->status, ['active', 'paused'])) {
            return false;
        }

        return $this->update([
            'status' => 'cancelled',
            'ended_at' => now()
        ]);
    }

    /**
     * Calculate actual duration excluding pause time
     */
    public function calculateActualDuration(): int
    {
        $startTime = $this->started_at;
        $endTime = $this->ended_at ?? now();
        $totalMinutes = $startTime->diffInMinutes($endTime);

        // Subtract pause time
        $pauseMinutes = $this->calculatePauseTime();

        return max(0, $totalMinutes - $pauseMinutes);
    }

    /**
     * Calculate total pause time in minutes
     */
    public function calculatePauseTime(): int
    {
        $pauseIntervals = $this->pause_intervals ?? [];
        $totalPauseMinutes = 0;

        foreach ($pauseIntervals as $interval) {
            $pausedAt = Carbon::parse($interval['paused_at']);
            $resumedAt = $interval['resumed_at'] 
                ? Carbon::parse($interval['resumed_at']) 
                : now();
            
            $totalPauseMinutes += $pausedAt->diffInMinutes($resumedAt);
        }

        return $totalPauseMinutes;
    }

    /**
     * Get remaining time in minutes
     */
    public function getRemainingMinutes(): int
    {
        if ($this->status !== 'active') {
            return 0;
        }

        $elapsedMinutes = $this->calculateActualDuration();
        return max(0, $this->planned_duration_minutes - $elapsedMinutes);
    }

    /**
     * Check if session is expired
     */
    public function isExpired(): bool
    {
        return $this->getRemainingMinutes() <= 0;
    }
}