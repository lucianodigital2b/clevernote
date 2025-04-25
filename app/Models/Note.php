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

    protected $fillable = ['folder_id', 'user_id', 'title', 'content', 'transcription', 'summary', 'is_pinned'];

    public function tags() 
    { 
        return $this->belongsToMany(Tag::class, 'note_tags'); 
    }

    public function folder() 
    { 
        return $this->belongsTo(Folder::class); 
    }

}
