<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Event;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Ecdsa\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind JWT Configuration for Apple JWT Service
        $this->app->bind(Configuration::class, function () {
            $privateKeyPath = storage_path('app/keys/AuthKey_' . config('services.apple.key_id') . '.p8');
            
            if (!file_exists($privateKeyPath)) {
                throw new \Exception('Apple private key file not found at: ' . $privateKeyPath);
            }
            
            $privateKey = trim(file_get_contents($privateKeyPath));
            
            if (empty($privateKey)) {
                throw new \Exception('Apple private key is empty');
            }
            
            // Extract public key from private key for asymmetric signer
            $privateKeyResource = openssl_pkey_get_private($privateKey);
            if (!$privateKeyResource) {
                throw new \Exception('Failed to parse Apple private key');
            }
            
            $keyDetails = openssl_pkey_get_details($privateKeyResource);
            if (!$keyDetails || !isset($keyDetails['key'])) {
                throw new \Exception('Failed to extract public key from Apple private key');
            }
            
            $publicKey = $keyDetails['key'];
            
            return Configuration::forAsymmetricSigner(
                new Sha256(),
                InMemory::plainText($privateKey),
                InMemory::plainText($publicKey)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        URL::forceScheme('https');

        Event::listen(function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
            $event->extendSocialite('apple', \SocialiteProviders\Apple\Provider::class);
        });

        LogViewer::auth(function ($request) {
            return $request->user()
                && in_array($request->user()->email, [
                    'husky15@hotmail.com',
                ]);
        });
    }
}
