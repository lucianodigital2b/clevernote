<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AppleJWTService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AppleController extends Controller
{
    private AppleJWTService $appleJWTService;

    public function __construct(AppleJWTService $appleJWTService)
    {
        $this->appleJWTService = $appleJWTService;
    }

    public function redirectToApple()
    {
        return Socialite::driver('apple')->redirect();
    }

    public function handleAppleCallback()
    {
        try {
            $appleUser = Socialite::driver('apple')->user();
            
            $user = User::where('email', $appleUser->email)->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $appleUser->name ?? 'Apple User',
                    'email' => $appleUser->email,
                    'password' => bcrypt(Str::random(16)),
                    'apple_id' => $appleUser->id,
                ]);
            } else if (!$user->apple_id) {
                $user->apple_id = $appleUser->id;
                $user->save();
            }
            
            Auth::login($user);
            
            return redirect()->intended(route('dashboard'));
            
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Apple authentication failed. Please try again.');
        }
    }

    /**
     * Generate a new Apple Client Secret JWT
     * This method can be used for testing or manual token generation
     */
    public function generateClientSecret()
    {
        try {
            $jwt = $this->appleJWTService->generateClientSecret();
            
            return response()->json([
                'success' => true,
                'client_secret' => $jwt,
                'message' => 'Apple Client Secret generated successfully. Add this to your .env file as APPLE_CLIENT_SECRET.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}