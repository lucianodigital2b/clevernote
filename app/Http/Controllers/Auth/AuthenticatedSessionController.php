<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();

        // Update last_login timestamp
        $request->user()->update(['last_login' => now()]);

        if ($request->expectsJson()) {
            $token = $request->user()->createToken('main')->plainTextToken;

            return response()->json([
                'message' => 'Authentication successful',
                'user' => $request->user()->load('subscriptions', 'activeSubscriptions')->makeVisible(['xp', 'level'])->append('avatar'),
                'token' => $token,
            ]);
        }

        $request->session()->regenerate();

        // Check if user has an active subscription
        $user = $request->user();
        $hasActiveSubscription = $user->hasAnyActiveSubscription();

        // If no active subscription, set session flag to show upgrade modal
        if (!$hasActiveSubscription) {
            $request->session()->flash('show_upgrade_modal', true);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse|JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Logout successful',
                'redirect_url' => '/'
            ]);
        }

        return redirect('/');
    }
}
