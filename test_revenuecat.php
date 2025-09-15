<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Get first user
$user = App\Models\User::first();

if (!$user) {
    echo "No users found in database\n";
    exit(1);
}

echo "Testing RevenueCat functionality with User ID: {$user->id}\n";
echo "User Email: {$user->email}\n";

// Test 1: Link user to RevenueCat
echo "\n=== Test 1: Linking User to RevenueCat ===\n";
$revenueCatUserId = 'test_mobile_user_' . $user->id;

try {
    $user->update(['revenuecat_user_id' => $revenueCatUserId]);
    echo "✅ User linked to RevenueCat ID: {$revenueCatUserId}\n";
} catch (Exception $e) {
    echo "❌ Failed to link user: {$e->getMessage()}\n";
}

// Test 2: Test RevenueCat Service
echo "\n=== Test 2: Testing RevenueCat Service ===\n";
try {
    $revenueCatService = app(App\Services\RevenueCatService::class);
    $result = $revenueCatService->testSubscriberStatus($revenueCatUserId);
    echo "RevenueCat API Test Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "❌ RevenueCat Service Error: {$e->getMessage()}\n";
}

// Test 3: Check subscription status
echo "\n=== Test 3: Checking Subscription Status ===\n";
try {
    $hasActiveSubscription = $revenueCatService->hasActiveSubscription($revenueCatUserId);
    echo $hasActiveSubscription ? "✅ User has active subscription\n" : "ℹ️ User has no active subscription\n";
} catch (Exception $e) {
    echo "❌ Subscription check failed: {$e->getMessage()}\n";
}

// Test 4: Test RevenueCat Controller Methods
echo "\n=== Test 4: Testing RevenueCat Controller ===\n";
try {
    $controller = new App\Http\Controllers\RevenueCatController($revenueCatService);
    
    // Create a mock request with the user
    $request = new Illuminate\Http\Request();
    $request->setUserResolver(function() use ($user) {
        return $user;
    });
    
    // Test getSubscriptionStatus
    $response = $controller->getSubscriptionStatus($request);
    $data = $response->getData(true);
    echo "Subscription Status Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "❌ Controller test failed: {$e->getMessage()}\n";
}

// Test 5: Test Subscription Model Methods
echo "\n=== Test 5: Testing Subscription Model ===\n";
try {
    // Check user's subscriptions
    $subscriptions = $user->subscriptions;
    echo "Total subscriptions: " . $subscriptions->count() . "\n";
    
    $revenueCatSubscriptions = $user->revenueCatSubscriptions;
    echo "RevenueCat subscriptions: " . $revenueCatSubscriptions->count() . "\n";
    
    // Test creating a mock RevenueCat subscription
    $mockSubscriptionData = [
        'user_id' => $user->id,
        'customer_id' => $revenueCatUserId,
        'entitlement_id' => 'premium',
        'product_id' => 'premium_monthly',
        'platform' => 'ios',
        'expires_at' => now()->addMonth(),
        'is_trial' => false,
        'metadata' => ['test' => true]
    ];
    
    $subscription = App\Models\Subscription::createFromRevenueCat($mockSubscriptionData);
    $subscription->save();
    
    echo "✅ Mock RevenueCat subscription created with ID: {$subscription->id}\n";
    echo "Subscription expires at: {$subscription->revenuecat_expires_at}\n";
    echo "Is active: " . ($subscription->active() ? 'Yes' : 'No') . "\n";
    
} catch (Exception $e) {
    echo "❌ Subscription model test failed: {$e->getMessage()}\n";
}

echo "\n=== RevenueCat Test Complete ===\n";