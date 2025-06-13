<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class FlashcardSet extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'folder_id',
        'status',
        'note_id'
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('flashcard-images')->useDisk('r2');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo 
    {
        return $this->belongsTo(Folder::class);
    }

    public function flashcards()
    {
        return $this->belongsToMany(Flashcard::class, 'flashcard_flashcard_set');
    }

    public function note()
    {
        return $this->belongsTo(Note::class);
    }
}