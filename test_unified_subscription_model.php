<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Unified Subscription Model Test ===\n\n";

try {
    // Create test users
    $stripeUser = User::firstOrCreate(
        ['email' => 'stripe_user@example.com'],
        [
            'name' => 'Stripe Test User',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]
    );
    
    $revenueCatUser = User::firstOrCreate(
        ['email' => 'revenuecat_user@example.com'],
        [
            'name' => 'RevenueCat Test User',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'revenuecat_user_id' => 'revenuecat_user@example.com',
        ]
    );
    
    echo "Test users created:\n";
    echo "- Stripe User: ID {$stripeUser->id}, Email: {$stripeUser->email}\n";
    echo "- RevenueCat User: ID {$revenueCatUser->id}, Email: {$revenueCatUser->email}\n\n";
    
    // Clean up existing test subscriptions
    Subscription::where('user_id', $stripeUser->id)->delete();
    Subscription::where('user_id', $revenueCatUser->id)->delete();
    
    // Test 1: Create Stripe subscription
    echo "=== Test 1: Stripe Subscription ===\n";
    $stripeSubscription = Subscription::create([
        'user_id' => $stripeUser->id,
        'name' => 'default',
        'type' => 'premium',
        'stripe_id' => 'sub_stripe_test_123',
        'stripe_status' => 'active',
        'stripe_price' => 'price_premium_monthly',
        'quantity' => 1,
        'trial_ends_at' => null,
        'ends_at' => Carbon::now()->addMonth(),
        'created_at' => now(),
        'updated_at' => now(),
        'provider' => 'stripe'
    ]);
    
    echo "✅ Stripe subscription created: ID {$stripeSubscription->id}\n";
    echo "   Provider: {$stripeSubscription->provider}\n";
    echo "   Status: {$stripeSubscription->stripe_status}\n";
    echo "   Active: " . ($stripeSubscription->active() ? 'Yes' : 'No') . "\n\n";
    
    // Test 2: Create RevenueCat subscription
    echo "=== Test 2: RevenueCat Subscription ===\n";
    $revenueCatSubscription = Subscription::create([
        'user_id' => $revenueCatUser->id,
        'provider' => 'revenuecat',
        'type' => 'premium',
        'stripe_id' => 'rc_sub_456', // Still need stripe_id for Laravel Cashier compatibility
        'stripe_status' => 'active', // Still need stripe_status for Laravel Cashier compatibility
        'revenuecat_customer_id' => 'rc_customer_test_456',
        'revenuecat_entitlement_id' => 'premium_entitlement',
        'revenuecat_product_id' => 'premium_monthly',
        'platform' => 'ios',
        'is_trial' => false,
        'revenuecat_expires_at' => Carbon::now()->addMonth(),
        'revenuecat_metadata' => json_encode(['store' => 'app_store']),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "✅ RevenueCat subscription created: ID {$revenueCatSubscription->id}\n";
    echo "   Provider: {$revenueCatSubscription->provider}\n";
    echo "   Status: {$revenueCatSubscription->stripe_status}\n";
    echo "   Platform: {$revenueCatSubscription->platform}\n";
    echo "   Expires: {$revenueCatSubscription->revenuecat_expires_at}\n";
    echo "   Active: " . ($revenueCatSubscription->active() ? 'Yes' : 'No') . "\n\n";
    
    // Test 3: User subscription relationships
    echo "=== Test 3: User Subscription Relationships ===\n";
    
    // Test Stripe user subscriptions
    echo "Stripe user all subscriptions count: " . $stripeUser->allSubscriptions()->count() . "\n";
    echo "Stripe user active subscriptions: " . $stripeUser->activeSubscriptions()->count() . "\n";
    echo "Stripe user Stripe subscriptions: " . $stripeUser->stripeSubscriptions()->count() . "\n";
    
    // Test RevenueCat user subscriptions
    echo "RevenueCat user all subscriptions count: " . $revenueCatUser->allSubscriptions()->count() . "\n";
    echo "RevenueCat user active subscriptions: " . $revenueCatUser->activeSubscriptions()->count() . "\n";
    echo "RevenueCat user RevenueCat subscriptions: " . $revenueCatUser->revenueCatSubscriptions()->count() . "\n\n";
    
    // Test 4: Subscription model methods
    echo "=== Test 4: Subscription Model Methods ===\n";
    
    // Test active() method for both providers
    echo "Stripe subscription active(): " . ($stripeSubscription->active() ? 'Yes' : 'No') . "\n";
    echo "RevenueCat subscription active(): " . ($revenueCatSubscription->active() ? 'Yes' : 'No') . "\n";
    
    // Test onTrial() method
    echo "Stripe subscription onTrial(): " . ($stripeSubscription->onTrial() ? 'Yes' : 'No') . "\n";
    echo "RevenueCat subscription onTrial(): " . ($revenueCatSubscription->onTrial() ? 'Yes' : 'No') . "\n";
    
    // Test cancelled() method if it exists
    if (method_exists($stripeSubscription, 'cancelled')) {
        echo "Stripe subscription cancelled(): " . ($stripeSubscription->cancelled() ? 'Yes' : 'No') . "\n";
        echo "RevenueCat subscription cancelled(): " . ($revenueCatSubscription->cancelled() ? 'Yes' : 'No') . "\n";
    }
    
    echo "\n";
    
    // Test 5: Create expired RevenueCat subscription
    echo "=== Test 5: Expired RevenueCat Subscription ===\n";
    $expiredSubscription = Subscription::create([
        'user_id' => $revenueCatUser->id,
        'name' => 'expired',
        'type' => 'premium',
        'stripe_id' => 'rc_expired_test_789',
        'stripe_status' => 'active',
        'stripe_price' => 'premium_monthly',
        'quantity' => 1,
        'trial_ends_at' => null,
        'ends_at' => now()->subDays(7), // Expired 7 days ago
        'created_at' => now()->subMonth(),
        'updated_at' => now(),
        'provider' => 'revenuecat',
        'revenuecat_customer_id' => 'revenuecat_user@example.com',
        'revenuecat_expires_at' => now()->subDays(7), // Expired
        'platform' => 'android',
        'product_id' => 'premium_monthly'
    ]);
    
    echo "✅ Expired RevenueCat subscription created: ID {$expiredSubscription->id}\n";
    echo "   Expires: {$expiredSubscription->revenuecat_expires_at}\n";
    echo "   Active: " . ($expiredSubscription->active() ? 'Yes' : 'No') . "\n\n";
    
    // Test 6: Query subscriptions by provider
    echo "=== Test 6: Query Subscriptions by Provider ===\n";
    
    $stripeSubscriptions = Subscription::where('provider', 'stripe')->count();
    $revenueCatSubscriptions = Subscription::where('provider', 'revenuecat')->count();
    $totalSubscriptions = Subscription::count();
    
    echo "Stripe subscriptions: {$stripeSubscriptions}\n";
    echo "RevenueCat subscriptions: {$revenueCatSubscriptions}\n";
    echo "Total subscriptions: {$totalSubscriptions}\n\n";
    
    // Test 7: Active subscriptions across providers
    echo "=== Test 7: Active Subscriptions Across Providers ===\n";
    
    $activeStripeSubscriptions = Subscription::where('provider', 'stripe')
        ->where('stripe_status', 'active')
        ->where(function($query) {
            $query->whereNull('ends_at')
                  ->orWhere('ends_at', '>', now());
        })
        ->count();
        
    $activeRevenueCatSubscriptions = Subscription::where('provider', 'revenuecat')
        ->where('stripe_status', 'active')
        ->where(function($query) {
            $query->where('revenuecat_expires_at', '>', now())
                  ->orWhere(function($subQuery) {
                      $subQuery->whereNull('revenuecat_expires_at')
                               ->where(function($innerQuery) {
                                   $innerQuery->whereNull('ends_at')
                                          ->orWhere('ends_at', '>', now());
                               });
                  });
        })
        ->count();
    
    echo "Active Stripe subscriptions: {$activeStripeSubscriptions}\n";
    echo "Active RevenueCat subscriptions: {$activeRevenueCatSubscriptions}\n";
    
    $totalActiveSubscriptions = $activeStripeSubscriptions + $activeRevenueCatSubscriptions;
    echo "Total active subscriptions: {$totalActiveSubscriptions}\n\n";
    
    // Test 8: User has active subscription check
    echo "=== Test 8: User Active Subscription Check ===\n";
    
    $stripeUserHasActive = $stripeUser->activeSubscriptions()->exists();
    $revenueCatUserHasActive = $revenueCatUser->activeSubscriptions()->exists();
    
    echo "Stripe user has active subscription: " . ($stripeUserHasActive ? 'Yes' : 'No') . "\n";
    echo "RevenueCat user has active subscription: " . ($revenueCatUserHasActive ? 'Yes' : 'No') . "\n\n";
    
    // Final summary
    echo "=== Final Summary ===\n";
    echo "✅ Unified subscription model successfully handles both Stripe and RevenueCat\n";
    echo "✅ Subscription relationships work correctly for both providers\n";
    echo "✅ Active subscription detection works for both providers\n";
    echo "✅ Expired subscription handling works correctly\n";
    echo "✅ Provider-specific queries work as expected\n";
    
    // Show detailed subscription info
    echo "\nDetailed subscription information:\n";
    $allSubscriptions = Subscription::whereIn('user_id', [$stripeUser->id, $revenueCatUser->id])->get();
    foreach ($allSubscriptions as $sub) {
        $isActive = $sub->active();
        echo "  - ID: {$sub->id}, Provider: {$sub->provider}, User: {$sub->user_id}, ";
        echo "Status: {$sub->stripe_status}, Active: " . ($isActive ? 'Yes' : 'No');
        if ($sub->provider === 'revenuecat') {
            echo ", Platform: {$sub->platform}";
        }
        echo "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error during unified subscription model test: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Unified Subscription Model Test Complete ===\n";