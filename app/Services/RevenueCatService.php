<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class RevenueCatService
{
    private string $apiKey;
    private ?string $projectId;
    /**
     * RevenueCat API base URL
     * Using V2 API as the secret key is V2 compatible
     */
    private string $baseUrl = 'https://api.revenuecat.com/v2';
    private int $cacheMinutes = 5; // Cache results for 5 minutes as recommended by RevenueCat

    public function __construct()
    {
        $this->apiKey = config('services.revenuecat.secret_key');
        $this->projectId = config('services.revenuecat.project_id');
        
        if (empty($this->projectId)) {
            throw new \Exception('RevenueCat project ID is not configured. Please set REVENUECAT_PROJECT_ID in your .env file.');
        }
    }

    /**
     * Get subscriber information from RevenueCat using V2 API
     */
    public function getSubscriber(string $appUserId): ?array
    {
        try {
            // URL encode the app user ID to handle special characters like $ in anonymous IDs
            $encodedUserId = urlencode($appUserId);
            
            // V2 API uses /projects/{project_id}/customers/{customer_id} format
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->get("{$this->baseUrl}/projects/{$this->projectId}/customers/{$encodedUserId}");

            if ($response->successful()) {
                return $response->json();
            }

            if ($response->status() === 404) {
                // Customer not found in RevenueCat
                Log::info('RevenueCat customer not found', ['app_user_id' => $appUserId]);
                return null;
            }

            Log::error('RevenueCat API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'app_user_id' => $appUserId,
                'encoded_user_id' => $encodedUserId,
                'project_id' => $this->projectId,
                'endpoint' => "{$this->baseUrl}/projects/{$this->projectId}/customers/{$encodedUserId}"
            ]);

            return null;
        } catch (Exception $e) {
            Log::error('RevenueCat service error', [
                'message' => $e->getMessage(),
                'app_user_id' => $appUserId,
                'trace' => $e->getTraceAsString()
            ]);

            return null;
        }
    }

    /**
     * Check if user has active subscription using V2 API response format
     */
    public function hasActiveSubscription(string $appUserId): bool
    {
        $customer = $this->getSubscriber($appUserId);

        if (!$customer) {
            return false;
        }

        // V2 API structure: customer has active_entitlements.items array
        $activeEntitlements = $customer['active_entitlements']['items'] ?? [];

        // Check if any active entitlements exist and are not expired
         foreach ($activeEntitlements as $entitlement) {
             if (isset($entitlement['expires_at'])) {
                 // V2 API uses timestamp in milliseconds
                 $expiryDate = \Carbon\Carbon::createFromTimestampMs($entitlement['expires_at']);
                 if ($expiryDate->isFuture()) {
                     return true;
                 }
             }
         }

        return false;
    }

    /**
     * Get subscription details for a user using V2 API response format
     */
    public function getSubscriptionDetails(string $appUserId): array
    {
        $customer = $this->getSubscriber($appUserId);
        
        if (!$customer) {
            return [
                'has_active_subscription' => false,
                'platform' => null,
                'expires_at' => null,
                'product_id' => null,
                'is_trial' => false
            ];
        }

        // V2 API structure: customer has active_entitlements.items array
        $activeEntitlements = $customer['active_entitlements']['items'] ?? [];
        
        // Check if user has any active entitlements
        $hasActiveEntitlement = !empty($activeEntitlements);
        $latestExpiry = null;
        $platform = null;
        $productId = null;
        $isTrial = false;
        
        foreach ($activeEntitlements as $entitlement) {
            if (isset($entitlement['expires_at'])) {
                // V2 API uses timestamp in milliseconds
                $expiryDate = \Carbon\Carbon::createFromTimestampMs($entitlement['expires_at']);
                
                if ($expiryDate->isFuture()) {
                    if (!$latestExpiry || $expiryDate->isAfter($latestExpiry)) {
                        $latestExpiry = $expiryDate;
                        $productId = $entitlement['entitlement_id'] ?? null;
                        // V2 API doesn't provide store info in entitlements, set as unknown for now
                        $platform = 'unknown';
                        // V2 API structure doesn't have trial info in entitlements
                        $isTrial = false;
                    }
                }
            }
        }
        
        return [
            'has_active_subscription' => $hasActiveEntitlement,
            'platform' => $platform,
            'expires_at' => $latestExpiry ? $latestExpiry->toISOString() : null,
            'product_id' => $productId,
            'is_trial' => $isTrial
        ];
    }

    /**
     * Check if entitlement is active
     */
    private function isEntitlementActive(array $entitlement): bool
    {
        $expiresDate = $entitlement['expires_date'] ?? null;
        
        if (!$expiresDate) {
            return false;
        }

        return now()->lt(\Carbon\Carbon::parse($expiresDate));
    }

    /**
     * Check if subscription is in trial period
     */
    private function isTrialPeriod(array $entitlement): bool
    {
        return isset($entitlement['period_type']) && $entitlement['period_type'] === 'trial';
    }

    /**
     * Map RevenueCat store to platform name
     */
    private function getPlatformFromStore(string $store): string
    {
        return match($store) {
            'app_store' => 'ios',
            'play_store' => 'android',
            'amazon' => 'amazon',
            'stripe' => 'web',
            default => $store
        };
    }

    /**
     * Get subscriber info (alias for getSubscriber for compatibility)
     */
    public function getSubscriberInfo(string $appUserId): ?array
    {
        $subscriber = $this->getSubscriber($appUserId);
        
        if (!$subscriber) {
            return null;
        }
        
        // Convert V2 API format to V1-like format for compatibility
        return [
            'subscriber' => [
                'entitlements' => $this->convertEntitlementsToV1Format($subscriber['active_entitlements']['items'] ?? []),
                'subscriptions' => $subscriber['subscriptions'] ?? []
            ]
        ];
    }
    
    /**
     * Convert V2 entitlements format to V1-like format for compatibility
     */
    private function convertEntitlementsToV1Format(array $entitlements): array
    {
        $converted = [];
        
        foreach ($entitlements as $entitlement) {
            $entitlementId = $entitlement['entitlement_id'] ?? 'default';
            $converted[$entitlementId] = [
                'expires_date' => isset($entitlement['expires_at']) ? 
                    \Carbon\Carbon::createFromTimestampMs($entitlement['expires_at'])->toISOString() : null,
                'product_identifier' => $entitlement['product_id'] ?? null,
                'purchase_date' => isset($entitlement['purchased_at']) ? 
                    \Carbon\Carbon::createFromTimestampMs($entitlement['purchased_at'])->toISOString() : null,
                'original_purchase_date' => isset($entitlement['purchased_at']) ? 
                    \Carbon\Carbon::createFromTimestampMs($entitlement['purchased_at'])->toISOString() : null,
                'store' => $entitlement['store'] ?? 'unknown',
                'is_sandbox' => $entitlement['environment'] === 'SANDBOX'
            ];
        }
        
        return $converted;
    }

    /**
     * Create or update subscriber in RevenueCat
     */
    public function createSubscriber(string $appUserId, array $attributes = []): ?array
    {
        try {
            $payload = [
                'app_user_id' => $appUserId
            ];

            if (!empty($attributes)) {
                $payload['attributes'] = $attributes;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/subscribers", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('RevenueCat create subscriber error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'app_user_id' => $appUserId
            ]);

            return null;
        } catch (Exception $e) {
            Log::error('RevenueCat create subscriber service error', [
                'message' => $e->getMessage(),
                'app_user_id' => $appUserId
            ]);

            return null;
        }
    }

    /**
     * Test method to check API connectivity and user subscription status
     * Useful for testing with known user IDs like $RCAnonymousID:53e42c4b0f524b09acc4413505b8f4de
     */
    public function testSubscriberStatus(string $appUserId): array
    {
        $startTime = microtime(true);
        
        try {
            $subscriber = $this->getSubscriber($appUserId);
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2); // Convert to milliseconds
            
            if (!$subscriber) {
                return [
                    'success' => false,
                    'message' => 'Subscriber not found or API error',
                    'app_user_id' => $appUserId,
                    'response_time_ms' => $responseTime,
                    'api_url' => $this->baseUrl,
                    'has_api_key' => !empty($this->apiKey)
                ];
            }
            
            $subscriptionDetails = $this->getSubscriptionDetails($appUserId);
            
            return [
                'success' => true,
                'message' => 'Successfully retrieved subscriber data',
                'app_user_id' => $appUserId,
                'response_time_ms' => $responseTime,
                'api_url' => $this->baseUrl,
                'has_api_key' => !empty($this->apiKey),
                'subscriber_data' => [
                    'has_active_subscription' => $subscriptionDetails['has_active_subscription'],
                    'platform' => $subscriptionDetails['platform'],
                    'expires_at' => $subscriptionDetails['expires_at'],
                    'product_id' => $subscriptionDetails['product_id'],
                    'is_trial' => $subscriptionDetails['is_trial']
                ],
                'raw_entitlements' => $subscriber['active_entitlements']['items'] ?? [],
                'raw_subscriptions' => $subscriber['subscriptions'] ?? []
            ];
            
        } catch (Exception $e) {
            $endTime = microtime(true);
            $responseTime = round(($endTime - $startTime) * 1000, 2);
            
            return [
                'success' => false,
                'message' => 'Exception occurred: ' . $e->getMessage(),
                'app_user_id' => $appUserId,
                'response_time_ms' => $responseTime,
                'api_url' => $this->baseUrl,
                'has_api_key' => !empty($this->apiKey),
                'exception' => $e->getMessage()
            ];
        }
    }
}