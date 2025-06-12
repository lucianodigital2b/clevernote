<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Laravel\Cashier\Exceptions\IncompletePayment;
use Illuminate\Validation\ValidationException;
use App\Models\Price;

class SubscriptionController extends Controller
{
    public function createCheckout(Request $request)
    {
        $user = $request->user();

        $checkout = $user->newSubscription('default', 'price_XXXXXX') // Replace with your Stripe Price ID
            ->checkout([
                'success_url' => route('billing.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('billing.cancel'),
            ]);

        return response()->json(['checkout_url' => $checkout->url]);
    }

    public function success(Request $request)
    {
        $user = $request->user();
        $subscriptionData = null;
        
        // Get the latest subscription for the user
        $subscription = $user->subscriptions()->latest()->first();
        
        if ($subscription) {
            // Get the price and product details
            $price = Price::where('stripe_price_id', $subscription->stripe_price)
                ->with('product')
                ->first();
                
            if ($price) {
                $subscriptionData = [
                    'product_name' => $price->product->name,
                    'amount' => $price->amount,
                    'currency' => $price->currency,
                    'interval' => $price->interval,
                    'features' => $price->product->features,
                    'subscription_id' => $subscription->id,
                    'created_at' => $subscription->created_at->format('Y-m-d H:i:s')
                ];
            }
        }
        
        return Inertia::render('Billing/Success', [
            'subscription' => $subscriptionData
        ]);
    }

    public function cancel(Request $request, $subscriptionId)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->where('id', $subscriptionId)->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Subscription not found.'], 404);
        }

        try {
            $subscription->cancel();
            
            return response()->json([
                'success' => true,
                'ends_at' => $subscription->ends_at,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function resume(Request $request, $subscriptionId)
    {
        $user = $request->user();
        $subscription = $user->subscriptions()->where('id', $subscriptionId)->first();

        if (!$subscription) {
            return response()->json(['success' => false, 'message' => 'Subscription not found.'], 404);
        }

        try {
            $subscription->resume();
            return response()->json([
                'success' => true,
                'stripe_status' => $subscription->stripe_status,
                'ends_at' => $subscription->ends_at,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function createSetupIntent(Request $request)
    {
        return $request->user()->createSetupIntent();
    }

    public function subscribe(Request $request)
    {

        // $request->validate([
            // 'payment_method' => 'required|string',
            // 'plan_id' => 'required|string',
            // 'name' => 'nullable|string|max:255',
        // ]);

        $user = $request->user();

        try {
            if (!$user->hasStripeId()) {
                $user->createAsStripeCustomer();
            }

            // Attach payment method
            $user->updateDefaultPaymentMethod($request->payment_method);

            // Create subscription
            $subscription = $user->newSubscription('default', $request->plan_id)
                ->create($request->payment_method);

            // Get the product details for the subscribed plan
            $price = Price::where('stripe_price_id', $request->plan_id)->with('product')->first();
            
            return response()->json([
                'success' => true,
                'subscription_id' => $subscription->id,
                'product' => $price ? [
                    'name' => $price->product->name,
                    'amount' => $price->amount,
                    'currency' => $price->currency,
                    'interval' => $price->interval,
                    'features' => $price->product->features
                ] : null
            ]);
        } catch (IncompletePayment $exception) {
            // Payment requires additional action

            return response()->json([
                'success' => false,
                'requires_action' => true,
                'payment_intent_client_secret' => $exception->payment->client_secret,
                'message' => 'Payment requires additional action.',
            ], 402);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Check if the authenticated user has an active subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkSubscription(Request $request)
    {
        $user = $request->user();
        
        $hasActiveSubscription = $user->subscriptions()
            ->where(function ($query) {
                $query->where('stripe_status', 'active')
                    ->orWhere('stripe_status', 'trialing');
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->exists();

        return response()->json([
            'hasActiveSubscription' => $hasActiveSubscription
        ]);
    }
}
