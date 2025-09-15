<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Subscription;
use App\Services\RevenueCatService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncRevenueCatSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'revenuecat:sync {--user-id= : Sync subscriptions for a specific user ID} {--dry-run : Show what would be synced without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync existing RevenueCat subscriptions to the database';

    protected RevenueCatService $revenueCatService;

    public function __construct(RevenueCatService $revenueCatService)
    {
        parent::__construct();
        $this->revenueCatService = $revenueCatService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting RevenueCat subscription sync...');
        
        $isDryRun = $this->option('dry-run');
        $specificUserId = $this->option('user-id');
        
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        $query = User::whereNotNull('revenuecat_user_id');
        
        if ($specificUserId) {
            $query->where('id', $specificUserId);
        }
        
        $users = $query->get();
        
        if ($users->isEmpty()) {
            $this->warn('No users found with RevenueCat user IDs');
            return 0;
        }

        $this->info("Found {$users->count()} users with RevenueCat IDs");
        
        $syncedCount = 0;
        $errorCount = 0;
        
        $progressBar = $this->output->createProgressBar($users->count());
        $progressBar->start();

        foreach ($users as $user) {
            try {
                $synced = $this->syncUserSubscriptions($user, $isDryRun);
                if ($synced) {
                    $syncedCount++;
                }
            } catch (\Exception $e) {
                $errorCount++;
                Log::error('Failed to sync RevenueCat subscriptions for user ' . $user->id, [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                    'revenuecat_user_id' => $user->revenuecat_user_id
                ]);
                
                if (!$isDryRun) {
                    $this->error("\nError syncing user {$user->id}: {$e->getMessage()}");
                }
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine(2);
        
        $this->info("Sync completed!");
        $this->info("Users processed: {$users->count()}");
        $this->info("Subscriptions synced: {$syncedCount}");
        
        if ($errorCount > 0) {
            $this->warn("Errors encountered: {$errorCount}");
        }
        
        if ($isDryRun) {
            $this->warn('This was a dry run - no actual changes were made');
        }
        
        return 0;
    }

    /**
     * Sync subscriptions for a specific user
     */
    private function syncUserSubscriptions(User $user, bool $isDryRun): bool
    {
        if (!$user->revenuecat_user_id) {
            return false;
        }

        // Get subscriber info from RevenueCat
        $subscriberInfo = $this->revenueCatService->getSubscriberInfo($user->revenuecat_user_id);
        
        if (!$subscriberInfo || !isset($subscriberInfo['subscriber'])) {
            return false;
        }

        $subscriber = $subscriberInfo['subscriber'];
        $entitlements = $subscriber['entitlements'] ?? [];
        $subscriptions = $subscriber['subscriptions'] ?? [];
        
        $syncedAny = false;
        
        // Process active entitlements
        foreach ($entitlements as $entitlementId => $entitlement) {
            if ($entitlement['expires_date'] && new \DateTime($entitlement['expires_date']) > now()) {
                $productId = $entitlement['product_identifier'];
                $platform = $this->mapRevenueCatStore($entitlement['store']);
                
                // Check if subscription already exists
                $existingSubscription = Subscription::where('user_id', $user->id)
                    ->where('provider', 'revenuecat')
                    ->where('revenuecat_customer_id', $user->revenuecat_user_id)
                    ->where('stripe_price', $productId) // Using stripe_price field for product_id
                    ->first();
                
                if (!$existingSubscription) {
                    if ($isDryRun) {
                        $this->line("\nWould create subscription for user {$user->id}: {$productId} ({$platform})");
                    } else {
                        // Create new subscription record
                        Subscription::create([
                            'user_id' => $user->id,
                            'name' => 'default',
                            'stripe_id' => 'rc_' . $entitlement['original_purchase_date'] . '_' . $user->id,
                            'stripe_status' => 'active',
                            'stripe_price' => $productId,
                            'quantity' => 1,
                            'trial_ends_at' => null,
                            'ends_at' => $entitlement['expires_date'] ? new \DateTime($entitlement['expires_date']) : null,
                            'created_at' => $entitlement['original_purchase_date'] ? new \DateTime($entitlement['original_purchase_date']) : now(),
                            'updated_at' => now(),
                            // RevenueCat specific fields
                            'provider' => 'revenuecat',
                            'revenuecat_customer_id' => $user->revenuecat_user_id,
                            'platform' => $platform,
                            'product_id' => $productId,
                            'original_transaction_id' => $entitlement['original_purchase_date'],
                            'is_trial' => false
                        ]);
                        
                        $this->line("\nCreated subscription for user {$user->id}: {$productId} ({$platform})");
                    }
                    
                    $syncedAny = true;
                }
            }
        }
        
        return $syncedAny;
    }

    /**
     * Map RevenueCat store to platform
     */
    private function mapRevenueCatStore(string $store): string
    {
        return match($store) {
            'app_store' => 'ios',
            'play_store' => 'android',
            'amazon' => 'amazon',
            'mac_app_store' => 'macos',
            'stripe' => 'web',
            default => $store
        };
    }
}
