<?php

namespace App\Jobs;

use App\Models\Crossword;
use App\Services\DeepSeekService;
use App\Services\Prompts\AIPrompts;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateCrosswordFromNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $crossword;
    protected $language;

    /**
     * Create a new job instance.
     */
    public function __construct(Crossword $crossword, string $language = 'autodetect')
    {
        $this->crossword = $crossword;
        $this->language = $language;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting crossword generation', ['crossword_id' => $this->crossword->id]);
            
            // Update status to generating
            $this->crossword->update(['status' => 'generating']);

            // Get the note content
            $note = $this->crossword->note;
            if (!$note || !$note->content) {
                throw new \Exception('Note content is empty or note not found');
            }

            // Strip HTML tags from content for AI processing
            $content = strip_tags($note->content);
            
            if (strlen($content) < 100) {
                throw new \Exception('Note content is too short to generate a meaningful crossword');
            }

            // Generate crossword using AI
            $aiService = new DeepSeekService();
            $prompt = AIPrompts::crosswordPrompt($content, $this->language);
            
            Log::info('Sending crossword generation request to AI', ['crossword_id' => $this->crossword->id]);
            
            $response = $aiService->generateContent($prompt);
            
            if (!$response) {
                throw new \Exception('AI service returned empty response');
            }

            // Parse the JSON response
            $puzzleData = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error', [
                    'error' => json_last_error_msg(),
                    'response' => $response,
                    'crossword_id' => $this->crossword->id
                ]);
                throw new \Exception('Invalid JSON response from AI service: ' . json_last_error_msg());
            }

            // Validate the puzzle data structure
            if (!isset($puzzleData['title']) || !isset($puzzleData['across']) || !isset($puzzleData['down'])) {
                throw new \Exception('Invalid crossword data structure');
            }

            // Update crossword with generated data
            $this->crossword->update([
                'title' => $puzzleData['title'],
                'puzzle_data' => $puzzleData,
                'status' => 'completed'
            ]);

            Log::info('Crossword generation completed successfully', ['crossword_id' => $this->crossword->id]);

        } catch (\Exception $e) {
            Log::error('Crossword generation failed', [
                'crossword_id' => $this->crossword->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->crossword->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Crossword generation job failed', [
            'crossword_id' => $this->crossword->id,
            'error' => $exception->getMessage()
        ]);

        $this->crossword->update([
            'status' => 'failed',
            'failure_reason' => $exception->getMessage()
        ]);
    }
}