<?php

namespace App\Models;

use Laravel\Cashier\Subscription as CashierSubscription;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Subscription extends CashierSubscription
{
    protected $fillable = [
        'user_id',
        'name',
        'stripe_id',
        'stripe_status',
        'stripe_price',
        'quantity',
        'trial_ends_at',
        'ends_at',
        'provider',
        'revenuecat_customer_id',
        'revenuecat_entitlement_id',
        'revenuecat_product_id',
        'platform',
        'is_trial',
        'revenuecat_expires_at',
        'revenuecat_metadata'
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'ends_at' => 'datetime',
        'revenuecat_expires_at' => 'datetime',
        'is_trial' => 'boolean',
        'revenuecat_metadata' => 'array'
    ];

    /**
     * Check if subscription is active (override Cashier method)
     */
    public function active(): bool
    {
        if ($this->provider === 'revenuecat') {
            return $this->revenuecat_expires_at && 
                   $this->revenuecat_expires_at->isFuture();
        }
        
        // Use Cashier's active method for Stripe subscriptions
        return parent::active();
    }

    /**
     * Check if subscription is on trial (override Cashier method)
     */
    public function onTrial(): bool
    {
        if ($this->provider === 'revenuecat') {
            return $this->is_trial;
        }
        
        // Use Cashier's onTrial method for Stripe subscriptions
        return parent::onTrial();
    }

    /**
     * Get expiration date regardless of provider
     */
    public function getExpirationDate(): ?Carbon
    {
        if ($this->provider === 'revenuecat') {
            return $this->revenuecat_expires_at;
        }
        
        return $this->ends_at;
    }

    /**
     * Scope for active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('provider', 'stripe')
              ->where('stripe_status', 'active')
              ->where(function ($sq) {
                  $sq->whereNull('ends_at')
                     ->orWhere('ends_at', '>', now());
              })
              ->orWhere(function ($rq) {
                  $rq->where('provider', 'revenuecat')
                     ->where('revenuecat_expires_at', '>', now());
              });
        });
    }

    /**
     * Scope for Stripe subscriptions
     */
    public function scopeStripe($query)
    {
        return $query->where('provider', 'stripe');
    }

    /**
     * Scope for RevenueCat subscriptions
     */
    public function scopeRevenueCat($query)
    {
        return $query->where('provider', 'revenuecat');
    }

    /**
     * Create or update subscription from RevenueCat data
     */
    public static function createFromRevenueCat(array $data): self
    {
        return self::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'provider' => 'revenuecat',
                'revenuecat_customer_id' => $data['customer_id']
            ],
            [
                'name' => 'default', // Required by Cashier
                'revenuecat_entitlement_id' => $data['entitlement_id'],
                'revenuecat_product_id' => $data['product_id'],
                'platform' => $data['platform'] ?? 'unknown',
                'is_trial' => $data['is_trial'] ?? false,
                'revenuecat_expires_at' => $data['expires_at'],
                'revenuecat_metadata' => $data['metadata'] ?? []
            ]
        );
    }
}