<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Flashcard extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'folder_id',
        'question',
        'answer',
        'difficulty',
        'language',
    ];

    protected $casts = [
        'difficulty' => 'string', // Or use an Enum class if preferred
        'next_review' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::deleting(function ($flashcard) {
            $flashcard->clearMediaCollection();
        });
    }


    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function flashcardSets()
    {
        return $this->belongsToMany(FlashcardSet::class, 'flashcard_flashcard_set');
    }

    public function feedback()
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
    }

    public function userProgress()
    {
        return $this->hasMany(FlashcardProgress::class);
    }
}
