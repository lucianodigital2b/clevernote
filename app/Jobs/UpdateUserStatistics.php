<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use App\Services\StatisticsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class UpdateUserStatistics implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $date;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 60;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(int $userId, Carbon $date = null)
    {
        $this->userId = $userId;
        $this->date = $date ?? Carbon::today();
    }

    /**
     * Execute the job.
     */
    public function handle(StatisticsService $statisticsService): void
    {
        try {
            $user = User::find($this->userId);
            
            if (!$user) {
                Log::warning('User not found for statistics update', ['user_id' => $this->userId]);
                return;
            }

            $statisticsService->updateDailyStats($user, $this->date);
            
            Log::info('User statistics updated successfully', [
                'user_id' => $this->userId,
                'date' => $this->date->toDateString()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update user statistics', [
                'user_id' => $this->userId,
                'date' => $this->date->toDateString(),
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('UpdateUserStatistics job failed permanently', [
            'user_id' => $this->userId,
            'date' => $this->date->toDateString(),
            'error' => $exception->getMessage()
        ]);
    }
}