<?php

namespace App\Console\Commands;

use App\Services\AppleJWTService;
use Illuminate\Console\Command;
use Exception;

class GenerateAppleJWT extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'apple:generate-jwt {--months=6 : Number of months until expiration (max 6)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate Apple Client Secret JWT token';

    private AppleJWTService $appleJWTService;

    public function __construct(AppleJWTService $appleJWTService)
    {
        parent::__construct();
        $this->appleJWTService = $appleJWTService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $months = (int) $this->option('months');
            
            if ($months > 6 || $months < 1) {
                $this->error('Expiration months must be between 1 and 6.');
                return 1;
            }

            $this->info('Generating Apple Client Secret JWT...');
            
            $jwt = $this->appleJWTService->generateClientSecret($months);
            
            $this->newLine();
            $this->line('<fg=green>Apple Client Secret JWT generated successfully!</>');
            $this->newLine();
            
            $this->line('<fg=yellow>JWT Token:</>');
            $this->line($jwt);
            $this->newLine();
            
            $this->line('<fg=yellow>Add this to your .env file:</>');
            $this->line('APPLE_CLIENT_SECRET=' . $jwt);
            $this->newLine();
            
            $expirationDate = date('Y-m-d H:i:s', time() + ($months * 30 * 24 * 60 * 60));
            $this->line('<fg=cyan>Token expires on: ' . $expirationDate . '</>');
            $this->line('<fg=cyan>Remember to regenerate before expiration!</>');
            
            return 0;
            
        } catch (Exception $e) {
            $this->error('Failed to generate Apple JWT: ' . $e->getMessage());
            return 1;
        }
    }
}