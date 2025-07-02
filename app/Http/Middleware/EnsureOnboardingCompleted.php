<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip onboarding check for certain routes
        $excludedRoutes = [
            'onboarding.show',
            'onboarding.store',
            'logout',
            'password.*',
            'verification.*',
        ];

        // Check if current route should be excluded
        foreach ($excludedRoutes as $pattern) {
            if ($request->routeIs($pattern)) {
                return $next($request);
            }
        }

        // If user is authenticated but hasn't completed onboarding
        if (Auth::check() && !Auth::user()->onboarding_completed) {
            return redirect()->route('onboarding.show');
        }

        return $next($request);
    }
}