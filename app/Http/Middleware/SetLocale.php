<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// app/Http/Middleware/SetLocale.php
class SetLocale
{
    public function handle($request, Closure $next)
    {
        if ($request->user() && $request->user()->preferred_language) {
            app()->setLocale($request->user()->preferred_language);
        }
        
        return $next($request);
    }
}
