<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Services\NoteService;
use App\Services\DeepSeekService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessPdfNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $validatedData;
    protected $filePath;
    protected $extension;

    /**
     * Create a new job instance.
     */
    public function __construct(int $noteId, array $validatedData, string $filePath, string $extension)
    {
        $this->noteId = $noteId;
        $this->validatedData = $validatedData;
        $this->filePath = $filePath;
        $this->extension = $extension;
    }

    /**
     * Execute the job.
     */
    public function handle(NoteService $noteService, DeepSeekService $deepseekService): void
    {
        $note = Note::findOrFail($this->noteId);

        try {
            $text = '';
            $fullPath = Storage::disk('public')->path($this->filePath);

            if ($this->extension === 'pdf') {
                $text = $noteService->extractTextFromPdf($this->filePath);
            } else {
                $phpWord = \PhpOffice\PhpWord\IOFactory::load($fullPath);
                foreach ($phpWord->getSections() as $section) {
                    foreach ($section->getElements() as $element) {
                        if (method_exists($element, 'getText')) {
                            $text .= $element->getText() . "\n";
                        }
                    }
                }
            }

            $language = $this->validatedData['language'] ?? null;
            $studyNote = $deepseekService->createStudyNote($text, $language);

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'file_path' => $this->filePath,
                'status' => 'processed'
            ]);

            $note->update($noteData);
            // Clean up the temporary file after processing
            Storage::disk('public')->delete($this->filePath);

        } catch (\Exception $e) {
            Log::error("Failed to process PDF/Doc note: " . $e->getMessage());
            $note->update([
                'status' => 'failed',
            ]);

        }
    }
}