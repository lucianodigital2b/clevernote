<?php

namespace App\Services;

use App\Contracts\TextToSpeechServiceInterface;
use App\Models\Note;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NoteToPodcastGenerator
{
    protected TextToSpeechServiceInterface $ttsService;

    public function __construct(TextToSpeechServiceInterface $ttsService)
    {
        $this->ttsService = $ttsService;
    }

    /**
     * Generate podcast from note content
     *
     * @param Note $note The note to convert
     * @param array $options TTS options (voice, language, etc.)
     * @return array Podcast generation result
     * @throws \Exception When generation fails
     */
    public function generatePodcast(Note $note, array $options = []): array
    {
        Log::info('Starting podcast generation', [
            'note_id' => $note->id,
            'note_title' => $note->title,
            'tts_service' => $this->ttsService->getServiceName(),
            'options' => $options
        ]);

        try {
            // Prepare the text content for TTS
            $podcastText = $this->preparePodcastText($note, $options);

            // Validate text length
            if (strlen($podcastText) > $this->ttsService->getMaxTextLength()) {
                return $this->handleLongContent($note, $podcastText, $options);
            }

            // Check content length before processing
            $contentLength = strlen($podcastText);
            $maxBilledChars = 3000; // AWS Polly limit for billed characters
            
            if ($contentLength > $maxBilledChars) {
                Log::info('Content exceeds AWS Polly limit, using chunked processing', [
                    'note_id' => $note->id,
                    'content_length' => $contentLength,
                    'max_allowed' => $maxBilledChars
                ]);
                
                return $this->handleLongContent($note, $podcastText, $options);
            }

            try {
                // Apply SSML formatting
                $ssmlContent = $this->applySSMLFormatting($podcastText, $options);
            
                // Double-check the billed character count (content without SSML tags)
                $billedChars = $this->countBilledCharacters($ssmlContent);
                if ($billedChars > $maxBilledChars) {
                    Log::warning('Billed characters exceed limit after SSML formatting', [
                        'note_id' => $note->id,
                        'billed_chars' => $billedChars,
                        'max_allowed' => $maxBilledChars
                    ]);
                    
                    return $this->handleLongContent($note, $podcastText, $options);
                }
                
                Log::info('SSML generated successfully', [
                    'note_id' => $note->id,
                    'ssml_length' => strlen($ssmlContent),
                    'billed_chars' => $billedChars,
                    'ssml_preview' => substr($ssmlContent, 0, 200) . '...',
                    'voice' => $options['voice'] ?? 'default',
                    'language' => $options['language'] ?? 'default'
                ]);
                
                $ttsResult = $this->ttsService->convertTextToSpeech($ssmlContent, $options);
                
                Log::info('TTS result received', [
                    'note_id' => $note->id,
                    'has_needs_media_processing' => isset($ttsResult['needs_media_processing']),
                    'needs_media_processing_value' => $ttsResult['needs_media_processing'] ?? 'not_set',
                    'tts_result_keys' => array_keys($ttsResult)
                ]);
                
                // Process with media library if needed
                if (isset($ttsResult['needs_media_processing']) && $ttsResult['needs_media_processing']) {
                    Log::info('Processing with media library', ['note_id' => $note->id]);
                    $ttsResult = $this->processWithMediaLibrary($note, $ttsResult);
                } else {
                    Log::info('Skipping media library processing', [
                        'note_id' => $note->id,
                        'reason' => !isset($ttsResult['needs_media_processing']) ? 'flag_not_set' : 'flag_is_false'
                    ]);
                }
        } catch (\Exception $e) {
            Log::warning('SSML formatting failed, falling back to plain text', [
                'note_id' => $note->id,
                'error' => $e->getMessage(),
                'content_length' => strlen($podcastText)
            ]);
            
            // Fallback to plain text if SSML fails
            $ttsResult = $this->ttsService->convertTextToSpeech($podcastText, $options);
            
            Log::info('TTS result received (fallback)', [
                'note_id' => $note->id,
                'has_needs_media_processing' => isset($ttsResult['needs_media_processing']),
                'needs_media_processing_value' => $ttsResult['needs_media_processing'] ?? 'not_set',
                'tts_result_keys' => array_keys($ttsResult)
            ]);
            
            // Process with media library if needed
            if (isset($ttsResult['needs_media_processing']) && $ttsResult['needs_media_processing']) {
                Log::info('Processing with media library (fallback)', ['note_id' => $note->id]);
                $ttsResult = $this->processWithMediaLibrary($note, $ttsResult);
            } else {
                Log::info('Skipping media library processing (fallback)', [
                    'note_id' => $note->id,
                    'reason' => !isset($ttsResult['needs_media_processing']) ? 'flag_not_set' : 'flag_is_false'
                ]);
            }
        }

            // Update note with podcast information
            $this->updateNoteWithPodcast($note, $ttsResult, $options);

            Log::info('Podcast generation completed successfully', [
                'note_id' => $note->id,
                'file_path' => $ttsResult['file_path'],
                'duration' => $ttsResult['duration']
            ]);

            return [
                'success' => true,
                'podcast_data' => $ttsResult,
                'note_id' => $note->id,
                'message' => 'Podcast generated successfully'
            ];

        } catch (\Exception $e) {
            Log::error('Podcast generation failed', [
                'note_id' => $note->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Update note status to failed
            $note->update([
                'podcast_status' => 'failed',
                'podcast_failure_reason' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Prepare note content for podcast generation
     */
    protected function preparePodcastText(Note $note, array $options): string
    {
        $content = $note->content ?? '';
        
        // Remove HTML tags and clean up content
        $cleanContent = $this->cleanHtmlContent($content);
        
        // Add introduction if requested
        if ($options['include_intro'] ?? true) {
            $intro = $this->generateIntroduction($note);
            $cleanContent = $intro . "\n\n" . $cleanContent;
        }

        // Add conclusion if requested
        if ($options['include_conclusion'] ?? false) {
            $conclusion = $this->generateConclusion($note);
            $cleanContent = $cleanContent . "\n\n" . $conclusion;
        }

        // Apply SSML formatting if requested
        if ($options['use_ssml'] ?? false) {
            try {
                $cleanContent = $this->applySSMLFormatting($cleanContent, $options);
                Log::info('SSML formatting applied successfully', ['note_id' => $note->id]);
            } catch (\Exception $e) {
                Log::warning('SSML formatting failed, falling back to plain text', [
                    'note_id' => $note->id,
                    'error' => $e->getMessage()
                ]);
                // Continue with plain text instead of failing completely
            }
        }

        return trim($cleanContent);
    }

    /**
     * Clean HTML content and convert to readable text
     */
    protected function cleanHtmlContent(string $content): string
    {
        // Convert common HTML elements to readable text
        $content = preg_replace('/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i', "\n\n$1\n\n", $content);
        $content = preg_replace('/<p[^>]*>(.*?)<\/p>/i', "$1\n\n", $content);
        $content = preg_replace('/<br\s*\/?>/i', "\n", $content);
        $content = preg_replace('/<li[^>]*>(.*?)<\/li>/i', "• $1\n", $content);
        $content = preg_replace('/<strong[^>]*>(.*?)<\/strong>/i', "$1", $content);
        $content = preg_replace('/<em[^>]*>(.*?)<\/em>/i', "$1", $content);
        
        // Remove all remaining HTML tags
        $content = strip_tags($content);
        
        // Clean up whitespace
        $content = preg_replace('/\n{3,}/', "\n\n", $content);
        $content = preg_replace('/[ \t]+/', ' ', $content);
        
        return trim($content);
    }

    /**
     * Generate introduction for the podcast
     */
    protected function generateIntroduction(Note $note): string
    {
        $title = $note->title ?? 'Untitled Note';
        return "Welcome to your personal podcast. Today we'll be covering: {$title}.";
    }

    /**
     * Generate conclusion for the podcast
     */
    protected function generateConclusion(Note $note): string
    {
        return "That concludes our discussion on {$note->title}. Thank you for listening to your personal podcast.";
    }

    /**
     * Apply SSML formatting for better speech synthesis
     */
    protected function applySSMLFormatting(string $content, array $options): string
    {
        $voice = $this->validateAndGetVoice($options['voice_id'] ?? 'Joanna');
        $language = $options['language_code'] ?? 'en-US';
        
        // Clean and escape content for SSML
        $content = $this->prepareContentForSSML($content);
        
        // Process content for better speech
        $content = $this->enhanceContentForSpeech($content);
        
        // Validate that content is not empty after processing
        if (empty(trim($content))) {
            throw new \Exception('Content is empty after SSML processing');
        }
        
        // Wrap content in SSML speak tags with simple structure
        // Note: Voice is specified in the API call, not in SSML for AWS Polly
        $ssml = "<speak>";
        $ssml .= "<prosody rate=\"medium\" pitch=\"medium\">";
        $ssml .= $content;
        $ssml .= "</prosody>";
        $ssml .= "</speak>";
        
        // Validate SSML structure
        $this->validateSSML($ssml);
        
        // Final content validation
        $this->validateSSMLContent($ssml);
        
        // Log SSML content for debugging (truncated)
        Log::debug('Generated SSML content', [
            'ssml_length' => strlen($ssml),
            'ssml_preview' => substr($ssml, 0, 200) . (strlen($ssml) > 200 ? '...' : ''),
            'voice' => $voice,
            'language' => $language
        ]);
        
        return $ssml;
    }

    /**
     * Prepare content for SSML by escaping special characters
     */
    protected function prepareContentForSSML(string $content): string
    {
        // First, handle specific XML entities that cause issues
        $content = str_replace([
            '&', '<', '>', '"', "'"
        ], [
            '&amp;', '&lt;', '&gt;', '&quot;', '&apos;'
        ], $content);
        
        // Remove or replace problematic control characters that might cause SSML issues
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $content);
        
        // Remove any remaining XML-like tags that might interfere
        $content = preg_replace('/<(?![\/]?(speak|prosody|break|p|s|phoneme|say-as|sub|emphasis|lang|mark)\b)[^>]*>/i', '', $content);
        
        // Replace multiple spaces with single space
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim whitespace
        $content = trim($content);
        
        return $content;
    }

    /**
     * Enhance content for better speech synthesis
     */
    protected function enhanceContentForSpeech(string $content): string
    {
        // Handle abbreviations first (before adding SSML tags)
        $abbreviations = [
            'Dr.' => 'Doctor',
            'Mr.' => 'Mister',
            'Mrs.' => 'Missus',
            'Ms.' => 'Miss',
            'Prof.' => 'Professor',
            'etc.' => 'etcetera',
            'vs.' => 'versus',
            'e.g.' => 'for example',
            'i.e.' => 'that is',
        ];
        
        foreach ($abbreviations as $abbr => $expansion) {
            $content = str_replace($abbr, $expansion, $content);
        }
        
        // Add pauses after sentences (ensure proper SSML break syntax)
        $content = preg_replace('/([.!?])\s+/', '$1<break time="500ms"/>', $content);
        
        // Add longer pauses after paragraphs
        $content = preg_replace('/\n\n+/', '<break time="1s"/>', $content);
        
        // Remove remaining newlines and normalize spaces
        $content = preg_replace('/\n/', ' ', $content);
        $content = preg_replace('/\s+/', ' ', $content);
        
        return trim($content);
    }

    /**
     * Validate and get a safe voice ID
     */
    protected function validateAndGetVoice(string $voiceId): string
    {
        // List of known valid Amazon Polly voices
        $validVoices = [
            'Joanna', 'Matthew', 'Amy', 'Brian', 'Emma', 'Aditi', 'Raveena',
            'Ivy', 'Kendra', 'Kimberly', 'Salli', 'Joey', 'Justin', 'Kevin',
            'Nicole', 'Russell', 'Aria', 'Ayanda', 'Arlet', 'Hannah', 'Liam',
            'Mia', 'Olivia', 'Pedro', 'Gabrielle', 'Vicki', 'Seoyeon', 'Takumi',
            'Lucia', 'Bianca', 'Camila', 'Vitoria', 'Ricardo', 'Ines', 'Cristiano',
            'Carmen', 'Maxim', 'Tatyana', 'Astrid', 'Filiz', 'Gwyneth', 'Geraint'
        ];
        
        // Return the voice if it's valid, otherwise default to Joanna
        return in_array($voiceId, $validVoices) ? $voiceId : 'Joanna';
    }

    /**
     * Count billed characters (excluding SSML tags)
     */
    protected function countBilledCharacters(string $ssml): int
    {
        // Remove all SSML tags to count only billed characters
        $textOnly = preg_replace('/<[^>]*>/', '', $ssml);
        return strlen($textOnly);
    }

    /**
     * Validate SSML content for common issues
     */
    protected function validateSSMLContent(string $ssml): void
    {
        // Check for unescaped XML characters that could cause issues
        if (preg_match('/[<>&](?![a-zA-Z]+;)/', $ssml)) {
            throw new \Exception('Invalid SSML content: Contains unescaped XML characters');
        }
        
        // Check for invalid break time values
        if (preg_match('/<break\s+time=["\']([^"\']*)["\']/', $ssml, $matches)) {
            $timeValue = $matches[1];
            if (!preg_match('/^\d+(\.\d+)?(ms|s)$/', $timeValue)) {
                throw new \Exception("Invalid SSML content: Invalid break time value '{$timeValue}'");
            }
        }
        
        // Check for invalid prosody attributes
        if (preg_match('/<prosody\s+[^>]*rate=["\']([^"\']*)["\']/', $ssml, $matches)) {
            $rateValue = $matches[1];
            $validRates = ['x-slow', 'slow', 'medium', 'fast', 'x-fast'];
            if (!in_array($rateValue, $validRates) && !preg_match('/^\d+(\.\d+)?%$/', $rateValue)) {
                throw new \Exception("Invalid SSML content: Invalid prosody rate value '{$rateValue}'");
            }
        }
        
        // Check total length doesn't exceed AWS limits
        if (strlen($ssml) > 6000) {
            throw new \Exception('Invalid SSML content: Total length exceeds 6000 characters');
        }
    }

    /**
     * Validate SSML structure
     */
    protected function validateSSML(string $ssml): void
    {
        // Check for basic SSML structure
        if (!str_contains($ssml, '<speak') || !str_contains($ssml, '</speak>')) {
            throw new \Exception('Invalid SSML structure: Missing speak tags');
        }
        
        // Check for balanced prosody tags
        $openProsody = substr_count($ssml, '<prosody');
        $closeProsody = substr_count($ssml, '</prosody>');
        if ($openProsody !== $closeProsody) {
            throw new \Exception('Invalid SSML structure: Unbalanced prosody tags');
        }
        
        // Check for proper break tag formatting (should be self-closing)
        if (preg_match('/<break[^>]*>[^<]*<\/break>/', $ssml)) {
            throw new \Exception('Invalid SSML structure: Break tags should be self-closing');
        }
        
        // Check for unsupported tags that might cause issues
        $unsupportedTags = ['voice', 'audio', 'lexicon'];
        foreach ($unsupportedTags as $tag) {
            if (str_contains($ssml, "<{$tag}")) {
                throw new \Exception("Invalid SSML structure: Unsupported tag <{$tag}> found");
            }
        }
        
        // Try to parse as XML to catch any syntax errors
        libxml_use_internal_errors(true);
        $doc = simplexml_load_string($ssml);
        if ($doc === false) {
            $errors = libxml_get_errors();
            $errorMessage = 'Invalid SSML XML structure';
            if (!empty($errors)) {
                $errorMessage .= ': ' . $errors[0]->message;
            }
            libxml_clear_errors();
            throw new \Exception($errorMessage);
        }
        libxml_clear_errors();
    }

    /**
     * Handle content that exceeds TTS service limits
     */
    protected function handleLongContent(Note $note, string $content, array $options): array
    {
        $maxLength = $this->ttsService->getMaxTextLength();
        $chunks = $this->splitContentIntoChunks($content, $maxLength);
        
        Log::info('Handling long content', [
            'note_id' => $note->id,
            'total_length' => strlen($content),
            'max_length' => $maxLength,
            'chunks_count' => count($chunks)
        ]);

        $podcastParts = [];
        $totalDuration = 0;
        $mainPodcast = null;
        
        foreach ($chunks as $index => $chunk) {
            $chunkOptions = array_merge($options, [
                'chunk_index' => $index,
                'total_chunks' => count($chunks)
            ]);
            
            $ttsResult = $this->ttsService->convertTextToSpeech($chunk, $chunkOptions);
            
            // Debug: Check if file exists immediately after TTS
            if (isset($ttsResult['temp_file_path'])) {
                $fullTempPath = storage_path('app/' . $ttsResult['temp_file_path']);
                Log::info('TTS Result file check', [
                    'note_id' => $note->id,
                    'chunk_index' => $index,
                    'temp_file_path' => $ttsResult['temp_file_path'],
                    'full_temp_path' => $fullTempPath,
                    'file_exists' => file_exists($fullTempPath),
                    'file_size' => file_exists($fullTempPath) ? filesize($fullTempPath) : 'N/A'
                ]);
            }
            
            // Process with media library immediately if needed
            if (isset($ttsResult['needs_media_processing']) && $ttsResult['needs_media_processing']) {
                Log::info('Processing chunk with media library', [
                    'note_id' => $note->id,
                    'chunk_index' => $index,
                    'total_chunks' => count($chunks)
                ]);
                $ttsResult = $this->processWithMediaLibrary($note, $ttsResult);
            }
            
            $podcastParts[] = $ttsResult;
            $totalDuration += $ttsResult['duration'];
            
            // Use the first chunk as the main podcast
            if ($index === 0) {
                $mainPodcast = $ttsResult;
            }
        }

        // Set additional metadata for the main podcast
        $mainPodcast['is_chunked'] = true;
        $mainPodcast['total_chunks'] = count($chunks);
        $mainPodcast['total_duration'] = $totalDuration;
        
        $this->updateNoteWithPodcast($note, $mainPodcast, $options);
        
        return [
            'success' => true,
            'podcast_data' => $mainPodcast,
            'note_id' => $note->id,
            'message' => 'Podcast generated successfully (chunked content)',
            'chunks' => $podcastParts
        ];
    }

    /**
     * Split content into manageable chunks
     */
    protected function splitContentIntoChunks(string $content, int $maxLength): array
    {
        $chunks = [];
        $sentences = preg_split('/(?<=[.!?])\s+/', $content, -1, PREG_SPLIT_NO_EMPTY);
        
        $currentChunk = '';
        
        foreach ($sentences as $sentence) {
            if (strlen($currentChunk . ' ' . $sentence) > $maxLength) {
                if (!empty($currentChunk)) {
                    $chunks[] = trim($currentChunk);
                    $currentChunk = $sentence;
                } else {
                    // Single sentence is too long, split by words
                    $words = explode(' ', $sentence);
                    $wordChunk = '';
                    
                    foreach ($words as $word) {
                        if (strlen($wordChunk . ' ' . $word) > $maxLength) {
                            if (!empty($wordChunk)) {
                                $chunks[] = trim($wordChunk);
                                $wordChunk = $word;
                            } else {
                                // Single word is too long, truncate
                                $chunks[] = substr($word, 0, $maxLength);
                            }
                        } else {
                            $wordChunk .= ' ' . $word;
                        }
                    }
                    
                    if (!empty($wordChunk)) {
                        $currentChunk = trim($wordChunk);
                    }
                }
            } else {
                $currentChunk .= ' ' . $sentence;
            }
        }
        
        if (!empty($currentChunk)) {
            $chunks[] = trim($currentChunk);
        }
        
        return $chunks;
    }

    /**
     * Process temporary file with Spatie Media Library
     */
    protected function processWithMediaLibrary(Note $note, array $ttsResult): array
    {
        try {
            $tempFilePath = $ttsResult['temp_file_path'];
            $fullTempPath = storage_path('app/' . $tempFilePath);
            
            Log::info('Starting media library processing', [
                'note_id' => $note->id,
                'temp_file_path' => $tempFilePath,
                'full_temp_path' => $fullTempPath,
                'file_exists' => file_exists($fullTempPath),
                'file_size' => file_exists($fullTempPath) ? filesize($fullTempPath) : 'N/A'
            ]);
            
            // Ensure the temporary file exists
            if (!file_exists($fullTempPath)) {
                throw new \Exception("Temporary file not found: {$fullTempPath}");
            }
            
            // Generate a proper filename for the media library
            $originalFilename = 'podcast_' . $note->id . '_' . now()->format('Y-m-d_H-i-s') . '.' . ($ttsResult['format'] ?? 'mp3');
            
            Log::info('Adding file to media library', [
                'note_id' => $note->id,
                'original_filename' => $originalFilename,
                'collection' => 'note-podcasts'
            ]);
            
            // Add the file to media library
            $mediaItem = $note
                ->addMedia($fullTempPath)
                ->usingName('Podcast for Note #' . $note->id)
                ->usingFileName($originalFilename)
                ->toMediaCollection('note-podcasts');
            
            Log::info('Media item created successfully', [
                'note_id' => $note->id,
                'media_id' => $mediaItem->id,
                'media_path' => $mediaItem->getPath(),
                'media_url' => $mediaItem->getUrl()
            ]);
            
            // Clean up temporary file
            \Storage::disk('local')->delete($tempFilePath);
            
            // Update the result with media library information
            $ttsResult['file_path'] = $mediaItem->getPath();
            $ttsResult['media_id'] = $mediaItem->id;
            $ttsResult['media_url'] = $mediaItem->getUrl();
            unset($ttsResult['temp_file_path'], $ttsResult['needs_media_processing']);
            
            Log::info('Successfully processed podcast with media library', [
                'note_id' => $note->id,
                'media_id' => $mediaItem->id,
                'original_filename' => $originalFilename,
                'final_url' => $mediaItem->getUrl()
            ]);
            
            return $ttsResult;
            
        } catch (\Exception $e) {
            Log::error('Failed to process podcast with media library', [
                'note_id' => $note->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'temp_file_path' => $ttsResult['temp_file_path'] ?? 'unknown'
            ]);
            
            // Clean up temporary file on error
            if (isset($ttsResult['temp_file_path'])) {
                \Storage::disk('local')->delete($ttsResult['temp_file_path']);
            }
            
            throw $e;
        }
    }

    /**
     * Update note with podcast information
     */
    protected function updateNoteWithPodcast(Note $note, array $ttsResult, array $options): void
    {
        $updateData = [
            'podcast_duration' => $ttsResult['duration'],
            'podcast_file_size' => $ttsResult['file_size'],
            'podcast_status' => 'completed',
            'podcast_metadata' => json_encode([
                'service' => $ttsResult['service'],
                'voice_id' => $ttsResult['voice_id'],
                'language_code' => $ttsResult['language_code'],
                'engine' => $ttsResult['engine'],
                'format' => $ttsResult['format'],
                'options_used' => $options,
                'generated_at' => now()->toISOString(),
                'metadata' => $ttsResult['metadata'] ?? [],
                'media_id' => $ttsResult['media_id'] ?? null,
                'uses_media_library' => isset($ttsResult['media_id'])
            ]),
            'podcast_failure_reason' => null
        ];

        // Only set podcast_file_path if not using media library
        if (!isset($ttsResult['media_id'])) {
            $updateData['podcast_file_path'] = $ttsResult['file_path'] ?? null;
        }

        $note->update($updateData);
    }

    /**
     * Get TTS service information
     */
    public function getTTSServiceInfo(): array
    {
        return [
            'service_name' => $this->ttsService->getServiceName(),
            'max_text_length' => $this->ttsService->getMaxTextLength(),
            'available_voices' => $this->ttsService->getAvailableVoices(),
            'supported_languages' => $this->ttsService->getSupportedLanguages(),
        ];
    }
}