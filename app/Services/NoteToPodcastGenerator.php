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

            // Convert text to speech
            $ttsResult = $this->ttsService->convertTextToSpeech($podcastText, $options);

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
            $cleanContent = $this->applySSMLFormatting($cleanContent, $options);
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
        $voice = $options['voice_id'] ?? 'Joanna';
        $language = $options['language_code'] ?? 'en-US';
        
        // Wrap content in SSML speak tags
        $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{$language}'>";
        
        // Add voice selection
        $ssml .= "<voice name='{$voice}'>";
        
        // Add prosody for better pacing
        $ssml .= "<prosody rate='medium' pitch='medium'>";
        
        // Process content for better speech
        $content = $this->enhanceContentForSpeech($content);
        
        $ssml .= $content;
        $ssml .= "</prosody></voice></speak>";
        
        return $ssml;
    }

    /**
     * Enhance content for better speech synthesis
     */
    protected function enhanceContentForSpeech(string $content): string
    {
        // Add pauses after sentences
        $content = preg_replace('/([.!?])\s+/', '$1 <break time="500ms"/> ', $content);
        
        // Add longer pauses after paragraphs
        $content = preg_replace('/\n\n/', ' <break time="1s"/> ', $content);
        
        // Handle abbreviations
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
        
        return $content;
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
        
        foreach ($chunks as $index => $chunk) {
            $chunkOptions = array_merge($options, [
                'chunk_index' => $index,
                'total_chunks' => count($chunks)
            ]);
            
            $ttsResult = $this->ttsService->convertTextToSpeech($chunk, $chunkOptions);
            $podcastParts[] = $ttsResult;
            $totalDuration += $ttsResult['duration'];
        }

        // For now, return the first chunk as the main podcast
        // In a more advanced implementation, you could merge audio files
        $mainPodcast = $podcastParts[0];
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
     * Update note with podcast information
     */
    protected function updateNoteWithPodcast(Note $note, array $ttsResult, array $options): void
    {
        $note->update([
            'podcast_file_path' => $ttsResult['file_path'],
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
                'metadata' => $ttsResult['metadata'] ?? []
            ]),
            'podcast_failure_reason' => null
        ]);
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