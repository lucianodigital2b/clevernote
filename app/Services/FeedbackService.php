<?php

namespace App\Services;

use App\Models\Feedback;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class FeedbackService
{
    public function submitFeedback(Model $model, bool $isPositive, ?string $reason = null, ?array $metadata = null): Feedback
    {
        return $model->feedback()->create([
            'user_id' => Auth::id(),
            'is_positive' => $isPositive,
            'reason' => $reason,
            'metadata' => $metadata
        ]);
    }

    public function getFeedbackStats(Model $model): array
    {
        $total = $model->feedback()->count();
        $positive = $model->feedback()->where('is_positive', true)->count();
        
        return [
            'total' => $total,
            'positive' => $positive,
            'negative' => $total - $positive,
            'positive_percentage' => $total > 0 ? round(($positive / $total) * 100) : 0
        ];
    }
}