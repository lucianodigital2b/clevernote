<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Services\NoteService;
use App\Services\TranscriptionService;
use App\Services\DeepSeekService;
use App\Services\YouTubeAudioExtractor;
use Illuminate\Support\Facades\Log;

class ProcessLinkNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $validatedData;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 900; // Increase to 15 minutes to accommodate longer videos

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(int $noteId, array $validatedData)
    {
        $this->noteId = $noteId;
        $this->validatedData = $validatedData;
    }

    /**
     * Execute the job.
     */
    public function handle(NoteService $noteService, TranscriptionService $transcriptionService, DeepSeekService $deepseekService, YouTubeAudioExtractor $youtubeAudioExtractor): void
    {
        $note = Note::findOrFail($this->noteId);
        $audioPath = null;
        
        try {
            $language = $this->validatedData['language'];
            $link = $this->validatedData['link'];

            $audio = $youtubeAudioExtractor->extractAudio($link);
            if(!$audio) {
                $detailedError = $youtubeAudioExtractor->getLastError() ?: 'Failed to extract audio from YouTube video. The video may be restricted, unavailable for download, or only contains images/storyboards. Please try a different video or check if the video is publicly accessible.';
                throw new \Exception($detailedError);
            }

            $audioPath = $audio->getPathname();

            $transcription = $transcriptionService->transcribeAudio($audioPath, $language);

            $studyNote = $deepseekService->createStudyNote($transcription['text'], $language);

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'status' => 'processed',
                'transcription' => $transcription['text']
            ]);

            $note->update($noteData);

        } catch (\Exception $e) {
            report($e);

            Log::error("Failed to process link note: " . $e->getMessage());
            $note->update([
                'status' => 'failed', 
                'title' => 'Note creation failed',
                'failure_reason' => $e->getMessage()
            ]);
        } finally {
            // Clean up the main audio file
            // $this->cleanupAudioFile($audioPath);
        }
    }

    /**
     * Clean up audio file
     */
    protected function cleanupAudioFile(?string $audioPath): void
    {
        if ($audioPath && file_exists($audioPath)) {
            try {
                unlink($audioPath);
            } catch (\Exception $e) {
                Log::warning("Failed to cleanup audio file: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Link note processing job failed: " . $exception->getMessage());
        
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                $note->update([
                    'status' => 'failed', 
                    'failure_reason' => $exception->getMessage()
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update note status on job failure: " . $e->getMessage());
        }
        
        // Clean up any remaining temporary files
        $this->cleanupTempDirectory();
    }

    /**
     * Clean up temporary directory
     */
    protected function cleanupTempDirectory(): void
    {
        try {
            $tempDir = storage_path('app/tmp');
            if (is_dir($tempDir)) {
                $files = glob($tempDir . '/*');
                foreach ($files as $file) {
                    if (is_file($file) && (time() - filemtime($file)) > 3600) { // Clean files older than 1 hour
                        unlink($file);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to cleanup temp directory: " . $e->getMessage());
        }
    }
}