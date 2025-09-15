<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Subscription;
use App\Services\RevenueCatService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RevenueCatWebhookController extends Controller
{
    protected $revenueCatService;

    public function __construct(RevenueCatService $revenueCatService)
    {
        $this->revenueCatService = $revenueCatService;
    }

    /**
     * Handle RevenueCat webhook events
     */
    public function handle(Request $request)
    {
        try {
            // Verify webhook signature if needed
            // $this->verifyWebhookSignature($request);

            $payload = $request->all();
            $eventType = $payload['event_type'] ?? null;
            $event = $payload['event'] ?? [];

            Log::info('RevenueCat webhook received', [
                'event_type' => $eventType,
                'payload' => $payload
            ]);

            // Handle different event types
            switch ($eventType) {
                case 'INITIAL_PURCHASE':
                case 'RENEWAL':
                case 'PRODUCT_CHANGE':
                    $this->handleSubscriptionActivated($event);
                    break;

                case 'CANCELLATION':
                    $this->handleSubscriptionCancelled($event);
                    break;

                case 'EXPIRATION':
                    $this->handleSubscriptionExpired($event);
                    break;

                case 'BILLING_ISSUE':
                    $this->handleBillingIssue($event);
                    break;

                case 'SUBSCRIBER_ALIAS':
                    $this->handleSubscriberAlias($event);
                    break;

                default:
                    Log::warning('Unhandled RevenueCat webhook event type', [
                        'event_type' => $eventType
                    ]);
            }

            return response()->json(['status' => 'success'], 200);

        } catch (\Exception $e) {
            Log::error('RevenueCat webhook error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle subscription activated events (purchase, renewal, product change)
     */
    protected function handleSubscriptionActivated(array $event)
    {
        $appUserId = $event['app_user_id'] ?? null;
        $entitlements = $event['entitlements'] ?? [];
        $productId = $event['product_id'] ?? null;
        $platform = $this->mapPlatform($event['store'] ?? 'unknown');

        if (!$appUserId) {
            Log::warning('RevenueCat webhook: Missing app_user_id');
            return;
        }

        // Find user by RevenueCat app_user_id or email
        $user = $this->findUserByAppUserId($appUserId);
        if (!$user) {
            Log::warning('RevenueCat webhook: User not found', ['app_user_id' => $appUserId]);
            return;
        }

        // Process each entitlement
        foreach ($entitlements as $entitlementId => $entitlement) {
            if (isset($entitlement['expires_at'])) {
                $expiresAt = Carbon::createFromTimestampMs($entitlement['expires_at']);
                
                Subscription::createFromRevenueCat([
                    'user_id' => $user->id,
                    'customer_id' => $appUserId,
                    'entitlement_id' => $entitlementId,
                    'product_id' => $entitlement['product_identifier'] ?? $productId,
                    'platform' => $platform,
                    'is_trial' => false, // V2 API doesn't provide trial info in webhooks
                    'expires_at' => $expiresAt,
                    'metadata' => [
                        'webhook_event' => $event,
                        'entitlement_data' => $entitlement
                    ]
                ]);

                Log::info('RevenueCat subscription activated', [
                    'user_id' => $user->id,
                    'entitlement_id' => $entitlementId,
                    'expires_at' => $expiresAt->toISOString()
                ]);
            }
        }
    }

    /**
     * Handle subscription cancelled events
     */
    protected function handleSubscriptionCancelled(array $event)
    {
        $appUserId = $event['app_user_id'] ?? null;
        $entitlements = $event['entitlements'] ?? [];

        if (!$appUserId) {
            return;
        }

        $user = $this->findUserByAppUserId($appUserId);
        if (!$user) {
            return;
        }

        // Mark subscriptions as cancelled but keep them active until expiration
        foreach ($entitlements as $entitlementId => $entitlement) {
            $subscription = Subscription::where('user_id', $user->id)
                ->where('provider', 'revenuecat')
                ->where('revenuecat_entitlement_id', $entitlementId)
                ->first();

            if ($subscription) {
                $metadata = $subscription->revenuecat_metadata ?? [];
                $metadata['cancelled_at'] = now()->toISOString();
                $metadata['cancellation_event'] = $event;
                
                $subscription->update([
                    'revenuecat_metadata' => $metadata
                ]);

                Log::info('RevenueCat subscription cancelled', [
                    'user_id' => $user->id,
                    'entitlement_id' => $entitlementId
                ]);
            }
        }
    }

    /**
     * Handle subscription expired events
     */
    protected function handleSubscriptionExpired(array $event)
    {
        $appUserId = $event['app_user_id'] ?? null;
        $entitlements = $event['entitlements'] ?? [];

        if (!$appUserId) {
            return;
        }

        $user = $this->findUserByAppUserId($appUserId);
        if (!$user) {
            return;
        }

        // Update expiration date to past
        foreach ($entitlements as $entitlementId => $entitlement) {
            $subscription = Subscription::where('user_id', $user->id)
                ->where('provider', 'revenuecat')
                ->where('revenuecat_entitlement_id', $entitlementId)
                ->first();

            if ($subscription) {
                $metadata = $subscription->revenuecat_metadata ?? [];
                $metadata['expired_at'] = now()->toISOString();
                $metadata['expiration_event'] = $event;
                
                $subscription->update([
                    'revenuecat_expires_at' => now()->subMinute(), // Ensure it's in the past
                    'revenuecat_metadata' => $metadata
                ]);

                Log::info('RevenueCat subscription expired', [
                    'user_id' => $user->id,
                    'entitlement_id' => $entitlementId
                ]);
            }
        }
    }

    /**
     * Handle billing issue events
     */
    protected function handleBillingIssue(array $event)
    {
        $appUserId = $event['app_user_id'] ?? null;
        
        if (!$appUserId) {
            return;
        }

        $user = $this->findUserByAppUserId($appUserId);
        if (!$user) {
            return;
        }

        // Log billing issue for monitoring
        Log::warning('RevenueCat billing issue', [
            'user_id' => $user->id,
            'app_user_id' => $appUserId,
            'event' => $event
        ]);

        // Update subscription metadata with billing issue info
        $subscriptions = Subscription::where('user_id', $user->id)
            ->where('provider', 'revenuecat')
            ->where('revenuecat_customer_id', $appUserId)
            ->get();

        foreach ($subscriptions as $subscription) {
            $metadata = $subscription->revenuecat_metadata ?? [];
            $metadata['billing_issues'] = $metadata['billing_issues'] ?? [];
            $metadata['billing_issues'][] = [
                'occurred_at' => now()->toISOString(),
                'event' => $event
            ];
            
            $subscription->update([
                'revenuecat_metadata' => $metadata
            ]);
        }
    }

    /**
     * Handle subscriber alias events (when users are merged)
     */
    protected function handleSubscriberAlias(array $event)
    {
        $originalAppUserId = $event['original_app_user_id'] ?? null;
        $newAppUserId = $event['new_app_user_id'] ?? null;

        if (!$originalAppUserId || !$newAppUserId) {
            return;
        }

        // Update all subscriptions with the new app_user_id
        $updated = Subscription::where('provider', 'revenuecat')
            ->where('revenuecat_customer_id', $originalAppUserId)
            ->update(['revenuecat_customer_id' => $newAppUserId]);

        Log::info('RevenueCat subscriber alias updated', [
            'original_app_user_id' => $originalAppUserId,
            'new_app_user_id' => $newAppUserId,
            'subscriptions_updated' => $updated
        ]);
    }

    /**
     * Find user by RevenueCat app_user_id
     */
    protected function findUserByAppUserId(string $appUserId): ?User
    {
        // First try to find by existing subscription
        $subscription = Subscription::where('provider', 'revenuecat')
            ->where('revenuecat_customer_id', $appUserId)
            ->first();

        if ($subscription) {
            return $subscription->user;
        }

        // Try to find by email if app_user_id is an email
        if (filter_var($appUserId, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $appUserId)->first();
        }

        // Try to find by user ID if app_user_id is numeric
        if (is_numeric($appUserId)) {
            return User::find($appUserId);
        }

        return null;
    }

    /**
     * Map RevenueCat store to platform
     */
    protected function mapPlatform(string $store): string
    {
        return match($store) {
            'app_store' => 'ios',
            'play_store' => 'android',
            'stripe' => 'web',
            'amazon' => 'amazon',
            default => 'unknown'
        };
    }

    /**
     * Verify webhook signature (implement if needed)
     */
    protected function verifyWebhookSignature(Request $request): void
    {
        // Implement webhook signature verification if RevenueCat provides it
        // This would typically involve checking a signature header against
        // a shared secret to ensure the webhook is authentic
    }
}