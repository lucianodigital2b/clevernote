<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RevenueCatService;

class TestRevenueCat extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'revenuecat:test {user_id? : The RevenueCat user ID to test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test RevenueCat API integration with a user ID';

    /**
     * Execute the console command.
     */
    public function handle(RevenueCatService $revenueCatService)
    {
        $userId = $this->argument('user_id') ?? '$RCAnonymousID:53e42c4b0f524b09acc4413505b8f4de';
        
        $this->info("Testing RevenueCat API with user ID: {$userId}");
        $this->newLine();
        
        // Check if project ID is configured
        if (empty(config('services.revenuecat.project_id'))) {
            $this->error('❌ RevenueCat Project ID is not configured!');
            $this->newLine();
            $this->info('To configure RevenueCat V2 API:');
            $this->info('1. Go to your RevenueCat dashboard');
            $this->info('2. Navigate to Project Settings');
            $this->info('3. Copy your Project ID (starts with "proj_")');
            $this->info('4. Add REVENUECAT_PROJECT_ID=your_project_id to your .env file');
            $this->newLine();
            $this->info('Example: REVENUECAT_PROJECT_ID=proj_abc123def456');
            return 1;
        }
        
        // Test the API
        $result = $revenueCatService->testSubscriberStatus($userId);
        
        // Display results
        if ($result['success']) {
            $this->info('✅ API Test Successful!');
            $this->table(
                ['Property', 'Value'],
                [
                    ['User ID', $result['app_user_id']],
                    ['Response Time', $result['response_time_ms'] . ' ms'],
                    ['API URL', $result['api_url']],
                    ['Has API Key', $result['has_api_key'] ? 'Yes' : 'No'],
                    ['Has Active Subscription', $result['subscriber_data']['has_active_subscription'] ? 'Yes' : 'No'],
                    ['Platform', $result['subscriber_data']['platform'] ?? 'N/A'],
                    ['Expires At', $result['subscriber_data']['expires_at'] ?? 'N/A'],
                    ['Product ID', $result['subscriber_data']['product_id'] ?? 'N/A'],
                    ['Is Trial', $result['subscriber_data']['is_trial'] ? 'Yes' : 'No'],
                ]
            );
            
            if (!empty($result['raw_entitlements'])) {
                $this->newLine();
                $this->info('Raw Entitlements:');
                $this->line(json_encode($result['raw_entitlements'], JSON_PRETTY_PRINT));
            }
            
            if (!empty($result['raw_subscriptions'])) {
                $this->newLine();
                $this->info('Raw Subscriptions:');
                $this->line(json_encode($result['raw_subscriptions'], JSON_PRETTY_PRINT));
            }
        } else {
            $this->error('❌ API Test Failed!');
            $this->table(
                ['Property', 'Value'],
                [
                    ['User ID', $result['app_user_id']],
                    ['Response Time', $result['response_time_ms'] . ' ms'],
                    ['API URL', $result['api_url']],
                    ['Has API Key', $result['has_api_key'] ? 'Yes' : 'No'],
                    ['Error Message', $result['message']],
                ]
            );
            
            if (isset($result['exception'])) {
                $this->newLine();
                $this->error('Exception Details:');
                $this->line($result['exception']);
            }
        }
        
        $this->newLine();
        $this->info('Test completed.');
        
        return $result['success'] ? 0 : 1;
    }
}