<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Laravel\Cashier\Exceptions\IncompletePayment;
use Illuminate\Validation\ValidationException;
use App\Models\Price;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

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
        // For non-authenticated users, return a simple response
        // They don't need a setup intent as they'll create payment method during subscription
        if (!$request->user()) {
            return response()->json(['setup_intent' => null]);
        }
        
        return $request->user()->createSetupIntent();
    }

    public function getPricingData(Request $request)
    {
        $plan = $request->get('plan', 'yearly');
        
        // Get the active product (assuming there's only one active product for now)
        $product = Product::active()->with('activePrices')->first();
        
        if (!$product) {
            return response()->json(['error' => 'No active product found'], 404);
        }
        
        // Get the price based on billing cycle
        // Handle both 'yearly' and 'annual' as valid values for yearly billing
        $interval = ($plan === 'yearly' || $plan === 'annual') ? 'year' : 'month';
        $price = $product->activePrices()->where('interval', $interval)->first();
        
        if (!$price) {
            return response()->json(['error' => 'Price not found for the selected plan'], 404);
        }
        
        return response()->json([
            'product_name' => $product->name,
            'amount' => $price->amount,
            'formatted_amount' => $price->formatted_amount,
            'currency' => $price->currency,
            'interval' => $price->interval,
            'stripe_price_id' => $price->stripe_price_id,
            'plan' => $plan
        ]);
    }

    public function subscribe(Request $request)
    {
        // Check if user registration is needed (email and password provided)
        $createAccount = $request->has('email') && $request->has('password') && $request->boolean('create_account', false);
        
        if ($createAccount) {
            // Validate registration fields
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
                'password' => ['required', Rules\Password::defaults()],
                'payment_method' => 'required|string',
                'billing_cycle' => 'required|string|in:monthly,yearly,annual',
            ]);

            // Create new user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            event(new Registered($user));
            Auth::login($user);
        } else {
            // Validate subscription fields for existing users
            $request->validate([
                'payment_method' => 'required|string',
                'billing_cycle' => 'required|string|in:monthly,yearly,annual',
                'name' => 'nullable|string|max:255',
            ]);
        }

        $user = $request->user();

        // Get the active product and find the price based on billing cycle
        $product = Product::active()->with('activePrices')->first();
        
        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'No active product found.',
            ], 404);
        }
        
        $interval = ($request->billing_cycle === 'yearly' || $request->billing_cycle === 'annual') ? 'year' : 'month';
        $price = $product->activePrices()->where('interval', $interval)->first();
        
        if (!$price) {
            return response()->json([
                'success' => false,
                'message' => 'Price not found for the selected billing cycle.',
            ], 404);
        }

        try {
            if (!$user->hasStripeId()) {
                $user->createAsStripeCustomer();
            }

            // Attach payment method
            $user->updateDefaultPaymentMethod($request->payment_method);

            // Create subscription using the found price
            $subscription = $user->newSubscription('default', $price->stripe_price_id)
                ->create($request->payment_method);
            
            return response()->json([
                'success' => true,
                'subscription_id' => $subscription->id,
                'user_created' => $createAccount,
                'product' => [
                    'name' => $product->name,
                    'amount' => $price->amount,
                    'currency' => $price->currency,
                    'interval' => $price->interval,
                    'features' => $product->features
                ]
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
