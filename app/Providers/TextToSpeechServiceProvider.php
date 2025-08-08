<?php

namespace App\Providers;

use App\Contracts\TextToSpeechServiceInterface;
use App\Services\TextToSpeech\AmazonPollyService;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class TextToSpeechServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(TextToSpeechServiceInterface::class, function ($app) {
            $defaultProvider = config('tts.default');
            
            return $this->createProvider($defaultProvider);
        });
        
        // Register named providers for manual selection
        $this->app->bind('tts.amazon_polly', function ($app) {
            return $this->createProvider('amazon_polly');
        });
        
        // Future providers can be registered here
        // $this->app->bind('tts.google_cloud', function ($app) {
        //     return $this->createProvider('google_cloud');
        // });
        
        // $this->app->bind('tts.elevenlabs', function ($app) {
        //     return $this->createProvider('elevenlabs');
        // });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish configuration file
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../../config/tts.php' => config_path('tts.php'),
            ], 'tts-config');
        }
    }
    
    /**
     * Create a TTS provider instance.
     */
    protected function createProvider(string $provider): TextToSpeechServiceInterface
    {
        $config = config("tts.providers.{$provider}");
        
        if (!$config) {
            throw new InvalidArgumentException("TTS provider [{$provider}] is not configured.");
        }
        
        if (!($config['enabled'] ?? true)) {
            throw new InvalidArgumentException("TTS provider [{$provider}] is disabled.");
        }
        
        return match ($config['driver']) {
            'amazon_polly' => new AmazonPollyService(
                $config['config'],
                $config['defaults'] ?? []
            ),
            
            // Future providers
            // 'google_cloud' => new GoogleCloudTTSService(
            //     $config['config'],
            //     $config['defaults'] ?? []
            // ),
            
            // 'elevenlabs' => new ElevenLabsService(
            //     $config['config'],
            //     $config['defaults'] ?? []
            // ),
            
            default => throw new InvalidArgumentException(
                "Unsupported TTS driver [{$config['driver']}] for provider [{$provider}]."
            ),
        };
    }
    
    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [
            TextToSpeechServiceInterface::class,
            'tts.amazon_polly',
        ];
    }
}