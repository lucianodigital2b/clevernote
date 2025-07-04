<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Note extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\NoteFactory> */
    use HasFactory, InteractsWithMedia;

    protected $fillable = ['folder_id', 'user_id', 'title', 'content', 'transcription', 'summary', 'is_pinned', 'status', 'failure_reason', 'feedback_positive', 'feedback_reason'];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('note-images')->useDisk('r2');
        $this->addMediaCollection('note-audio')->useDisk('r2');
        $this->addMediaCollection('note-videos')->useDisk('r2');
        $this->addMediaCollection('note-docs')->useDisk('r2');
        $this->addMediaCollection('note-texts')->useDisk('r2');
    }


    public function tags() 
    { 
        return $this->belongsToMany(Tag::class, 'note_tags'); 
    }

    public function folder() 
    { 
        return $this->belongsTo(Folder::class); 
    }

    public function flashcardSets()
    {
        return $this->hasMany(FlashcardSet::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function mindmaps()
    {
        return $this->hasMany(Mindmap::class);
    }
    
    public function feedback()
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
    }
}
