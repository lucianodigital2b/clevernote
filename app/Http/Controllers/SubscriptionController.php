<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Laravel\Cashier\Exceptions\IncompletePayment;
use Illuminate\Validation\ValidationException;

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
        return Inertia::render('Billing/Success'); // create this React page
    }

    public function cancel()
    {
        return Inertia::render('Billing/Cancel'); // create this React page
    }

    public function createSetupIntent(Request $request)
    {
        return $request->user()->createSetupIntent();
    }

    public function subscribe(Request $request)
    {
        $request->validate([
            'payment_method' => 'required|string',
            'plan_id' => 'required|string',
            'name' => 'nullable|string|max:255',
        ]);

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

            return response()->json(['success' => true]);
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
}
