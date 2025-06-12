<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Price extends Model
{
    protected $fillable = [
        'product_id',
        'stripe_price_id',
        'amount',
        'currency',
        'interval',
        'interval_count',
        'type',
        'active'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'active' => 'boolean',
        'interval_count' => 'integer'
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeRecurring($query)
    {
        return $query->where('type', 'recurring');
    }

    public function scopeOneTime($query)
    {
        return $query->where('type', 'one_time');
    }

    public function getFormattedAmountAttribute(): string
    {
        return '$' . number_format($this->amount, 2);
    }

    public function getIntervalDisplayAttribute(): string
    {
        if ($this->type === 'one_time') {
            return 'one-time';
        }
        
        $interval = $this->interval;
        if ($this->interval_count > 1) {
            $interval = $this->interval_count . ' ' . $interval . 's';
        }
        
        return 'per ' . $interval;
    }
}
