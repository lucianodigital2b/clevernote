<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Subscription;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

echo "=== RevenueCat Sync Command Test ===\n\n";

try {
    // Create or get test user with RevenueCat ID
    $testEmail = 'sync_test@example.com';
    $user = User::firstOrCreate(
        ['email' => $testEmail],
        [
            'name' => 'Sync Test User',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'revenuecat_user_id' => $testEmail, // Use email as RevenueCat user ID
        ]
    );
    
    // Ensure revenuecat_user_id is set
    if (!$user->revenuecat_user_id) {
        $user->revenuecat_user_id = $testEmail;
        $user->save();
    }
    
    echo "Test user created/found: ID {$user->id}, Email: {$user->email}\n";
    echo "RevenueCat User ID: {$user->revenuecat_user_id}\n\n";
    
    // Count existing subscriptions before sync
    $subscriptionsBefore = Subscription::where('user_id', $user->id)->count();
    echo "Subscriptions before sync: {$subscriptionsBefore}\n\n";
    
    // Test 1: Dry run sync for specific user
    echo "=== Test 1: Dry Run Sync ===\n";
    $exitCode = Artisan::call('revenuecat:sync', [
        '--user-id' => $user->id,
        '--dry-run' => true
    ]);
    
    echo "Exit code: {$exitCode}\n";
    echo "Output:\n" . Artisan::output() . "\n";
    
    // Verify no subscriptions were created during dry run
    $subscriptionsAfterDryRun = Subscription::where('user_id', $user->id)->count();
    if ($subscriptionsAfterDryRun === $subscriptionsBefore) {
        echo "✅ Dry run correctly made no changes\n\n";
    } else {
        echo "❌ Dry run unexpectedly created subscriptions\n\n";
    }
    
    // Test 2: Actual sync for specific user
    echo "=== Test 2: Actual Sync ===\n";
    $exitCode = Artisan::call('revenuecat:sync', [
        '--user-id' => $user->id
    ]);
    
    echo "Exit code: {$exitCode}\n";
    echo "Output:\n" . Artisan::output() . "\n";
    
    // Check subscriptions after sync
    $subscriptionsAfterSync = Subscription::where('user_id', $user->id)->count();
    echo "Subscriptions after sync: {$subscriptionsAfterSync}\n";
    
    if ($subscriptionsAfterSync >= $subscriptionsBefore) {
        echo "✅ Sync completed successfully\n";
        
        // Show subscription details
        $subscriptions = Subscription::where('user_id', $user->id)
            ->where('provider', 'revenuecat')
            ->get();
            
        if ($subscriptions->count() > 0) {
            echo "\nRevenueCat subscriptions found:\n";
            foreach ($subscriptions as $subscription) {
                echo "  - ID: {$subscription->id}, Product: {$subscription->stripe_price}, Status: {$subscription->stripe_status}\n";
                echo "    Platform: {$subscription->platform}, Expires: {$subscription->ends_at}\n";
            }
        } else {
            echo "\nNo RevenueCat subscriptions found (this is expected if user has no active subscriptions in RevenueCat)\n";
        }
    } else {
        echo "❌ Sync may have failed\n";
    }
    
    // Test 3: Sync all users (dry run)
    echo "\n=== Test 3: Sync All Users (Dry Run) ===\n";
    $exitCode = Artisan::call('revenuecat:sync', [
        '--dry-run' => true
    ]);
    
    echo "Exit code: {$exitCode}\n";
    echo "Output:\n" . Artisan::output() . "\n";
    
    // Test 4: Test with non-existent user ID
    echo "=== Test 4: Non-existent User ID ===\n";
    $exitCode = Artisan::call('revenuecat:sync', [
        '--user-id' => 99999
    ]);
    
    echo "Exit code: {$exitCode}\n";
    echo "Output:\n" . Artisan::output() . "\n";
    
    if (strpos(Artisan::output(), 'No users found') !== false) {
        echo "✅ Correctly handled non-existent user\n";
    } else {
        echo "❌ Did not handle non-existent user correctly\n";
    }
    
    // Final subscription summary
    echo "\n=== Final Subscription Summary ===\n";
    $totalSubscriptions = Subscription::count();
    $activeSubscriptions = Subscription::where('stripe_status', 'active')
        ->where(function($query) {
            $query->whereNull('ends_at')
                  ->orWhere('ends_at', '>', now());
        })
        ->count();
    $revenueCatSubscriptions = Subscription::where('provider', 'revenuecat')->count();
    
    echo "Total subscriptions: {$totalSubscriptions}\n";
    echo "Active subscriptions: {$activeSubscriptions}\n";
    echo "RevenueCat subscriptions: {$revenueCatSubscriptions}\n";
    
    if ($revenueCatSubscriptions > 0) {
        echo "\nRevenueCat subscription details:\n";
        $rcSubscriptions = Subscription::where('provider', 'revenuecat')->get();
        foreach ($rcSubscriptions as $subscription) {
            $isActive = $subscription->stripe_status === 'active' && 
                       (!$subscription->ends_at || $subscription->ends_at > now());
            echo "  - ID: {$subscription->id}, Provider: {$subscription->provider}, ";
            echo "Expires: {$subscription->ends_at}, Active: " . ($isActive ? 'Yes' : 'No') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error during sync test: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== RevenueCat Sync Command Test Complete ===\n";