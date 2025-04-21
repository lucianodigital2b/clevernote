<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    use HasFactory;

    protected $fillable = [
        'folder_id',
        'question',
        'answer',
        'difficulty',
        'language',
        'flashcard_set_id',
    ];

    protected $casts = [
        'difficulty' => 'string', // Or use an Enum class if preferred
        'next_review' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function flashcardSet(): BelongsTo
    {
        return $this->belongsTo(FlashcardSet::class);
    }

    public function userProgress()
    {
        return $this->hasMany(FlashcardProgress::class);
    }
}
