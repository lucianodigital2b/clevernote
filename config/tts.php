<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Text-to-Speech Provider
    |--------------------------------------------------------------------------
    |
    | This option controls the default TTS provider that will be used by the
    | application. You may set this to any of the providers defined in the
    | "providers" array below.
    |
    */

    'default' => env('TTS_DEFAULT_PROVIDER', 'amazon_polly'),

    /*
    |--------------------------------------------------------------------------
    | Text-to-Speech Providers
    |--------------------------------------------------------------------------
    |
    | Here you may configure the TTS providers for your application. Each
    | provider has its own configuration options and capabilities.
    |
    */

    'providers' => [

        'amazon_polly' => [
            'driver' => 'amazon_polly',
            'enabled' => env('TTS_AMAZON_POLLY_ENABLED', true),
            'config' => [
                'access_key_id' => env('AWS_POLLY_ACCESS_KEY_ID', env('AWS_ACCESS_KEY_ID')),
                'secret_access_key' => env('AWS_POLLY_SECRET_ACCESS_KEY', env('AWS_SECRET_ACCESS_KEY')),
                'region' => env('AWS_POLLY_REGION', env('AWS_DEFAULT_REGION', 'us-east-1')),
            ],
            'defaults' => [
                'voice_id' => env('TTS_AMAZON_POLLY_DEFAULT_VOICE', 'Joanna'),
                'language_code' => env('TTS_AMAZON_POLLY_DEFAULT_LANGUAGE', 'en-US'),
                'engine' => env('TTS_AMAZON_POLLY_DEFAULT_ENGINE', 'standard'),
                'output_format' => env('TTS_AMAZON_POLLY_DEFAULT_FORMAT', 'mp3'),
            ],
        ],

        // Future providers can be added here
        // 'google_cloud' => [
        //     'driver' => 'google_cloud',
        //     'enabled' => env('TTS_GOOGLE_CLOUD_ENABLED', false),
        //     'config' => [
        //         'project_id' => env('GOOGLE_CLOUD_PROJECT_ID'),
        //         'key_file' => env('GOOGLE_CLOUD_KEY_FILE'),
        //     ],
        //     'defaults' => [
        //         'voice_name' => env('TTS_GOOGLE_CLOUD_DEFAULT_VOICE', 'en-US-Wavenet-D'),
        //         'language_code' => env('TTS_GOOGLE_CLOUD_DEFAULT_LANGUAGE', 'en-US'),
        //         'audio_encoding' => env('TTS_GOOGLE_CLOUD_DEFAULT_ENCODING', 'MP3'),
        //     ],
        // ],

        // 'elevenlabs' => [
        //     'driver' => 'elevenlabs',
        //     'enabled' => env('TTS_ELEVENLABS_ENABLED', false),
        //     'config' => [
        //         'api_key' => env('ELEVENLABS_API_KEY'),
        //     ],
        //     'defaults' => [
        //         'voice_id' => env('TTS_ELEVENLABS_DEFAULT_VOICE', 'pNInz6obpgDQGcFmaJgB'),
        //         'model_id' => env('TTS_ELEVENLABS_DEFAULT_MODEL', 'eleven_monolingual_v1'),
        //     ],
        // ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global TTS Settings
    |--------------------------------------------------------------------------
    |
    | These settings apply to all TTS providers and control general behavior
    | of the text-to-speech functionality.
    |
    */

    'settings' => [
        
        // Maximum text length for single TTS request (characters)
        'max_text_length' => env('TTS_MAX_TEXT_LENGTH', 3000),
        
        // Whether to automatically chunk long content
        'auto_chunk_long_content' => env('TTS_AUTO_CHUNK_LONG_CONTENT', true),
        
        // Default options for podcast generation
        'podcast_defaults' => [
            'include_intro' => env('TTS_PODCAST_INCLUDE_INTRO', true),
            'include_conclusion' => env('TTS_PODCAST_INCLUDE_CONCLUSION', false),
            'use_ssml' => env('TTS_PODCAST_USE_SSML', false),
            'notify_user' => env('TTS_PODCAST_NOTIFY_USER', true),
        ],
        
        // Storage settings
        'storage' => [
            'disk' => env('TTS_STORAGE_DISK', 'r2'),
            'path' => env('TTS_STORAGE_PATH', 'podcasts'),
            'cleanup_failed_files' => env('TTS_CLEANUP_FAILED_FILES', true),
        ],
        
        // Queue settings
        'queue' => [
            'connection' => env('TTS_QUEUE_CONNECTION', env('QUEUE_CONNECTION', 'database')),
            'queue' => env('TTS_QUEUE_NAME', 'default'),
            'timeout' => env('TTS_QUEUE_TIMEOUT', 600), // 10 minutes
            'tries' => env('TTS_QUEUE_TRIES', 3),
            'backoff' => env('TTS_QUEUE_BACKOFF', 30), // seconds
        ],
        
        // Rate limiting
        'rate_limiting' => [
            'enabled' => env('TTS_RATE_LIMITING_ENABLED', true),
            'max_requests_per_user_per_hour' => env('TTS_MAX_REQUESTS_PER_USER_PER_HOUR', 10),
            'max_requests_per_user_per_day' => env('TTS_MAX_REQUESTS_PER_USER_PER_DAY', 50),
        ],
        
    ],

    /*
    |--------------------------------------------------------------------------
    | Voice Presets
    |--------------------------------------------------------------------------
    |
    | Predefined voice configurations for different use cases. These can be
    | used to provide users with easy-to-select voice options.
    |
    */

    'voice_presets' => [
        
        'professional_female' => [
            'name' => 'Professional Female',
            'description' => 'Clear, professional female voice suitable for business content',
            'amazon_polly' => [
                'voice_id' => 'Joanna',
                'engine' => 'neural',
                'language_code' => 'en-US',
            ],
        ],
        
        'professional_male' => [
            'name' => 'Professional Male',
            'description' => 'Clear, professional male voice suitable for business content',
            'amazon_polly' => [
                'voice_id' => 'Matthew',
                'engine' => 'neural',
                'language_code' => 'en-US',
            ],
        ],
        
        'casual_female' => [
            'name' => 'Casual Female',
            'description' => 'Friendly, conversational female voice',
            'amazon_polly' => [
                'voice_id' => 'Kimberly',
                'engine' => 'neural',
                'language_code' => 'en-US',
            ],
        ],
        
        'casual_male' => [
            'name' => 'Casual Male',
            'description' => 'Friendly, conversational male voice',
            'amazon_polly' => [
                'voice_id' => 'Joey',
                'engine' => 'neural',
                'language_code' => 'en-US',
            ],
        ],
        
        'british_female' => [
            'name' => 'British Female',
            'description' => 'British English female voice',
            'amazon_polly' => [
                'voice_id' => 'Amy',
                'engine' => 'neural',
                'language_code' => 'en-GB',
            ],
        ],
        
        'british_male' => [
            'name' => 'British Male',
            'description' => 'British English male voice',
            'amazon_polly' => [
                'voice_id' => 'Brian',
                'engine' => 'neural',
                'language_code' => 'en-GB',
            ],
        ],
        
    ],

];