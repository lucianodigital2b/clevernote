<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $user = User::where('email', $googleUser->email)->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'password' => bcrypt(Str::random(16)),
                    'google_id' => $googleUser->id,
                    'registered_from_mobile' => true, // This method is specifically for mobile Google auth
                ]);
            } else if (!$user->google_id) {
                $user->google_id = $googleUser->id;
                $user->save();
            }
            
            Auth::login($user);
            
            // Update last_login timestamp
            $user->update(['last_login' => now()]);
            
            // Check if user has completed onboarding
            if (!$user->onboarding_completed) {
                return redirect()->intended(route('onboarding.show'));
            }
            
            // Check if user has an active subscription
             $hasActiveSubscription = $user->activeSubscriptions()->exists();

             // If no active subscription, set session flag to show upgrade modal
             if (!$hasActiveSubscription) {
                 session()->flash('show_upgrade_modal', true);
             }

             return redirect()->route('dashboard');
            
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Google authentication failed. Please try again.');
        }
    }


    public function handleMobileGoogleAuth(Request $request)
    {
        try {
            $idToken = $request->input('id_token');
            $accessToken = $request->input('access_token');
            
            // Verify the ID token with Google
            $client = new \Google_Client(['client_id' => config('services.google.client_id')]);
            $payload = $client->verifyIdToken($idToken);
            
            if (!$payload) {
                return response()->json(['error' => 'Invalid Google token'], 401);
            }
            
            $googleUser = (object) [
                'id' => $payload['sub'],
                'name' => $payload['name'],
                'email' => $payload['email'],
            ];
            
            $user = User::where('email', $googleUser->email)->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'password' => bcrypt(Str::random(16)),
                    'google_id' => $googleUser->id,
                ]);
            } else if (!$user->google_id) {
                $user->google_id = $googleUser->id;
                $user->save();
            }
            
            // Update last_login timestamp
            $user->update(['last_login' => now()]);
            
            // Create API token for mobile app
            $token = $user->createToken('mobile-app')->plainTextToken;
            
            return response()->json([
                'token' => $token,
                'user' => $user
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Google authentication failed'], 500);
        }
    }
}