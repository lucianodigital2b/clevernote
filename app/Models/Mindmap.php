<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mindmap extends Model
{
    protected $fillable = ['note_id', 'user_id', 'title', 'nodes', 'edges'];

    protected $casts = [
        'nodes' => 'array',
        'edges' => 'array',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}