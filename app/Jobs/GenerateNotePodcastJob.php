<?php

namespace App\Jobs;

use App\Models\Note;
use App\Services\NoteToPodcastGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateNotePodcastJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $noteId;
    protected array $options;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600; // 10 minutes

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 30;

    /**
     * Create a new job instance.
     *
     * @param int $noteId The ID of the note to convert
     * @param array $options TTS options and preferences
     */
    public function __construct(int $noteId, array $options = [])
    {
        $this->noteId = $noteId;
        $this->options = $options;
    }

    /**
     * Execute the job.
     */
    public function handle(NoteToPodcastGenerator $podcastGenerator): void
    {
        Log::info('Starting podcast generation job', [
            'note_id' => $this->noteId,
            'options' => $this->options,
            'attempt' => $this->attempts()
        ]);

        try {
            $note = Note::findOrFail($this->noteId);

            // Update note status to processing
            $note->update([
                'podcast_status' => 'processing',
                'podcast_failure_reason' => null
            ]);

            // Generate the podcast
            $result = $podcastGenerator->generatePodcast($note, $this->options);

            Log::info('Podcast generation job completed successfully', [
                'note_id' => $this->noteId,
                'file_path' => $result['podcast_data']['file_path'],
                'duration' => $result['podcast_data']['duration']
            ]);

            // Dispatch any follow-up jobs if needed
            $this->dispatchFollowUpJobs($note, $result);

        } catch (\Exception $e) {
            Log::error('Podcast generation job failed', [
                'note_id' => $this->noteId,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Update note status on failure
            $this->updateNoteOnFailure($e->getMessage());

            // Re-throw the exception to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Podcast generation job permanently failed', [
            'note_id' => $this->noteId,
            'attempts' => $this->attempts(),
            'error' => $exception->getMessage()
        ]);

        $this->updateNoteOnFailure($exception->getMessage());

        // Optionally notify the user about the failure
        $this->notifyUserOfFailure($exception);
    }

    /**
     * Update note status when job fails
     */
    protected function updateNoteOnFailure(string $errorMessage): void
    {
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                $note->update([
                    'podcast_status' => 'failed',
                    'podcast_failure_reason' => $errorMessage
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update note status on job failure', [
                'note_id' => $this->noteId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Dispatch any follow-up jobs after successful podcast generation
     */
    protected function dispatchFollowUpJobs(Note $note, array $result): void
    {
        // Example: Update user statistics
        if (class_exists(\App\Jobs\UpdateUserStatistics::class)) {
            \App\Jobs\UpdateUserStatistics::dispatch($note->user_id);
        }

        // Example: Send notification to user
        if ($this->options['notify_user'] ?? true) {
            $this->notifyUserOfSuccess($note, $result);
        }
    }

    /**
     * Notify user of successful podcast generation
     */
    protected function notifyUserOfSuccess(Note $note, array $result): void
    {
        try {
            // You can implement user notification here
            // For example, using Laravel's notification system
            Log::info('Podcast generation completed for user', [
                'user_id' => $note->user_id,
                'note_id' => $note->id,
                'note_title' => $note->title,
                'duration' => $result['podcast_data']['duration']
            ]);

            // Example notification implementation:
            // $note->user->notify(new PodcastGeneratedNotification($note, $result));
        } catch (\Exception $e) {
            Log::warning('Failed to notify user of podcast generation success', [
                'note_id' => $this->noteId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notify user of podcast generation failure
     */
    protected function notifyUserOfFailure(\Throwable $exception): void
    {
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                Log::info('Podcast generation failed for user', [
                    'user_id' => $note->user_id,
                    'note_id' => $note->id,
                    'note_title' => $note->title,
                    'error' => $exception->getMessage()
                ]);

                // Example notification implementation:
                // $note->user->notify(new PodcastGenerationFailedNotification($note, $exception));
            }
        } catch (\Exception $e) {
            Log::warning('Failed to notify user of podcast generation failure', [
                'note_id' => $this->noteId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Calculate the number of seconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [30, 60, 120]; // Wait 30s, then 60s, then 120s between retries
    }

    /**
     * Determine if the job should be retried based on the exception.
     */
    public function retryUntil(): \DateTime
    {
        return now()->addMinutes(30); // Stop retrying after 30 minutes
    }

    /**
     * Get the tags that should be assigned to the job.
     */
    public function tags(): array
    {
        return [
            'podcast-generation',
            'note:' . $this->noteId,
            'tts'
        ];
    }
}