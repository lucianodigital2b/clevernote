<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AppleJWTService;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppleController extends Controller
{
    private AppleJWTService $appleJWTService;

    public function __construct(AppleJWTService $appleJWTService)
    {
        $this->appleJWTService = $appleJWTService;
    }

    public function redirectToApple()
    {
        return Socialite::driver('apple')->stateless()->redirect();
    }

    public function handleAppleCallback(Request $request)
    {
        try {
            // Generate fresh client secret on each request
            config()->set('services.apple.client_secret', $this->appleJWTService->generate());
            
            $appleUser = Socialite::driver('apple')->stateless()->user();
            $user = User::where('apple_id', $appleUser->id)->first();
            
            Log::error(print_r($appleUser, true));

            if (!$user) {
                $user = User::create([
                    'name' => $appleUser->name ?? 'Apple User',
                    'email' => $appleUser->email ?? 'Apple Email',
                    'apple_id' => $appleUser->id,
                    'password' => bcrypt(Str::random(16)),
                    'registered_from_mobile' => $request->wantsJson(), // Set flag based on JSON request
                ]);
            } else if (!$user->apple_id) {
                $user->apple_id = $appleUser->id;
                $user->save();
            }
            
            // Update last_login timestamp
            $user->update(['last_login' => now()]);
            
            if($request->wantsJson()) {
                $token = $user->createToken('mobile-app')->plainTextToken;
                
                return response()->json([
                    'token' => $token,
                    'user' => $user
                ]);

            }


            Auth::login($user);
            // Check if user has completed onboarding
            if (!$user->onboarding_completed) {
                return redirect()->intended(route('onboarding.show'));
            }
            
            // Check if user has an active subscription
             $hasActiveSubscription = $user->hasAnyActiveSubscription();

             // If no active subscription, set session flag to show upgrade modal
             if (!$hasActiveSubscription) {
                 session()->flash('show_upgrade_modal', true);
             }

             return redirect()->route('dashboard');
            
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            throw new \Exception($e->getMessage());
        }
    }

    /**
     * Generate a new Apple Client Secret JWT
     * This method can be used for testing or manual token generation
     * Note: With the new approach, tokens are generated on-demand and expire in 1 hour
     */
    public function generateClientSecret()
    {
        try {
            $jwt = $this->appleJWTService->generate();
            
            return response()->json([
                'success' => true,
                'client_secret' => $jwt,
                'message' => 'Apple Client Secret generated successfully. This token expires in 1 hour and is generated fresh on each authentication request.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function loginWithApple(Request $request)
    {
        // Log::error(print_r($request->all(), true));

        $request->validate([
            'identity_token' => 'required|string',
        ]);

        $identityToken = $request->input('identity_token');

        try {
            // 1. Fetch Apple public keys
            $jwks = Http::get('https://appleid.apple.com/auth/keys')->json();

            // 2. Verify token
            $decoded = JWT::decode($identityToken, JWK::parseKeySet($jwks));

            // 3. Validate claims
            if ($decoded->iss !== 'https://appleid.apple.com') {
                throw new \Exception('Invalid issuer');
            }
            Log::error(print_r($decoded, true));

            if ($decoded->aud !== config('services.apple.client_id')) {
                throw new \Exception('Invalid audience');
            }

            // 4. Extract Apple ID + email
            $appleId = $decoded->sub;
            $email   = $decoded->email ?? $request->input('email'); // fallback
            $name    = $request->input('fullName.givenName') ?? 'Apple User';

            // 5. Find or create user
            $user = User::firstOrCreate(
                ['apple_id' => $appleId],
                [
                    'email' => $email,
                    'name'  => $name,
                    'password' => bcrypt(str()->random(16)),
                    'registered_from_mobile' => true, // This method is specifically for mobile Apple auth
                ]
            );

            // 6. Issue Laravel token
            $token = $user->createToken('mobile-app')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user'  => $user,
            ]);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json([
                'error' => 'Apple authentication failed',
                'details' => $e->getMessage(),
            ], 401);
        }
    }
}