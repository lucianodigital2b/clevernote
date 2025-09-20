<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Note;
use App\Services\NoteService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Prism\Prism\Prism;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Prism\Prism\ValueObjects\Messages\SystemMessage;
use Prism\Prism\Enums\Provider;
use Prism\Prism\ValueObjects\Media\Document;
use Prism\Prism\ValueObjects\Usage;
use App\Services\Prompts\AIPrompts;
use Throwable;

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
    public function handle(NoteService $noteService): void
    {
        $note = Note::findOrFail($this->noteId);

        try {
            // Update note status to processing
            $note->update(['status' => 'processing']);

            $fullPath = Storage::disk('public')->path($this->filePath);
            
            // Process document based on file type
            if ($this->extension === 'pdf') {
                $this->processPdfWithOpenAI($note, $fullPath);
            } else {
                // For non-PDF files, extract text first then process
                $text = $this->extractTextFromFile($noteService, $fullPath);
                $this->processTextWithPrism($note, $text);
            }

            // Upload file to R2 storage using media collections
            $mediaCollection = 'note-docs';
            $media = $note->addMediaFromDisk($this->filePath, 'public')
                ->toMediaCollection($mediaCollection);

            // Clean up the temporary file from public storage after uploading to R2
            Storage::disk('public')->delete($this->filePath);

        } catch (Throwable $e) {
            $this->handleProcessingError($note, $e);
        }
    }

    /**
     * Process PDF file directly with OpenAI using file upload
     */
    private function processPdfWithOpenAI(Note $note, string $fullPath): void
    {
        try {
            // Upload PDF file directly to OpenAI and process it
            $response = $this->processPdfWithOpenAIFileUpload($fullPath);
            

            // Log::error(print_r($response->text, true));
            // Parse the response to extract structured data
            $studyNote = $this->parseStudyNoteResponse($response->text);
            
            // Update note with processed content
            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['content'],
                'title' => $studyNote['title'],
                'summary' => $studyNote['summary'],
                'status' => 'processed'
            ]);

            $note->update($noteData);
            
            // Log successful processing
            Log::info("Successfully processed PDF note with OpenAI", [
                'note_id' => $this->noteId,
                'file_path' => $fullPath,
                'usage' => $response->usage ? [
                    'prompt_tokens' => $response->usage->promptTokens,
                    'completion_tokens' => $response->usage->completionTokens,
                    'total_tokens' => $response->usage->totalTokens ?? ($response->usage->promptTokens + $response->usage->completionTokens)
                ] : null
            ]);

        } catch (Throwable $e) {
            Log::error("Failed to process PDF with OpenAI", [
                'note_id' => $this->noteId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Process PDF file by uploading directly to OpenAI
     */
    private function processPdfWithOpenAIFileUpload(string $fullPath): object
    {
        // Validate file exists
        if (!file_exists($fullPath)) {
            throw new \Exception("PDF file not found at path: {$fullPath}");
        }

        $apiKey = config('services.openai.api_key');
        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured');
        }

        try {
            // First, upload the file to OpenAI
            $fileUploadResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->timeout(3000)->attach('file', file_get_contents($fullPath), basename($fullPath))
              ->attach('purpose', 'user_data')
              ->post('https://api.openai.com/v1/files');

            if (!$fileUploadResponse->successful()) {
                $error = $fileUploadResponse->json()['error']['message'] ?? 'Unknown file upload error';
                throw new \Exception("OpenAI file upload error: {$error}");
            }

            $fileData = $fileUploadResponse->json();
            $fileId = $fileData['id'];

            // Create the prompt for study note generation using AIPrompts service
            $language = $this->validatedData['language'] ?? 'English';
            $prompt = AIPrompts::studyNotePrompt('', $language);

            // Now use the file in a chat completion
            $chatResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(120)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o',
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'file',
                                'file' => [
                                    'file_id' => $fileId,
                                ]
                            ],
                            [
                                'type' => 'text',
                                'text' => $prompt,
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 4000,
                'temperature' => 0.7
            ]);

            if (!$chatResponse->successful()) {
                $error = $chatResponse->json()['error']['message'] ?? 'Unknown chat completion error';
                throw new \Exception("OpenAI chat completion error: {$error}");
            }

            $result = $chatResponse->json();
            $content = $result['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                throw new \Exception('No content received from OpenAI');
            }

            // Clean up the uploaded file from OpenAI (optional)
            Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
            ])->delete("https://api.openai.com/v1/files/{$fileId}");

            // Return a response object similar to Prism's format
            return (object) [
                'text' => $content,
                'usage' => (object) [
                    'promptTokens' => $result['usage']['prompt_tokens'] ?? 0,
                    'completionTokens' => $result['usage']['completion_tokens'] ?? 0,
                    'totalTokens' => $result['usage']['total_tokens'] ?? 0
                ]
            ];

        } catch (\Exception $e) {
            Log::error("OpenAI file upload processing error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Extract text from non-PDF files
     */
    private function extractTextFromFile(NoteService $noteService, string $fullPath): string
    {
        return match ($this->extension) {
            'txt' => $noteService->extractTextFromTextFile($this->filePath),
            'ppt', 'pptx' => $noteService->extractTextFromPowerPoint($fullPath),
            default => $noteService->extractTextFromWord($fullPath), // DOC and DOCX files
        };
    }

    /**
     * Process extracted text with Prism
     */
    private function processTextWithPrism(Note $note, string $text): void
    {
        try {
            $textLength = strlen($text);
            Log::info("Processing note with text length: {$textLength} characters", [
                'note_id' => $this->noteId
            ]);

            // Create system prompt using AIPrompts service
            $systemPrompt = AIPrompts::studyNotePrompt($text, $this->validatedData['language'] ?? 'English');
            
            // Create Prism instance with OpenAI provider
            $response = Prism::text()
                ->using(Provider::OpenAI, 'gpt-4o-mini') // Use GPT-4o-mini for text processing
                ->withSystemPrompt($systemPrompt)
                ->withPrompt("Please analyze this content and create comprehensive study notes.")
                ->asText();
            
            // Parse the response to extract structured data
            $studyNote = $this->parseStudyNoteResponse($response->text);
            
            // Update note with processed content
            $noteData = array_merge($this->validatedData, [
                'content' => $studyNote['content'],
                'title' => $studyNote['title'],
                'summary' => $studyNote['summary'],
                'status' => 'processed'
            ]);

            $note->update($noteData);
            
            // Log successful processing
            Log::info("Successfully processed text note with Prism", [
                'note_id' => $this->noteId,
                'text_length' => $textLength,
                'usage' => $response->usage ? [
                    'prompt_tokens' => $response->usage->promptTokens,
                    'completion_tokens' => $response->usage->completionTokens,
                    'total_tokens' => $response->usage->totalTokens ?? ($response->usage->promptTokens + $response->usage->completionTokens)
                ] : null
            ]);

        } catch (Throwable $e) {
            Log::error("Failed to process text with Prism", [
                'note_id' => $this->noteId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     /**
     * Parse study note response from AI
     */
    private function parseStudyNoteResponse(string $response): array
    {
        try {
            // Try to extract JSON from the response
            $jsonStart = strpos($response, '{');
            $jsonEnd = strrpos($response, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonString = substr($response, $jsonStart, $jsonEnd - $jsonStart + 1);
                $decoded = json_decode($jsonString, true);
                
                if (json_last_error() === JSON_ERROR_NONE && isset($decoded['title'], $decoded['summary'], $decoded['content'])) {
                    return $decoded;
                }
            }
            
            // Fallback: create structured response from plain text
            $lines = explode("\n", trim($response));
            $title = !empty($lines[0]) ? trim($lines[0], "# \t") : 'Study Notes';
            
            return [
                'title' => $title,
                'summary' => 'AI-generated study notes from uploaded document',
                'content' => $response
            ];
            
        } catch (Throwable $e) {
            Log::warning("Failed to parse study note response, using fallback", [
                'error' => $e->getMessage(),
                'response_preview' => substr($response, 0, 200)
            ]);
            
            return [
                'title' => 'Study Notes',
                'summary' => 'AI-generated study notes from uploaded document',
                'content' => $response
            ];
        }
    }

    /**
     * Handle processing errors with user-friendly messages
     */
    private function handleProcessingError(Note $note, Throwable $e): void
    {
        Log::error("Failed to process document note", [
            'note_id' => $this->noteId,
            'file_path' => $this->filePath,
            'extension' => $this->extension,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Provide user-friendly error messages
        $userMessage = $this->getUserFriendlyErrorMessage($e);
        
        $note->update([
            'status' => 'failed',
            'failure_reeason' => $userMessage
        ]);
        
        // Clean up the temporary file on failure
        if (Storage::disk('public')->exists($this->filePath)) {
            Storage::disk('public')->delete($this->filePath);
        }
        
        // Re-throw for job failure handling
        throw $e;
    }

    /**
     * Get user-friendly error message based on exception
     */
    private function getUserFriendlyErrorMessage(Throwable $e): string
    {
        $message = $e->getMessage();
        
        return match (true) {
            str_contains($message, 'PDF file not found') => 
                'The PDF file could not be found. It may have been moved or deleted.',
            str_contains($message, 'Unable to determine PDF file size') => 
                'The PDF file appears to be corrupted or inaccessible.',
            str_contains($message, 'PDF file is too large') => 
                'The PDF file is too large to process. Please try with a file smaller than 32MB.',
            str_contains($message, 'PDF file is too complex') => 
                'The PDF file is too complex to process. Please try with a simpler PDF file or convert it to a different format.',
            str_contains($message, 'regular expression is too large') => 
                'The document is too large or complex to process. Please try with a smaller file.',
            str_contains($message, 'Memory usage too high') => 
                'The document was partially processed but stopped due to memory constraints. Consider splitting the document into smaller files.',
            str_contains($message, 'Processing stopped due to memory constraints') => 
                'The document was partially processed. Some pages may have been skipped due to size limitations.',
            str_contains($message, 'Failed to process content chunk') => 
                'The document was too large and could not be fully processed. Please try splitting it into smaller files.',
            str_contains($message, 'Content exceeds token limit') => 
                'The document is very large and exceeded processing limits. Please try with a smaller document.',
            str_contains($message, 'Missing catalog') => 
                'The PDF file appears to be corrupted or damaged. Please try uploading a different PDF file.',
            str_contains($message, 'Failed to read PDF file') => 
                'Unable to read the PDF file. Please ensure the file is not corrupted and try again.',
            str_contains($message, 'rate_limit_exceeded') => 
                'Processing is temporarily unavailable due to high demand. Please try again in a few minutes.',
            str_contains($message, 'insufficient_quota') => 
                'Processing quota has been exceeded. Please try again later.',
            default => 'An error occurred while processing your document. Please try again or contact support if the problem persists.'
        };
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
                if (strpos($exception->getMessage(), 'PDF file not found') !== false) {
                    $userMessage = 'The PDF file could not be found. It may have been moved or deleted.';
                } elseif (strpos($exception->getMessage(), 'Unable to determine PDF file size') !== false) {
                    $userMessage = 'The PDF file appears to be corrupted or inaccessible.';
                } elseif (strpos($exception->getMessage(), 'PDF file is too large') !== false) {
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