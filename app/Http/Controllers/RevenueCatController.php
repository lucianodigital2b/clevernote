<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Services\RevenueCatService;

class RevenueCatController extends Controller
{
    private RevenueCatService $revenueCatService;

    public function __construct(RevenueCatService $revenueCatService)
    {
        $this->revenueCatService = $revenueCatService;
    }

    /**
     * Link user to RevenueCat
     */
    public function linkUser(Request $request)
    {
        $request->validate([
            'revenuecat_user_id' => 'required|string|max:255'
        ]);

        $user = $request->user();
        $revenueCatUserId = $request->input('revenuecat_user_id');

        // Update user with RevenueCat user ID
        $user->update([
            'revenuecat_user_id' => $revenueCatUserId
        ]);

        // Optionally create the subscriber in RevenueCat if it doesn't exist
        $this->revenueCatService->createSubscriber($revenueCatUserId, [
            'email' => $user->email,
            'display_name' => $user->name
        ]);

        return response()->json([
            'message' => 'User linked to RevenueCat successfully',
            'revenuecat_user_id' => $revenueCatUserId
        ]);
    }

    /**
     * Get current subscription status from RevenueCat
     */
    public function getSubscriptionStatus(Request $request)
    {
        $user = $request->user();
        
        if (!$user->revenuecat_user_id) {
            return response()->json([
                'error' => 'User not linked to RevenueCat',
                'subscription_details' => [
                    'has_active_subscription' => false,
                    'platform' => null,
                    'expires_at' => null,
                    'product_id' => null,
                    'is_trial' => false
                ]
            ], 400);
        }

        try {
            $subscriptionDetails = $user->getMobileSubscriptionDetails();
            
            return response()->json([
                'message' => 'Subscription status retrieved successfully',
                'subscription_details' => $subscriptionDetails
            ]);
            
        } catch (\Exception $e) {
            Log::error('Get subscription status error', [
                'user_id' => $user->id,
                'revenuecat_user_id' => $user->revenuecat_user_id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to retrieve subscription status'
            ], 500);
        }
    }

    /**
     * Refresh subscription status from RevenueCat
     * This endpoint can be called when the mobile app wants to sync status
     */
    public function refreshSubscription(Request $request)
    {
        $user = $request->user();
        
        if (!$user->revenuecat_user_id) {
            return response()->json([
                'error' => 'User not linked to RevenueCat'
            ], 400);
        }

        try {
            // Force refresh by calling the service directly
            $hasActiveSubscription = $this->revenueCatService->hasActiveSubscription($user->revenuecat_user_id);
            $subscriptionDetails = $this->revenueCatService->getSubscriptionDetails($user->revenuecat_user_id);
            
            return response()->json([
                'message' => 'Subscription status refreshed successfully',
                'has_active_subscription' => $hasActiveSubscription,
                'subscription_details' => $subscriptionDetails
            ]);
            
        } catch (\Exception $e) {
            Log::error('Refresh subscription error', [
                'user_id' => $user->id,
                'revenuecat_user_id' => $user->revenuecat_user_id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to refresh subscription status'
            ], 500);
        }
    }
}