<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Subscription;
use App\Services\RevenueCatService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Carbon\Carbon;

class RevenueCatSubscriptionTest extends TestCase
{
    use DatabaseTransactions;

    protected RevenueCatService $revenueCatService;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User'
        ]);
        
        $this->revenueCatService = app(RevenueCatService::class);
    }

    /** @test */
    public function it_can_create_a_revenuecat_subscription_for_user()
    {
        // Mock RevenueCat API response
        Http::fake([
            'api.revenuecat.com/v2/projects/*/customers/*' => Http::response([
                'customer' => [
                    'id' => 'test_user_123',
                    'created_at' => '2024-01-01T00:00:00Z',
                    'entitlements' => [
                        'premium' => [
                            'expires_date' => '2024-12-31T23:59:59Z',
                            'product_identifier' => 'premium_monthly',
                            'purchase_date' => '2024-01-01T00:00:00Z'
                        ]
                    ],
                    'subscriptions' => [
                        'premium_monthly' => [
                            'expires_date' => '2024-12-31T23:59:59Z',
                            'product_identifier' => 'premium_monthly',
                            'purchase_date' => '2024-01-01T00:00:00Z',
                            'store' => 'app_store'
                        ]
                    ]
                ]
            ], 200)
        ]);

        // Create RevenueCat subscription data
        $subscriptionData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => Carbon::parse('2024-12-31T23:59:59Z'),
            'metadata' => [
                'store' => 'app_store',
                'purchase_date' => '2024-01-01T00:00:00Z'
            ]
        ];

        // Create subscription using the model method
        $subscription = Subscription::createFromRevenueCat($subscriptionData);

        // Assert subscription was created correctly
        $this->assertInstanceOf(Subscription::class, $subscription);
        $this->assertEquals($this->user->id, $subscription->user_id);
        $this->assertEquals('revenuecat', $subscription->provider);
        $this->assertEquals('test_user_123', $subscription->revenuecat_customer_id);
        $this->assertEquals('premium', $subscription->revenuecat_entitlement_id);
        $this->assertEquals('premium_monthly', $subscription->revenuecat_product_id);
        $this->assertEquals('ios', $subscription->platform);
        $this->assertFalse($subscription->is_trial);
        $this->assertEquals('2024-12-31 23:59:59', $subscription->revenuecat_expires_at->format('Y-m-d H:i:s'));
        
        // Assert subscription is active
        $this->assertTrue($subscription->active());
        
        // Assert user has active subscription
        $this->assertTrue($this->user->activeSubscriptions()->exists());
    }

    /** @test */
    public function it_can_create_a_trial_revenuecat_subscription()
    {
        $subscriptionData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'android',
            'is_trial' => true,
            'expires_at' => Carbon::now()->addDays(7),
            'metadata' => [
                'store' => 'play_store',
                'trial_period' => '7_days'
            ]
        ];

        $subscription = Subscription::createFromRevenueCat($subscriptionData);

        $this->assertTrue($subscription->is_trial);
        $this->assertTrue($subscription->onTrial());
        $this->assertEquals('android', $subscription->platform);
        $this->assertArrayHasKey('trial_period', $subscription->revenuecat_metadata);
    }

    /** @test */
    public function it_can_update_existing_revenuecat_subscription()
    {
        // Create initial subscription
        $initialData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => true,
            'expires_at' => Carbon::now()->addDays(7),
        ];

        $subscription = Subscription::createFromRevenueCat($initialData);
        $originalId = $subscription->id;

        // Update subscription (trial ended, now paid)
        $updatedData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => Carbon::now()->addMonth(),
        ];

        $updatedSubscription = Subscription::createFromRevenueCat($updatedData);

        // Should update the same record, not create a new one
        $this->assertEquals($originalId, $updatedSubscription->id);
        $this->assertFalse($updatedSubscription->is_trial);
        $this->assertTrue($updatedSubscription->revenuecat_expires_at->isAfter(Carbon::now()->addDays(20)));
        
        // Should only have one subscription in database
        $this->assertEquals(1, Subscription::count());
    }

    /** @test */
    public function it_handles_expired_revenuecat_subscription()
    {
        $subscriptionData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => Carbon::now()->subDays(1), // Expired yesterday
        ];

        $subscription = Subscription::createFromRevenueCat($subscriptionData);

        $this->assertFalse($subscription->active());
        $this->assertFalse($this->user->activeSubscriptions()->exists());
    }

    /** @test */
    public function it_can_coexist_with_stripe_subscriptions()
    {
        // Create a Stripe subscription using Laravel Cashier
        $stripeSubscription = $this->user->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_stripe_123',
            'stripe_status' => 'active',
            'stripe_price' => 'price_123',
            'quantity' => 1,
            'provider' => 'stripe'
        ]);

        // Create a RevenueCat subscription
        $revenueCatData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => Carbon::now()->addMonth(),
        ];

        $revenueCatSubscription = Subscription::createFromRevenueCat($revenueCatData);

        // User should have both subscriptions
        $this->assertEquals(2, $this->user->allSubscriptions()->count());
        $this->assertEquals(1, $this->user->stripeSubscriptions()->count());
        $this->assertEquals(1, $this->user->revenueCatSubscriptions()->count());
        
        // Both should be considered active
        $this->assertEquals(2, $this->user->activeSubscriptions()->count());
        
        // Verify provider filtering works
        $this->assertEquals('stripe', $stripeSubscription->provider);
        $this->assertEquals('revenuecat', $revenueCatSubscription->provider);
    }

    /** @test */
    public function it_can_get_subscription_expiration_date_regardless_of_provider()
    {
        $expirationDate = Carbon::now()->addMonth();
        
        // RevenueCat subscription
        $revenueCatData = [
            'user_id' => $this->user->id,
            'customer_id' => 'test_user_123',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => $expirationDate,
        ];

        $revenueCatSubscription = Subscription::createFromRevenueCat($revenueCatData);
        
        // Test expiration date method
        $this->assertEquals(
            $expirationDate->format('Y-m-d H:i:s'),
            $revenueCatSubscription->getExpirationDate()->format('Y-m-d H:i:s')
        );
    }

    /** @test */
    public function it_validates_revenuecat_service_integration()
    {
        // Mock successful RevenueCat API call
        Http::fake([
            'api.revenuecat.com/v2/projects/*/customers/*' => Http::response([
                'customer' => [
                    'id' => 'test_user_123',
                    'active_entitlements' => [
                        'items' => [
                            [
                                'entitlement_id' => 'premium',
                                'expires_at' => 1735689599000, // 2024-12-31T23:59:59Z in milliseconds
                                'product_identifier' => 'premium_monthly'
                            ]
                        ]
                    ]
                ]
            ], 200)
        ]);

        // Test service method
        $hasActiveSubscription = $this->revenueCatService->hasActiveSubscription('test_user_123');
        $this->assertTrue($hasActiveSubscription);
        
        // Verify HTTP call was made
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'test_user_123') &&
                   $request->hasHeader('Authorization', 'Bearer ' . config('services.revenuecat.secret_key'));
        });
    }

    /** @test */
    public function it_handles_revenuecat_service_errors_gracefully()
    {
        // Mock API error
        Http::fake([
            'api.revenuecat.com/v2/projects/*/customers/*' => Http::response([
                'error' => 'Customer not found'
            ], 404)
        ]);

        $hasActiveSubscription = $this->revenueCatService->hasActiveSubscription('nonexistent_user');
        $this->assertFalse($hasActiveSubscription);
    }

    /** @test */
    public function it_can_scope_subscriptions_correctly()
    {
        // Clean up any existing RevenueCat subscriptions for this test
        Subscription::where('provider', 'revenuecat')->delete();
        
        // Create multiple subscription types
        $activeRevenueCat = Subscription::createFromRevenueCat([
            'user_id' => $this->user->id,
            'customer_id' => 'active_user',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'ios',
            'is_trial' => false,
            'expires_at' => Carbon::now()->addMonth(),
        ]);

        $expiredRevenueCat = Subscription::createFromRevenueCat([
            'user_id' => $this->user->id,
            'customer_id' => 'expired_user',
            'entitlement_id' => 'premium',
            'product_id' => 'premium_monthly',
            'platform' => 'android',
            'is_trial' => false,
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $stripeSubscription = $this->user->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_stripe_123',
            'stripe_status' => 'active',
            'stripe_price' => 'price_123',
            'quantity' => 1,
            'provider' => 'stripe'
        ]);

        // Test scopes
        $this->assertEquals(2, Subscription::revenueCat()->count());
        $this->assertEquals(1, Subscription::stripe()->count());
        $this->assertEquals(2, Subscription::active()->count()); // Active RevenueCat + Active Stripe
        $this->assertEquals(3, Subscription::count()); // Total
    }
}