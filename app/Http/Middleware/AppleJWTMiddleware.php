<?php

namespace App\Http\Middleware;

use App\Services\AppleJWTService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to automatically generate fresh Apple JWT tokens on each request
 * 
 * This middleware demonstrates the on-demand JWT generation approach
 * recommended in the blog post. It ensures that Apple authentication
 * always uses a fresh, valid JWT token.
 */
class AppleJWTMiddleware
{
    public function __construct(
        private AppleJWTService $appleJWTService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate fresh client secret for Apple authentication
        config()->set('services.apple.client_secret', $this->appleJWTService->generate());

        return $next($request);
    }
}