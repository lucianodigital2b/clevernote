<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\RevenueCatWebhookController;
use App\Services\RevenueCatService;

echo "=== RevenueCat Webhook Test ===\n\n";

try {
    // Create or get test user with email that matches app_user_id
    $testEmail = 'webhook_test@example.com';
    $user = User::firstOrCreate(
        ['email' => $testEmail],
        [
            'name' => 'Webhook Test User',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'revenuecat_user_id' => $testEmail, // Use email as app_user_id for webhook matching
        ]
    );
    
    // Ensure revenuecat_user_id is set
    if (!$user->revenuecat_user_id) {
        $user->revenuecat_user_id = $testEmail;
        $user->save();
    }
    
    echo "Test user created/found: ID {$user->id}, Email: {$user->email}\n";
    echo "RevenueCat User ID: {$user->revenuecat_user_id}\n\n";
    
    // Test 1: Test webhook authentication
    echo "=== Test 1: Webhook Authentication ===\n";
    
    $revenueCatService = app(RevenueCatService::class);
    $webhookController = new RevenueCatWebhookController($revenueCatService);
    
    // Test invalid auth
    $invalidRequest = Request::create('/webhooks/revenuecat', 'POST', [], [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer invalid_token'
    ]);
    
    try {
        $webhookController->handle($invalidRequest);
        echo "❌ Invalid auth test failed - should have thrown 401\n";
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        if ($e->getStatusCode() === 401) {
            echo "✅ Invalid auth correctly rejected with 401\n";
        } else {
            echo "❌ Invalid auth test failed - wrong status code: {$e->getStatusCode()}\n";
        }
    }
    
    // Test valid auth
    $validRequest = Request::create('/webhooks/revenuecat', 'POST', [
        'event_type' => 'TEST_EVENT',
        'event' => [
            'app_user_id' => $testEmail
        ]
    ], [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $response = $webhookController->handle($validRequest);
    if ($response->getStatusCode() === 200) {
        echo "✅ Valid auth accepted\n";
    } else {
        echo "❌ Valid auth test failed - status: {$response->getStatusCode()}\n";
    }
    
    echo "\n=== Test 2: INITIAL_PURCHASE Event ===\n";
    
    $purchasePayload = [
        'event_type' => 'INITIAL_PURCHASE',
        'event' => [
            'app_user_id' => $testEmail,
            'product_id' => 'premium_monthly',
            'store' => 'app_store',
            'entitlements' => [
                'premium' => [
                    'expires_at' => (now()->addMonth()->timestamp * 1000), // milliseconds
                    'product_identifier' => 'premium_monthly'
                ]
            ]
        ]
    ];
    
    $purchaseRequest = Request::create('/webhooks/revenuecat', 'POST', $purchasePayload, [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $initialSubCount = $user->subscriptions()->count();
    $response = $webhookController->handle($purchaseRequest);
    $finalSubCount = $user->subscriptions()->count();
    
    if ($response->getStatusCode() === 200 && $finalSubCount > $initialSubCount) {
        echo "✅ INITIAL_PURCHASE event processed successfully\n";
        $newSub = $user->subscriptions()->latest()->first();
        echo "   Created subscription ID: {$newSub->id}\n";
        echo "   Provider: {$newSub->provider}\n";
        echo "   Expires at: {$newSub->revenuecat_expires_at}\n";
    } else {
        echo "❌ INITIAL_PURCHASE event failed\n";
    }
    
    echo "\n=== Test 3: RENEWAL Event ===\n";
    
    $renewalPayload = [
        'event_type' => 'RENEWAL',
        'event' => [
            'app_user_id' => $testEmail,
            'product_id' => 'premium_monthly',
            'store' => 'play_store',
            'entitlements' => [
                'premium' => [
                    'expires_at' => (now()->addMonths(2)->timestamp * 1000),
                    'product_identifier' => 'premium_monthly'
                ]
            ]
        ]
    ];
    
    $renewalRequest = Request::create('/webhooks/revenuecat', 'POST', $renewalPayload, [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $beforeRenewalCount = $user->subscriptions()->count();
    $response = $webhookController->handle($renewalRequest);
    $afterRenewalCount = $user->subscriptions()->count();
    
    if ($response->getStatusCode() === 200) {
        echo "✅ RENEWAL event processed successfully\n";
        echo "   Subscriptions before: {$beforeRenewalCount}, after: {$afterRenewalCount}\n";
    } else {
        echo "❌ RENEWAL event failed\n";
    }
    
    echo "\n=== Test 4: CANCELLATION Event ===\n";
    
    $cancellationPayload = [
        'event_type' => 'CANCELLATION',
        'event' => [
            'app_user_id' => $testEmail,
            'product_id' => 'premium_monthly',
            'entitlements' => [
                'premium' => [
                    'expires_at' => (now()->addDays(7)->timestamp * 1000),
                    'product_identifier' => 'premium_monthly'
                ]
            ]
        ]
    ];
    
    $cancellationRequest = Request::create('/webhooks/revenuecat', 'POST', $cancellationPayload, [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $response = $webhookController->handle($cancellationRequest);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ CANCELLATION event processed successfully\n";
    } else {
        echo "❌ CANCELLATION event failed\n";
    }
    
    echo "\n=== Test 5: Unknown Event Type ===\n";
    
    $unknownPayload = [
        'event_type' => 'UNKNOWN_EVENT_TYPE',
        'event' => [
            'app_user_id' => $testEmail
        ]
    ];
    
    $unknownRequest = Request::create('/webhooks/revenuecat', 'POST', $unknownPayload, [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $response = $webhookController->handle($unknownRequest);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Unknown event type handled gracefully\n";
    } else {
        echo "❌ Unknown event type handling failed\n";
    }
    
    echo "\n=== Test 6: Missing User Event ===\n";
    
    $missingUserPayload = [
        'event_type' => 'INITIAL_PURCHASE',
        'event' => [
            'app_user_id' => 'non_existent_user_456',
            'entitlements' => [
                'premium' => [
                    'expires_at' => (now()->addMonth()->timestamp * 1000),
                    'product_identifier' => 'premium_monthly'
                ]
            ]
        ]
    ];
    
    $missingUserRequest = Request::create('/webhooks/revenuecat', 'POST', $missingUserPayload, [], [], [
        'HTTP_AUTHORIZATION' => 'Bearer d3tQvaSQg#5t'
    ]);
    
    $response = $webhookController->handle($missingUserRequest);
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Missing user event handled gracefully\n";
    } else {
        echo "❌ Missing user event handling failed\n";
    }
    
    echo "\n=== Final Subscription Summary ===\n";
    $user->refresh();
    $totalSubs = $user->subscriptions()->count();
    $activeSubs = $user->subscriptions()->where('revenuecat_expires_at', '>', now())->count();
    $revenuecatSubs = $user->subscriptions()->where('provider', 'revenuecat')->count();
    
    echo "Total subscriptions: {$totalSubs}\n";
    echo "Active subscriptions: {$activeSubs}\n";
    echo "RevenueCat subscriptions: {$revenuecatSubs}\n";
    
    if ($totalSubs > 0) {
        echo "\nSubscription details:\n";
        foreach ($user->subscriptions as $sub) {
            echo "  - ID: {$sub->id}, Provider: {$sub->provider}, Expires: {$sub->revenuecat_expires_at}, Active: " . ($sub->active() ? 'Yes' : 'No') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Webhook test failed: {$e->getMessage()}\n";
    echo "Stack trace: {$e->getTraceAsString()}\n";
}

echo "\n=== RevenueCat Webhook Test Complete ===\n";