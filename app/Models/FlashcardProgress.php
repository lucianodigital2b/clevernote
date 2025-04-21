<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashcardProgress extends Model
{
    protected $fillable = [
        'user_id',
        'flashcard_id',
        'interval',
        'repetition',
        'efactor',
        'next_review'
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