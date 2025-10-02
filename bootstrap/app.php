<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\EnsureOnboardingCompleted;
use App\Http\Middleware\RestrictToAdminEmail;
use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Sentry\Laravel\Integration;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->web(append: [
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureOnboardingCompleted::class,
        ]);
        
        // $middleware->web(replace: [
        //     \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class => VerifyCsrfToken::class,
        // ]);
        
        // Exclude RevenueCat webhook from CSRF verification
        // $middleware->validateCsrfTokens(except: [
        //     'api/webhooks/revenuecat',
        // ]);
        
        $middleware->alias([
            'admin.email' => RestrictToAdminEmail::class,
            'chat.throttle' => \App\Http\Middleware\ChatThrottleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response) {
            if ($response->getStatusCode() === 419) {
                return back()->with([
                    'message' => 'The page expired, please try again.',
                ]);
            }
    
            return $response;
        });

        Integration::handles($exceptions);
    })->create();
