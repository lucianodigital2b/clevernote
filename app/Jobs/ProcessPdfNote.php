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
    public $timeout = 900; // 15 minutes (increased for chunked processing)

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
            } elseif ($this->extension === 'txt') {
                $text = $noteService->extractTextFromTextFile($this->filePath);
            } elseif (in_array($this->extension, ['ppt', 'pptx'])) {
                $text = $noteService->extractTextFromPowerPoint($fullPath);
            } else {
                // Handle DOC and DOCX files
                $text = $noteService->extractTextFromWord($fullPath);
            }

            $language = $this->validatedData['language'] ?? null;
            
            // Log the text length for monitoring
            $textLength = strlen($text);
            Log::info("Processing note with text length: {$textLength} characters");
            
            $studyNote = $deepseekService->createStudyNote($text, $language);

            // Upload file to R2 storage using media collections
            $mediaCollection = 'note-docs'; // Use the note-docs collection for PDF/Doc files
            $media = $note->addMediaFromDisk($this->filePath, 'public')
                ->toMediaCollection($mediaCollection);


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
            Log::error("Stack trace: " . $e->getTraceAsString());
            
            // Provide user-friendly error messages
            $userMessage = $e->getMessage();
            if (strpos($e->getMessage(), 'PDF file is too large') !== false) {
                $userMessage = 'The PDF file is too large to process. Please try with a file smaller than 200MB.';
            } elseif (strpos($e->getMessage(), 'PDF file is too complex') !== false) {
                $userMessage = 'The PDF file is too complex to process. Please try with a simpler PDF file or convert it to a different format.';
            } elseif (strpos($e->getMessage(), 'regular expression is too large') !== false) {
                $userMessage = 'The document is too large or complex to process. Please try with a smaller file.';
            } elseif (strpos($e->getMessage(), 'Memory usage too high') !== false) {
                $userMessage = 'The PDF file was partially processed but stopped due to memory constraints. Consider splitting the document into smaller files.';
            } elseif (strpos($e->getMessage(), 'Processing stopped due to memory constraints') !== false) {
                $userMessage = 'The PDF file was partially processed. Some pages may have been skipped due to size limitations.';
            } elseif (strpos($e->getMessage(), 'Failed to process content chunk') !== false) {
                $userMessage = 'The document was too large and could not be fully processed. Please try splitting it into smaller files.';
            } elseif (strpos($e->getMessage(), 'Content exceeds token limit') !== false) {
                $userMessage = 'The document is very large and is being processed in sections. This may take longer than usual.';
            } elseif (strpos($e->getMessage(), 'Missing catalog') !== false) {
                $userMessage = 'The PDF file appears to be corrupted or damaged. Please try uploading a different PDF file.';
            }
            
            $note->update([
                'status' => 'failed',
                'failure_reeason' => $userMessage
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
        Log::error("Stack trace: " . $exception->getTraceAsString());
        
        try {
            $note = Note::find($this->noteId);
            if ($note) {
                // Provide user-friendly error messages
                $userMessage = $exception->getMessage();
                if (strpos($exception->getMessage(), 'PDF file is too large') !== false) {
                    $userMessage = 'The PDF file is too large to process. Please try with a file smaller than 200MB.';
                } elseif (strpos($exception->getMessage(), 'PDF file is too complex') !== false) {
                    $userMessage = 'The PDF file is too complex to process. Please try with a simpler PDF file or convert it to a different format.';
                } elseif (strpos($exception->getMessage(), 'regular expression is too large') !== false) {
                    $userMessage = 'The document is too large or complex to process. Please try with a smaller file.';
                } elseif (strpos($exception->getMessage(), 'Memory usage too high') !== false) {
                    $userMessage = 'The PDF file was partially processed but stopped due to memory constraints. Consider splitting the document into smaller files.';
                } elseif (strpos($exception->getMessage(), 'Processing stopped due to memory constraints') !== false) {
                    $userMessage = 'The PDF file was partially processed. Some pages may have been skipped due to size limitations.';
                } elseif (strpos($exception->getMessage(), 'Failed to process content chunk') !== false) {
                    $userMessage = 'The document was too large and could not be fully processed. Please try splitting it into smaller files.';
                } elseif (strpos($exception->getMessage(), 'Content exceeds token limit') !== false) {
                    $userMessage = 'The document is very large and is being processed in sections. This may take longer than usual.';
                } elseif (strpos($exception->getMessage(), 'Missing catalog') !== false) {
                    $userMessage = 'The PDF file appears to be corrupted or damaged. Please try uploading a different PDF file.';
                }
                
                $note->update([
                    'status' => 'failed',
                    'failure_reeason' => $userMessage
                ]);
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