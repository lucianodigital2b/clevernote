<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Crossword extends Model
{
    use HasFactory;

    protected $fillable = [
        'note_id',
        'user_id', 
        'title',
        'puzzle_data',
        'status',
        'failure_reason',
        'uuid'
    ];

    protected $casts = [
        'puzzle_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($crossword) {
            if (empty($crossword->uuid)) {
                $crossword->uuid = (string) Str::uuid();
            }
        });
    }

    public function note()
    {
        return $this->belongsTo(Note::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function feedback()
    {
        return $this->morphMany(Feedback::class, 'feedbackable');
    }
}