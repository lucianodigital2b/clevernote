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
        'source_url',
        // Podcast-related fields
        'podcast_file_path',
        'podcast_duration',
        'podcast_file_size',
        'podcast_status',
        'podcast_failure_reason',
        'podcast_metadata',
        'podcast_generated_at'
    ];

    protected $casts = [
        'external_metadata' => 'array',
        'is_pinned' => 'boolean',
        'feedback_positive' => 'boolean',
        'is_public' => 'boolean',
        'podcast_metadata' => 'array',
        'podcast_generated_at' => 'datetime',
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

    /**
     * Check if this note has a podcast
     */
    public function hasPodcast(): bool
    {
        return $this->podcast_status === 'completed' && !empty($this->podcast_file_path);
    }

    /**
     * Check if podcast is currently being generated
     */
    public function isPodcastProcessing(): bool
    {
        return in_array($this->podcast_status, ['pending', 'processing']);
    }

    /**
     * Check if podcast generation failed
     */
    public function isPodcastFailed(): bool
    {
        return $this->podcast_status === 'failed';
    }

    /**
     * Get the podcast URL if available
     */
    public function getPodcastUrlAttribute(): ?string
    {
        if (!$this->hasPodcast()) {
            return null;
        }

        return \Storage::disk('r2')->url($this->podcast_file_path);
    }

    /**
     * Get the formatted podcast duration
     */
    public function getFormattedPodcastDurationAttribute(): ?string
    {
        if (!$this->podcast_duration) {
            return null;
        }

        $seconds = $this->podcast_duration;
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $seconds = $seconds % 60;

        if ($hours > 0) {
            return sprintf('%d:%02d:%02d', $hours, $minutes, $seconds);
        }

        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Get the formatted podcast file size
     */
    public function getFormattedPodcastFileSizeAttribute(): ?string
    {
        if (!$this->podcast_file_size) {
            return null;
        }

        $bytes = $this->podcast_file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);

        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }

    /**
     * Get podcast metadata with defaults
     */
    public function getPodcastMetadataAttribute($value): array
    {
        $metadata = json_decode($value, true) ?? [];
        
        return array_merge([
            'service' => null,
            'voice_id' => null,
            'language_code' => null,
            'engine' => null,
            'format' => null,
            'options_used' => [],
            'generated_at' => null,
            'metadata' => []
        ], $metadata);
    }

    /**
     * Scope to get notes with podcasts
     */
    public function scopeWithPodcast($query)
    {
        return $query->where('podcast_status', 'completed')
                    ->whereNotNull('podcast_file_path');
    }

    /**
     * Scope to get notes with failed podcast generation
     */
    public function scopeWithFailedPodcast($query)
    {
        return $query->where('podcast_status', 'failed');
    }

    /**
     * Scope to get notes with processing podcast
     */
    public function scopeWithProcessingPodcast($query)
    {
        return $query->whereIn('podcast_status', ['pending', 'processing']);
    }
}
