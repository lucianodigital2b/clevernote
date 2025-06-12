<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'stripe_product_id',
        'description',
        'features',
        'cta',
        'popular',
        'active',
    ];

    protected $casts = [
        'features' => 'array',
        'popular' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * Get the prices for the product
     */
    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }

    /**
     * Get active prices for the product
     */
    public function activePrices(): HasMany
    {
        return $this->hasMany(Price::class)->where('active', true);
    }

    /**
     * Get monthly price
     */
    public function getMonthlyPrice()
    {
        return $this->activePrices()->where('interval', 'month')->first();
    }

    /**
     * Get yearly price
     */
    public function getYearlyPrice()
    {
        return $this->activePrices()->where('interval', 'year')->first();
    }

    /**
     * Scope to get only active products
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to get popular products
     */
    public function scopePopular($query)
    {
        return $query->where('popular', true);
    }
}
