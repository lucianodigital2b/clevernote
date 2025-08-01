<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Support\Str;

class Note extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\NoteFactory> */
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'folder_id', 
        'user_id', 
        'title', 
        'content', 
        'transcription', 
        'summary', 
        'is_pinned', 
        'status', 
        'failure_reason', 
        'feedback_positive', 
        'feedback_reason', 
        'uuid', 
        'is_public',
        'external_metadata',
        'source_type',
        'source_url'
    ];

    protected $casts = [
        'external_metadata' => 'array',
        'is_pinned' => 'boolean',
        'feedback_positive' => 'boolean',
        'is_public' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($note) {
            if (empty($note->uuid)) {
                $note->uuid = (string) Str::uuid();
            }
        });
    }

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

    public function crosswords()
    {
        return $this->hasMany(Crossword::class);
    }
    
    public function feedback()
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
    }

    /**
     * Get the thumbnail URL for external content
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->source_type === 'youtube' && isset($this->external_metadata['thumbnail'])) {
            return $this->external_metadata['thumbnail'];
        }
        
        if ($this->source_type === 'vimeo' && isset($this->external_metadata['thumbnail_url'])) {
            return $this->external_metadata['thumbnail_url'];
        }
        
        return null;
    }

    /**
     * Get the duration in human readable format
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!isset($this->external_metadata['duration'])) {
            return null;
        }
        
        $seconds = $this->external_metadata['duration'];
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $seconds = $seconds % 60;
        
        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
        }
        
        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Check if this note is from an external source
     */
    public function isExternalSource(): bool
    {
        return !is_null($this->source_type) && $this->source_type !== 'upload';
    }
}
