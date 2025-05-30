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
use Illuminate\Http\UploadedFile;

class ProcessPdfNote implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $noteId;
    protected $validatedData;
    protected $filePath;
    protected $extension;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

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

            // Upload file to R2 storage using media collections
            $mediaCollection = 'note-docs'; // Use the note-docs collection for PDF/Doc files
            $media = $note->addMediaFromDisk($this->filePath, 'public')
                ->toMediaCollection($mediaCollection);

            Log::error(print_r($studyNote, true));

            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['study_note']['content'],
                'title' => $studyNote['study_note']['title'],
                'summary' => $studyNote['study_note']['summary'],
                'status' => 'processed'
            ]);

            $note->update($noteData);
            
            // Clean up the temporary file from public storage after uploading to R2
            Storage::disk('public')->delete($this->filePath);

        } catch (\Exception $e) {
            Log::error("Failed to process PDF/Doc note: " . $e->getMessage());
            $note->update([
                'status' => 'failed',
            ]);
            
            // Clean up the temporary file on failure as well
            if (Storage::disk('public')->exists($this->filePath)) {
                Storage::disk('public')->delete($this->filePath);
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("PDF/Doc note processing job failed: " . $exception->getMessage());
        
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                $note->update(['status' => 'failed']);
            }
            
            // Clean up the temporary file
            if (Storage::disk('public')->exists($this->filePath)) {
                Storage::disk('public')->delete($this->filePath);
            }
        } catch (\Exception $e) {
            Log::error("Failed to update note status on job failure: " . $e->getMessage());
        }
    }
}