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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessAudioNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $validatedData;
    protected $filePath;

    /**
     * Create a new job instance.
     */
    public function __construct(int $noteId, array $validatedData, string $filePath)
    {
        $this->noteId = $noteId;
        $this->validatedData = $validatedData;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(NoteService $noteService, TranscriptionService $transcriptionService, DeepSeekService $deepseekService): void
    {
        $note = Note::findOrFail($this->noteId);
        $fullPath = Storage::disk('public')->path($this->filePath);

        try {
            $language = $this->validatedData['language'];

            // Process audio file and get transcription
            $transcription = $transcriptionService->transcribeAudio($fullPath, $language);
            $studyNote = $deepseekService->createStudyNote($transcription['text'], $language);

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'file_path' => $fullPath,
                'status' => 'processed'

            ]);

            $note->update($noteData);

            // Add the processed audio file to the note's media collection on R2
            $note->addMedia($fullPath)
                 ->toMediaCollection('note-audio', 'r2');

            // Clean up the temporary file after processing
            Storage::disk('public')->delete($fullPath);

        } catch (\Exception $e) {
            Log::error("Failed to process audio note: " . $e->getMessage());

            // Clean up the temporary file in case of an error
            Storage::disk('public')->delete($fullPath);

            $note->update([
                'status' => 'failed',
            ]);
        }
    }
}