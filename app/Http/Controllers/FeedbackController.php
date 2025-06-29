<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'feedbackable_type' => 'required|string|in:note,flashcard,quiz',
            'feedbackable_id' => 'required|integer',
            'is_positive' => 'required|boolean',
            'reason' => 'nullable|string|max:500'
        ]);

        $feedback = Feedback::create([
            'user_id' => Auth::id(),
            'feedbackable_type' => 'App\\Models\\' . ucfirst($validated['feedbackable_type']),
            'feedbackable_id' => $validated['feedbackable_id'],
            'is_positive' => $validated['is_positive'],
            'reason' => $validated['reason'] ?? null
        ]);

        return response()->json(['message' => 'Feedback submitted successfully', 'feedback' => $feedback]);
    }

    public function stats(Request $request)
    {
        $validated = $request->validate([
            'feedbackable_type' => 'required|string|in:note,flashcard,quiz',
            'feedbackable_id' => 'required|integer'
        ]);

        $modelClass = 'App\\Models\\' . ucfirst($validated['feedbackable_type']);
        $model = $modelClass::findOrFail($validated['feedbackable_id']);

        $total = $model->feedback()->count();
        $positive = $model->feedback()->where('is_positive', true)->count();
        $negative = $total - $positive;
        $positivePercentage = $total > 0 ? round(($positive / $total) * 100) : 0;

        return response()->json([
            'feedbackStats' => [
                'total' => $total,
                'positive' => $positive,
                'negative' => $negative,
                'positive_percentage' => $positivePercentage
            ]
        ]);
    }
}