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
        try {
            $language = $this->validatedData['language'];
            $link = $this->validatedData['link'];

            $audio = $youtubeAudioExtractor->extractAudio($link);

            $transcription = $transcriptionService->transcribeAudio($audio, $language);
            $studyNote = $deepseekService->createStudyNote($transcription['text'], $language);

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'status' => 'processed'

            ]);

            $note->update($noteData);

        } catch (\Exception $e) {
            Log::error("Failed to process link note: " . $e->getMessage());
            $note->update([
                'status' => 'failed',
            ]);
        }
    }
}