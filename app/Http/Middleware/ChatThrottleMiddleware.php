<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom throttle middleware for chat functionality
 * Provides enhanced rate limiting with mobile-friendly error responses
 */
class ChatThrottleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $maxAttempts = 10, int $decayMinutes = 1): Response
    {
        $key = $this->resolveRequestSignature($request);
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $retryAfter = RateLimiter::availableIn($key);
            
            return response()->json([
                'error' => 'Too many chat requests',
                'message' => 'You have exceeded the chat rate limit. Please wait before sending another message.',
                'retry_after' => $retryAfter,
                'retry_after_human' => $this->formatRetryAfter($retryAfter),
                'max_attempts' => $maxAttempts,
                'time_window' => $decayMinutes . ' minute' . ($decayMinutes > 1 ? 's' : ''),
            ], 429, [
                'Retry-After' => $retryAfter,
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => now()->addSeconds($retryAfter)->timestamp,
            ]);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        // Add rate limit headers to successful responses
        $remaining = RateLimiter::remaining($key, $maxAttempts);
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => now()->addMinutes($decayMinutes)->timestamp,
        ]);

        return $response;
    }

    /**
     * Resolve the request signature for rate limiting
     */
    protected function resolveRequestSignature(Request $request): string
    {
        // Use user ID if authenticated, otherwise fall back to IP
        if ($request->user()) {
            return 'chat_throttle:user:' . $request->user()->id;
        }

        return 'chat_throttle:ip:' . $request->ip();
    }

    /**
     * Format retry after seconds into human-readable format
     */
    protected function formatRetryAfter(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds . ' second' . ($seconds > 1 ? 's' : '');
        }

        $minutes = ceil($seconds / 60);
        return $minutes . ' minute' . ($minutes > 1 ? 's' : '');
    }
}