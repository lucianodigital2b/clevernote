<?php

namespace App\Console\Commands;

use App\Services\AppleJWTService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RenewAppleJWT extends Command
{
    protected $signature = 'apple:renew-jwt {--force : Force renewal even if token is still valid}';
    protected $description = 'Automatically renew Apple JWT if expiring soon';

    public function handle(AppleJWTService $service)
    {
        $currentToken = config('services.apple.client_secret');
        
        // Check if token expires within 30 days
        if (!$this->option('force') && $service->isTokenValid($currentToken)) {
            $this->info('Token is still valid, no renewal needed.');
            return 0;
        }

        try {
            $newToken = $service->generateClientSecret();
            
            // Update .env file or use a more sophisticated config management
            $this->updateEnvFile('APPLE_CLIENT_SECRET', $newToken);
            
            Log::info('Apple JWT token renewed successfully');
            $this->info('Apple JWT token renewed successfully!');
            
        } catch (\Exception $e) {
            Log::error('Failed to renew Apple JWT: ' . $e->getMessage());
            $this->error('Failed to renew token: ' . $e->getMessage());
            return 1;
        }
    }

    private function updateEnvFile($key, $value)
    {
        // Implementation for updating .env file
        // Consider using a package like vlucas/phpdotenv or custom solution
    }
}