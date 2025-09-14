<?php

namespace App\Services;

use App\Models\Mindmap;
use App\Models\Note;
use App\Services\Prompts\AIPrompts;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;

class DeepSeekService extends AbstractAIService
{
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY = 2; // seconds
    private const MIN_CONTENT_LENGTH = 10;
    private const MAX_CONTENT_LENGTH = 500000; // ~125k tokens

    protected function initialize()
    {
        $this->apiKey = config('services.openai.api_key');
        $this->apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        $this->model = 'gpt-4o';
    }

    protected function getSystemPrompt(): string
    {
        return 'You are an expert educational content creator and study assistant. Your role is to transform raw content into comprehensive, detailed study materials that help students deeply understand complex topics. Always respond in valid JSON format with rich, educational content that demonstrates mastery-level understanding of the subject matter.';
    }

    public function createStudyNote(string $transcription, ?string $language = null): array
    {
        try {
            // Input validation
            $this->validateInput($transcription, 'transcription');
            
            $language = $language ?? $this->defaultLanguage;
            
            // Sanitize and prepare content
            $cleanedTranscription = $this->sanitizeContent($transcription);
            
            // Generate cache key for potential caching
            $cacheKey = $this->generateCacheKey('study_note', $cleanedTranscription, $language);
            
            // Check cache first (optional optimization)
            if (config('app.cache_ai_responses', false)) {
                $cached = Cache::get($cacheKey);
                if ($cached) {
                    Log::info('Returning cached study note result');
                    return $cached;
                }
            }
            
            $prompt = AIPrompts::studyNotePrompt($cleanedTranscription, $language);
            
            // Send request with retry logic
            $studyNote = $this->sendRequestWithRetry($prompt);
            
            // Validate response structure
            $this->validateStudyNoteResponse($studyNote);
            
            $result = [
                'original_transcription' => $transcription,
                'study_note' => $studyNote,
            ];
            
            // Cache the result if caching is enabled
            if (config('app.cache_ai_responses', false)) {
                Cache::put($cacheKey, $result, now()->addHours(24));
            }
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('Failed to create study note', [
                'error' => $e->getMessage(),
                'transcription_length' => strlen($transcription),
                'language' => $language,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new \Exception($this->getErrorMessage($e, 'study note creation'));
        }
    }

    /**
     * Validate input content
     */
    private function validateInput(string $content, string $fieldName): void
    {
        if (empty(trim($content))) {
            throw new \Exception("The {$fieldName} cannot be empty");
        }
        
        if (strlen($content) < self::MIN_CONTENT_LENGTH) {
            throw new \Exception("The {$fieldName} is too short (minimum " . self::MIN_CONTENT_LENGTH . " characters)");
        }
        
        if (strlen($content) > self::MAX_CONTENT_LENGTH) {
            throw new \Exception("The {$fieldName} is too long (maximum " . self::MAX_CONTENT_LENGTH . " characters)");
        }
    }

    /**
     * Sanitize content for processing
     */
    private function sanitizeContent(string $content): string
    {
        // Remove excessive whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Remove potentially harmful content
        $content = strip_tags($content, '<p><br><strong><em><ul><ol><li><h1><h2><h3><h4><h5><h6>');
        
        // Trim and normalize
        return trim($content);
    }

    /**
     * Generate cache key for AI responses
     */
    private function generateCacheKey(string $operation, string $content, string $language): string
    {
        return 'ai_' . $operation . '_' . md5($content . $language);
    }

    /**
     * Send request with retry logic
     */
    private function sendRequestWithRetry(string $prompt, int $attempt = 1): array
    {
        try {
            return $this->sendRequest($prompt);
            
        } catch (\Exception $e) {
            if ($attempt >= self::MAX_RETRIES) {
                throw $e;
            }
            
            // Check if this is a retryable error
            if ($this->isRetryableError($e)) {
                Log::warning("AI request failed (attempt {$attempt}), retrying...", [
                    'error' => $e->getMessage(),
                    'attempt' => $attempt
                ]);
                
                sleep(self::RETRY_DELAY * $attempt); // Exponential backoff
                return $this->sendRequestWithRetry($prompt, $attempt + 1);
            }
            
            throw $e;
        }
    }

    /**
     * Check if error is retryable
     */
    private function isRetryableError(\Exception $e): bool
    {
        $retryableErrors = [
            'timeout',
            'rate limit',
            'server error',
            'service unavailable',
            'internal server error',
            'bad gateway',
            'gateway timeout'
        ];
        
        $errorMessage = strtolower($e->getMessage());
        
        foreach ($retryableErrors as $retryableError) {
            if (strpos($errorMessage, $retryableError) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Validate study note response structure
     */
    private function validateStudyNoteResponse(array $response): void
    {
        if (!isset($response['title']) || !isset($response['content'])) {
            throw new \Exception('Invalid study note response structure');
        }
        
        if (empty(trim($response['title'])) || empty(trim($response['content']))) {
            throw new \Exception('Study note response contains empty required fields');
        }
    }

    /**
     * Validate flashcard response structure
     */
    private function validateFlashcardResponse(array $response): void
    {
        if (!is_array($response) || empty($response)) {
            throw new \Exception('Invalid flashcard response structure');
        }
        
        // Check if it's an array of flashcards or has a flashcards key
        $flashcards = isset($response['flashcards']) ? $response['flashcards'] : $response;
        
        if (!is_array($flashcards) || empty($flashcards)) {
            throw new \Exception('No flashcards found in response');
        }
        
        // Validate first flashcard structure
        $firstCard = reset($flashcards);
        if (!isset($firstCard['question']) || !isset($firstCard['answer'])) {
            throw new \Exception('Invalid flashcard structure');
        }
    }

    /**
     * Validate mindmap response structure
     */
    private function validateMindmapResponse(array $response): void
    {
        if (!isset($response['nodes']) || !isset($response['edges'])) {
            throw new \Exception('Invalid mindmap response structure');
        }
        
        if (!is_array($response['nodes']) || empty($response['nodes'])) {
            throw new \Exception('Mindmap response contains no nodes');
        }
    }

    /**
     * Validate study plan response structure
     */
    private function validateStudyPlanResponse(array $response): void
    {
        if (!is_array($response) || empty($response)) {
            throw new \Exception('Invalid study plan response structure');
        }
        
        // Check for common study plan fields
        $requiredFields = ['plan', 'schedule', 'goals', 'timeline'];
        $hasRequiredField = false;
        
        foreach ($requiredFields as $field) {
            if (isset($response[$field])) {
                $hasRequiredField = true;
                break;
            }
        }
        
        if (!$hasRequiredField) {
            throw new \Exception('Study plan response missing required fields');
        }
    }

    /**
     * Get user-friendly error message
     */
    private function getErrorMessage(\Exception $e, string $operation): string
    {
        $message = $e->getMessage();
        
        // Rate limiting errors
        if (strpos($message, 'rate limit') !== false) {
            return "The AI service is currently busy. Please try again in a few minutes.";
        }
        
        // Timeout errors
        if (strpos($message, 'timeout') !== false) {
            return "The request took too long to process. Please try again with shorter content.";
        }
        
        // Content too long errors
        if (strpos($message, 'too long') !== false) {
            return "The content is too long to process. Please try with shorter content.";
        }
        
        // Content too short errors
        if (strpos($message, 'too short') !== false) {
            return "The content is too short to generate meaningful study materials.";
        }
        
        // API key errors
        if (strpos($message, 'api key') !== false || strpos($message, 'unauthorized') !== false) {
            return "AI service is not properly configured. Please contact support.";
        }
        
        // Invalid response structure
        if (strpos($message, 'Invalid') !== false && strpos($message, 'response') !== false) {
            return "The AI service returned an unexpected response. Please try again.";
        }
        
        // Generic error for specific operations
        $operationMessages = [
            'study note creation' => 'Failed to create study notes from the provided content.',
            'flashcard generation' => 'Failed to generate flashcards from the content.',
            'mindmap creation' => 'Failed to create a mindmap from the note.',
            'study plan generation' => 'Failed to generate a study plan.',
            'content generation' => 'Failed to generate the requested content.'
        ];
        
        return $operationMessages[$operation] ?? "An error occurred during {$operation}. Please try again.";
     }
 }
