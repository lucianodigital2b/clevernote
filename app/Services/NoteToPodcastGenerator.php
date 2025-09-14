<?php

namespace App\Services;

use App\Contracts\TextToSpeechServiceInterface;
use App\Models\Note;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
            // Check if dual-voice podcast is requested
            if (isset($options['host_voice']) && isset($options['guest_voice'])) {
                return $this->generateDualVoicePodcast($note, $options);
            }
            
            // Prepare the text content for TTS
            $podcastText = $this->preparePodcastText($note, $options);

            // Validate text length
            if (strlen($podcastText) > $this->ttsService->getMaxTextLength()) {
                return $this->handleLongContent($note, $podcastText, $options);
            }

            // Check content length before processing
            $contentLength = strlen($podcastText);
            $maxBilledChars = $this->ttsService->getMaxTextLength();
            
            if ($contentLength > $maxBilledChars) {
                Log::info('Content exceeds TTS service limit, using chunked processing', [
                    'note_id' => $note->id,
                    'content_length' => $contentLength,
                    'max_allowed' => $maxBilledChars,
                    'service' => $this->ttsService->getServiceName()
                ]);
                
                return $this->handleLongContent($note, $podcastText, $options);
            }

            try {
                // Get service-specific default voice from config
                $serviceName = $this->ttsService->getServiceName();
                $providerConfig = config("tts.providers.{$serviceName}");
                $defaultVoice = $providerConfig['defaults']['voice_id'] ?? 'en-US-natalie';
                
                // Validate and update voice_id in options before processing
                $options['voice_id'] = $this->validateAndGetVoice($options['voice_id'] ?? $defaultVoice);
                
                $processedContent = $podcastText;
                
                // Apply SSML formatting only for services that support it
                if (($options['use_ssml'] ?? false) && $this->ttsService->supportsSSML()) {
                    $processedContent = $this->applySSMLFormatting($podcastText, $options);
                    
                    // Double-check the billed character count (content without SSML tags)
                    $billedChars = $this->countBilledCharacters($processedContent);
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
                        'ssml_length' => strlen($processedContent),
                        'billed_chars' => $billedChars,
                        'ssml_preview' => substr($processedContent, 0, 200) . '...',
                        'voice_id' => $options['voice_id'],
                        'language_code' => $options['language_code'] ?? 'en-US'
                    ]);
                } else {
                    Log::info('Processing with plain text', [
                        'note_id' => $note->id,
                        'content_length' => strlen($processedContent),
                        'voice_id' => $options['voice_id'],
                        'service' => $serviceName
                    ]);
                }
                
                $ttsResult = $this->ttsService->convertTextToSpeech($processedContent, $options);
                
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

        // Apply SSML formatting if requested and supported by the service
        if (($options['use_ssml'] ?? false) && $this->ttsService->supportsSSML()) {
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
        } elseif (($options['use_ssml'] ?? false) && !$this->ttsService->supportsSSML()) {
            Log::info('SSML not supported by current TTS service, using plain text', [
                'note_id' => $note->id,
                'service' => $this->ttsService->getServiceName()
            ]);
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
        $language = $this->detectLanguage($note->content ?? '');
        $welcomeMessage = $this->getWelcomeMessage($language);
        
        return "{$welcomeMessage} Today we'll be covering: {$title}.";
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
        $voice = $options['voice_id'] ?? 'Joanna';
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
        // Get available voices from the current TTS service
        try {
            $availableVoices = $this->ttsService->getAvailableVoices();
            $validVoiceIds = array_column($availableVoices, 'voice_id');
            
            // Return the voice if it's valid, otherwise use service default
            if (in_array($voiceId, $validVoiceIds)) {
                return $voiceId;
            }
            
            // Get service-specific default voice from config
            $serviceName = $this->ttsService->getServiceName();
            $providerConfig = config("tts.providers.{$serviceName}");
            $defaultVoice = $providerConfig['defaults']['voice_id'] ?? $voiceId;
            
            Log::warning('Invalid voice ID provided, using default', [
                'provided_voice' => $voiceId,
                'default_voice' => $defaultVoice,
                'service' => $serviceName
            ]);
            
            return $defaultVoice;
        } catch (\Exception $e) {
            Log::warning('Could not validate voice, using provided voice', [
                'voice' => $voiceId,
                'error' => $e->getMessage()
            ]);
            return $voiceId;
        }
    }

    /**
     * Count billed characters (service-specific)
     */
    protected function countBilledCharacters(string $content): int
    {
        // Check if service supports SSML and should exclude tags from billing
        if ($this->ttsService->supportsSSML()) {
            // Remove SSML tags to count only billed characters for SSML-supporting services
            $textOnly = preg_replace('/<[^>]*>/', '', $content);
            return strlen($textOnly);
        }
        
        // For services that don't support SSML, count all characters
        return strlen($content);
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
        // Validate and update voice_id in options before processing chunks
        $options['voice_id'] = $this->validateAndGetVoice($options['voice_id'] ?? 'Joanna');
        
        $maxLength = $this->ttsService->getMaxTextLength();
        $chunks = $this->splitContentIntoChunks($content, $maxLength);
        
        Log::info('Handling long content', [
            'note_id' => $note->id,
            'total_length' => strlen($content),
            'max_length' => $maxLength,
            'chunks_count' => count($chunks),
            'voice_id' => $options['voice_id']
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
                $fullTempPath = $ttsResult['full_path'] ?? Storage::disk('local')->path($ttsResult['temp_file_path']);
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
            // Use the full_path provided by the TTS service if available, otherwise construct it
            $fullTempPath = $ttsResult['full_path'] ?? Storage::disk('local')->path($tempFilePath);
            
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
                'uses_media_library' => isset($ttsResult['media_id']),
                'media_url' => $ttsResult['media_url'] ?? null
            ]),
            'podcast_failure_reason' => null
        ];

        // Set podcast_file_path for both media library and direct storage
        // For media library, we store the relative path for compatibility
        // For direct storage, we store the actual file path
        if (isset($ttsResult['media_id'])) {
            // For media library, store a reference path that can be used by the model's getPodcastUrlAttribute
            $updateData['podcast_file_path'] = 'media/' . $ttsResult['media_id'];
        } else {
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

    /**
     * Generate dual-voice podcast with host and guest
     */
    protected function generateDualVoicePodcast(Note $note, array $options): array
    {
        Log::info('Starting dual-voice podcast generation', [
            'note_id' => $note->id,
            'host_voice' => $options['host_voice'],
            'guest_voice' => $options['guest_voice']
        ]);

        // Generate podcast script with host/guest dialogue
        $script = $this->generatePodcastScript($note, $options);
        
        // Split script into host and guest parts
        $scriptParts = $this->parseScriptParts($script);
        
        $audioFiles = [];
        $totalDuration = 0;
        
        // Generate TTS for each part
        foreach ($scriptParts as $index => $part) {
            $voiceOptions = array_merge($options, [
                'voice_id' => $part['speaker'] === 'host' ? $options['host_voice'] : $options['guest_voice'],
                'part_index' => $index
            ]);
            
            $ttsResult = $this->ttsService->convertTextToSpeech($part['text'], $voiceOptions);
            
            // Process with media library if needed
            if (isset($ttsResult['needs_media_processing']) && $ttsResult['needs_media_processing']) {
                $ttsResult = $this->processWithMediaLibrary($note, $ttsResult);
            }
            
            $audioFiles[] = [
                'file_path' => $ttsResult['file_path'],
                'duration' => $ttsResult['duration'],
                'speaker' => $part['speaker'],
                'order' => $index
            ];
            
            $totalDuration += $ttsResult['duration'];
        }
        
        // Merge audio files into single podcast
        $finalPodcast = $this->mergeAudioFiles($note, $audioFiles);
        
        // Update note with podcast information
        $this->updateNoteWithPodcast($note, $finalPodcast, $options);
        
        Log::info('Dual-voice podcast generation completed', [
            'note_id' => $note->id,
            'total_parts' => count($scriptParts),
            'total_duration' => $totalDuration
        ]);
        
        return [
            'success' => true,
            'podcast_data' => $finalPodcast,
            'note_id' => $note->id,
            'script_parts' => count($scriptParts),
            'message' => 'Dual-voice podcast generated successfully'
        ];
    }

    /**
     * Generate podcast script with host/guest dialogue
     */
    protected function generatePodcastScript(Note $note, array $options): string
    {
        $content = $note->content ?? '';
        $title = $note->title ?? 'Untitled Note';
        $language = $this->detectLanguage($content);
        $welcomeMessage = $this->getWelcomeMessage($language);
        
        // Clean HTML content
        $cleanContent = $this->cleanHtmlContent($content);
        
        // Extract key topics and insights from content
        $topics = $this->extractKeyTopics($cleanContent);
        $insights = $this->extractKeyInsights($cleanContent);
        
        // Generate conversational script
        $script = $this->buildConversationalScript($title, $topics, $insights, $language, $welcomeMessage);
        
        // Log the generated podcast script for debugging
        Log::info('Generated podcast script', [
            'note_id' => $note->id,
            'note_title' => $title,
            'language' => $language,
            'script_length' => strlen($script),
            'topics_count' => count($topics),
            'insights_count' => count($insights)
        ]);
        
        return $script;
    }

    /**
     * Parse script into speaker parts
     */
    protected function parseScriptParts(string $script): array
    {
        $parts = [];
        $lines = explode("\n", $script);
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            if (preg_match('/^\[(HOST|GUEST)\]\s*(.+)$/', $line, $matches)) {
                $speaker = strtolower($matches[1]);
                $text = trim($matches[2]);
                
                if (!empty($text)) {
                    $parts[] = [
                        'speaker' => $speaker,
                        'text' => $text
                    ];
                }
            }
        }
        
        return $parts;
    }

    /**
     * Extract key topics from content
     */
    protected function extractKeyTopics(string $content): array
    {
        // Split content into meaningful chunks
        $paragraphs = preg_split('/\n\n+/', $content, -1, PREG_SPLIT_NO_EMPTY);
        $topics = [];
        
        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if (strlen($paragraph) > 50) {
                // Extract first sentence or main idea
                $sentences = preg_split('/[.!?]+/', $paragraph, -1, PREG_SPLIT_NO_EMPTY);
                if (!empty($sentences)) {
                    $mainIdea = trim($sentences[0]);
                    if (strlen($mainIdea) > 20) {
                        $topics[] = $mainIdea;
                    }
                }
            }
        }
        
        return array_slice($topics, 0, 6); // Limit to 6 main topics
    }
    
    /**
     * Extract key insights and details from content
     */
    protected function extractKeyInsights(string $content): array
    {
        $insights = [];
        
        // Look for bullet points, numbered lists, or key phrases
        $lines = explode("\n", $content);
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Check for bullet points or numbered items
            if (preg_match('/^[•\-\*]\s*(.+)$/', $line, $matches) || 
                preg_match('/^\d+\.\s*(.+)$/', $line, $matches)) {
                $insight = trim($matches[1]);
                if (strlen($insight) > 15) {
                    $insights[] = $insight;
                }
            }
            // Look for sentences with key indicators
            elseif (preg_match('/(important|key|crucial|essential|significant|note that|remember|consider)/i', $line) && strlen($line) > 30) {
                $insights[] = $line;
            }
        }
        
        // If no specific insights found, extract some sentences from paragraphs
        if (empty($insights)) {
            $sentences = preg_split('/[.!?]+/', $content, -1, PREG_SPLIT_NO_EMPTY);
            foreach ($sentences as $sentence) {
                $sentence = trim($sentence);
                if (strlen($sentence) > 40 && strlen($sentence) < 200) {
                    $insights[] = $sentence;
                }
            }
        }
        
        return array_slice($insights, 0, 8); // Limit to 8 insights
    }
    
    /**
     * Build conversational script with natural flow
     */
    protected function buildConversationalScript(string $title, array $topics, array $insights, string $language, string $welcomeMessage): string
    {
        $script = "";
        
        // Opening
        $script .= "[HOST] {$welcomeMessage} I'm your host, and today we have a fascinating topic to explore: {$title}. I'm joined by our expert guest to dive deep into this subject.\n\n";
        $script .= "[GUEST] Thank you for having me! I'm really excited to discuss this topic. There's so much valuable information to unpack here.\n\n";
        
        // Introduction and overview
        if (!empty($topics)) {
            $script .= "[HOST] Let's start with an overview. What would you say are the main areas we should focus on today?\n\n";
            $script .= "[GUEST] Great question! From what I've analyzed, there are several key areas worth exploring. " . $topics[0] . ". This sets the foundation for everything else we'll discuss.\n\n";
            
            if (count($topics) > 1) {
                $script .= "[HOST] That's a solid starting point. What else should our listeners know?\n\n";
                $script .= "[GUEST] Well, another crucial aspect is: " . $topics[1] . ". This really builds on what we just covered.\n\n";
            }
        }
        
        // Deep dive into topics with insights
        $topicIndex = 2;
        $insightIndex = 0;
        
        while ($topicIndex < count($topics) && $insightIndex < count($insights)) {
            // Host asks about next topic
            $script .= "[HOST] That's really insightful. Now, I'm curious about something else. Can you tell us more about: " . $topics[$topicIndex] . "?\n\n";
            
            // Guest responds with insight
            if ($insightIndex < count($insights)) {
                $script .= "[GUEST] Absolutely! This is where it gets interesting. " . $insights[$insightIndex] . ". It's one of those things that really makes a difference when you understand it properly.\n\n";
                $insightIndex++;
            }
            
            // Host follows up
            if ($insightIndex < count($insights)) {
                $script .= "[HOST] That's a great point. I think our listeners would also benefit from knowing that " . $insights[$insightIndex] . ". How does that fit into the bigger picture?\n\n";
                $insightIndex++;
            }
            
            // Guest elaborates
            if ($insightIndex < count($insights)) {
                $script .= "[GUEST] Exactly! And here's something else to consider: " . $insights[$insightIndex] . ". This really ties everything together.\n\n";
                $insightIndex++;
            }
            
            $topicIndex++;
        }
        
        // Add any remaining insights as discussion points
        while ($insightIndex < count($insights)) {
            if ($insightIndex % 2 == 0) {
                $script .= "[HOST] Before we wrap up, there's another important point: " . $insights[$insightIndex] . ". What are your thoughts on this?\n\n";
            } else {
                $script .= "[GUEST] That's crucial to understand. " . $insights[$insightIndex] . ". It's something I always emphasize when discussing this topic.\n\n";
            }
            $insightIndex++;
        }
        
        // Closing
        $script .= "[HOST] This has been such an enlightening conversation. Before we close, what would be your key takeaway for our listeners?\n\n";
        $script .= "[GUEST] I'd say the most important thing is to really understand these concepts and how they connect. Each point we've discussed builds on the others, and that's what makes this topic so valuable to explore.\n\n";
        $script .= "[HOST] Perfectly said! Thank you so much for sharing your expertise with us today. This has been incredibly valuable.\n\n";
        $script .= "[GUEST] Thank you for having me! It's been a pleasure discussing this topic and I hope your listeners found it as engaging as I did.\n\n";
        $script .= "[HOST] And thank you to our listeners for joining us today. Until next time, keep learning and stay curious!";
        
        return $script;
    }

    /**
     * Detect language from content
     */
    protected function detectLanguage(string $content): string
    {
        // Simple language detection based on common words
        $content = strtolower(strip_tags($content));
        
        // Portuguese indicators
        if (preg_match('/\b(o|a|os|as|de|da|do|das|dos|em|na|no|nas|nos|para|por|com|uma|um|são|é|que|não)\b/', $content)) {
            return 'pt';
        }
        
        // Spanish indicators
        if (preg_match('/\b(el|la|los|las|de|del|en|con|por|para|un|una|es|son|que|no|y|o)\b/', $content)) {
            return 'es';
        }
        
        // French indicators
        if (preg_match('/\b(le|la|les|de|du|des|en|dans|avec|pour|par|un|une|est|sont|que|ne|et|ou)\b/', $content)) {
            return 'fr';
        }
        
        // German indicators
        if (preg_match('/\b(der|die|das|den|dem|des|ein|eine|ist|sind|und|oder|nicht|mit|von|zu)\b/', $content)) {
            return 'de';
        }
        
        // Default to English
        return 'en';
    }

    /**
     * Get welcome message in specified language
     */
    protected function getWelcomeMessage(string $language): string
    {
        return match($language) {
            'pt' => 'Bem-vindos ao podcast CleverNote',
            'es' => 'Bienvenidos al podcast CleverNote',
            'fr' => 'Bienvenue au podcast CleverNote',
            'de' => 'Willkommen zum CleverNote Podcast',
            'it' => 'Benvenuti al podcast CleverNote',
            default => 'Welcome to the CleverNote podcast'
        };
    }

    /**
     * Merge multiple audio files into single podcast
     */
    protected function mergeAudioFiles(Note $note, array $audioFiles): array
    {
        // For now, we'll concatenate the files using a simple approach
        // In a production environment, you might want to use FFmpeg or similar
        
        $tempFiles = [];
        $totalDuration = 0;
        
        foreach ($audioFiles as $audioFile) {
            $tempFiles[] = $audioFile['file_path'];
            $totalDuration += $audioFile['duration'];
        }
        
        // Generate unique filename for the merged podcast
        $filename = 'podcasts/' . Str::uuid() . '.mp3';
        
        // For now, we'll use the first file as the main file
        // In production, implement proper audio merging
        $mainFile = $audioFiles[0]['file_path'];
        
        // Copy the main file to the final location
        if (Storage::disk('r2')->exists($mainFile)) {
            Storage::disk('r2')->copy($mainFile, $filename);
        }
        
        return [
            'file_path' => $filename,
            'duration' => $totalDuration,
            'file_size' => Storage::disk('r2')->size($filename),
            'url' => Storage::disk('r2')->url($filename),
            'parts_count' => count($audioFiles),
            'needs_media_processing' => false
        ];
    }
}