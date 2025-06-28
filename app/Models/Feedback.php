<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Feedback extends Model
{
    protected $fillable = [
        'user_id',
        'is_positive',
        'reason',
        'metadata'
    ];

    protected $casts = [
        'is_positive' => 'boolean',
        'metadata' => 'array'
    ];

    public function feedbackable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}