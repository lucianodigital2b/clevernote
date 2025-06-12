<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="index, follow">
        <meta name="author" content="Clevernote">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        
        <!-- Primary Meta Tags -->
        <title inertia>{{ config('app.name', 'Clevernote') }}</title>
        <meta name="title" content="{{ config('app.name', 'Clevernote') }} - AI-Powered Study Platform">
        <meta name="description" content="Transform your learning with Clevernote's AI-powered study tools. Create flashcards, generate quizzes, and boost your academic performance with smart note-taking.">
        <meta name="keywords" content="AI study tools, flashcards, quiz generator, note taking, academic learning, study platform, education technology">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="{{ config('app.name', 'Clevernote') }} - AI-Powered Study Platform">
        <meta property="og:description" content="Transform your learning with Clevernote's AI-powered study tools. Create flashcards, generate quizzes, and boost your academic performance with smart note-taking.">
        <meta property="og:image" content="{{ asset('images/og-image.jpg') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="{{ config('app.name', 'Clevernote') }}">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="{{ url()->current() }}">
        <meta property="twitter:title" content="{{ config('app.name', 'Clevernote') }} - AI-Powered Study Platform">
        <meta property="twitter:description" content="Transform your learning with Clevernote's AI-powered study tools. Create flashcards, generate quizzes, and boost your academic performance with smart note-taking.">
        <meta property="twitter:image" content="{{ asset('images/twitter-image.jpg') }}">
        
        <!-- Canonical URL -->
        <link rel="canonical" href="{{ url()->current() }}">
        
        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('apple-touch-icon.png') }}">
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}">
        
        <!-- Structured Data -->
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "{{ config('app.name', 'Clevernote') }}",
            "description": "AI-powered study platform for creating flashcards, generating quizzes, and enhancing learning",
            "url": "{{ config('app.url') }}",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web Browser",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            },
            "creator": {
                "@type": "Organization",
                "name": "Clevernote",
                "url": "{{ config('app.url') }}"
            },
            "featureList": [
                "AI-powered flashcard generation",
                "Automated quiz creation",
                "Smart note-taking",
                "Progress tracking",
                "Multi-language support"
            ]
        }
        </script>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X1PTFS1FT2"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-X1PTFS1FT2');
        </script>
        
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
