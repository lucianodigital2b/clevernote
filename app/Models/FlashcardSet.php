<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FlashcardSet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'folder_id',
    ];

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
        return $this->belongsToMany(Flashcard::class);
    }

    public function note()
    {
        return $this->belongsTo(Note::class);
    }
}