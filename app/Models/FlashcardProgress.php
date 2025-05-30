<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashcardProgress extends Model
{
    protected $fillable = [
        'user_id',        // Which user this progress belongs to
        'flashcard_id',   // Which flashcard this tracks
        'interval',       // Time until next review (in minutes)
        'repetition',     // Number of times reviewed
        'efactor',        // Ease factor (difficulty multiplier)
        'next_review'     // When the card should be reviewed next
    ];

    protected $casts = [
        'next_review' => 'datetime',
        'interval' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function flashcard()
    {
        return $this->belongsTo(Flashcard::class);
    }
}