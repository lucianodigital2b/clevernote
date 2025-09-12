<?php

namespace App\Services\TextToSpeech;

use App\Contracts\TextToSpeechServiceInterface;
use Aws\Polly\PollyClient;
use Aws\Exception\AwsException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AmazonPollyService implements TextToSpeechServiceInterface
{
    protected PollyClient $pollyClient;
    protected array $config;
    protected array $defaults;

    public function __construct(array $config = [], array $defaults = [])
    {
        // Use provided config or fallback to services config
        $this->config = !empty($config) ? $config : config('services.aws.polly');
        $this->defaults = $defaults;
        
        Log::info('Amazon Polly Service Config', $this->config);

        $this->pollyClient = new PollyClient([
            'version' => 'latest',
            'region' => $this->config['region'] ?? 'us-east-1',
            'credentials' => [
                'key' => $this->config['access_key_id'],
                'secret' => $this->config['secret_access_key'],
            ],
        ]);
    }

    public function convertTextToSpeech(string $text, array $options = []): array
    {
        try {
            // Validate text length
            if (strlen($text) > $this->getMaxTextLength()) {
                throw new \InvalidArgumentException('Text exceeds maximum length of ' . $this->getMaxTextLength() . ' characters');
            }

            // Validate options
            if (!$this->validateOptions($options)) {
                throw new \InvalidArgumentException('Invalid options provided');
            }

            // Prepare synthesis parameters with defaults
            $params = [
                'Text' => $text,
                'OutputFormat' => $options['output_format'] ?? $this->defaults['output_format'] ?? 'mp3',
                'VoiceId' => $options['voice_id'] ?? $this->defaults['voice_id'] ?? 'Joanna',
                'LanguageCode' => $options['language_code'] ?? $this->defaults['language_code'] ?? 'en-US',
                'Engine' => $options['engine'] ?? $this->defaults['engine'] ?? 'standard',
            ];

            // Add SSML support if text contains SSML tags
            if ($this->containsSSML($text)) {
                $params['TextType'] = 'ssml';
            }

            // Add speech marks if requested
            if (!empty($options['speech_marks'])) {
                $params['SpeechMarkTypes'] = $options['speech_marks'];
            }

            Log::info('Starting Amazon Polly synthesis', ['params' => $params]);

            // Call Amazon Polly
            $result = $this->pollyClient->synthesizeSpeech($params);

            // Generate unique filename for temporary storage
            $filename = 'temp/podcasts/' . Str::uuid() . '.' . ($options['output_format'] ?? 'mp3');

            // Save audio stream to temporary storage (local disk)
            $audioStream = $result['AudioStream']->getContents();
            Storage::disk('local')->put($filename, $audioStream);

            // Get file metadata
            $fileSize = strlen($audioStream);
            $duration = $this->estimateAudioDuration($text, $options);

            Log::info('Amazon Polly synthesis completed', [
                'filename' => $filename,
                'file_size' => $fileSize,
                'duration' => $duration
            ]);

            return [
                'temp_file_path' => $filename,
                'file_size' => $fileSize,
                'duration' => $duration,
                'format' => $options['output_format'] ?? 'mp3',
                'voice_id' => $params['VoiceId'],
                'language_code' => $params['LanguageCode'],
                'engine' => $params['Engine'],
                'service' => $this->getServiceName(),
                'needs_media_processing' => true,
                'metadata' => [
                    'characters_count' => strlen($text),
                    'words_count' => str_word_count($text),
                    'synthesis_time' => now()->toISOString(),
                ]
            ];

        } catch (AwsException $e) {
            Log::error('Amazon Polly synthesis failed', [
                'error' => $e->getMessage(),
                'code' => $e->getAwsErrorCode(),
                'type' => $e->getAwsErrorType()
            ]);
            
            throw new \Exception('Text-to-speech conversion failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Text-to-speech conversion error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function getAvailableVoices(): array
    {
        try {
            $result = $this->pollyClient->describeVoices();
            $voices = [];

            foreach ($result['Voices'] as $voice) {
                $voices[] = [
                    'id' => $voice['Id'],
                    'name' => $voice['Name'],
                    'gender' => $voice['Gender'],
                    'language_code' => $voice['LanguageCode'],
                    'language_name' => $voice['LanguageName'],
                    'supported_engines' => $voice['SupportedEngines'] ?? ['standard'],
                    'additional_language_codes' => $voice['AdditionalLanguageCodes'] ?? [],
                ];
            }

            return $voices;
        } catch (AwsException $e) {
            Log::error('Failed to fetch Amazon Polly voices', ['error' => $e->getMessage()]);
            return $this->getDefaultVoices();
        }
    }

    public function getSupportedLanguages(): array
    {
        $voices = $this->getAvailableVoices();
        $languages = [];

        foreach ($voices as $voice) {
            $languages[$voice['language_code']] = $voice['language_name'];
            
            // Add additional language codes if available
            foreach ($voice['additional_language_codes'] as $langCode) {
                if (!isset($languages[$langCode])) {
                    $languages[$langCode] = $langCode; // Fallback to code if name not available
                }
            }
        }

        return $languages;
    }

    public function validateOptions(array $options): bool
    {
        // Validate output format
        if (isset($options['output_format'])) {
            $validFormats = ['mp3', 'ogg_vorbis', 'pcm', 'json'];
            if (!in_array($options['output_format'], $validFormats)) {
                return false;
            }
        }

        // Validate engine
        if (isset($options['engine'])) {
            $validEngines = ['standard', 'neural'];
            if (!in_array($options['engine'], $validEngines)) {
                return false;
            }
        }

        // Validate voice ID (basic check - could be enhanced with API call)
        if (isset($options['voice_id'])) {
            if (!is_string($options['voice_id']) || empty($options['voice_id'])) {
                return false;
            }
        }

        // Validate language code format
        if (isset($options['language_code'])) {
            if (!preg_match('/^[a-z]{2}-[A-Z]{2}$/', $options['language_code'])) {
                return false;
            }
        }

        return true;
    }

    public function getMaxTextLength(): int
    {
        return 3000; // Amazon Polly limit for standard requests
    }

    public function getServiceName(): string
    {
        return 'amazon_polly';
    }

    public function supportsSSML(): bool
    {
        return true;
    }

    /**
     * Check if text contains SSML tags
     */
    protected function containsSSML(string $text): bool
    {
        return preg_match('/<[^>]+>/', $text) === 1;
    }

    /**
     * Estimate audio duration based on text length and speech rate
     */
    protected function estimateAudioDuration(string $text, array $options): int
    {
        $wordsPerMinute = 150; // Average speaking rate
        $wordCount = str_word_count($text);
        
        // Adjust for different engines
        if (($options['engine'] ?? 'standard') === 'neural') {
            $wordsPerMinute = 160; // Neural voices tend to be slightly faster
        }
        
        $durationMinutes = $wordCount / $wordsPerMinute;
        return (int) ceil($durationMinutes * 60); // Return duration in seconds
    }

    /**
     * Get default voices as fallback
     */
    protected function getDefaultVoices(): array
    {
        return [
            [
                'id' => 'Joanna',
                'name' => 'Joanna',
                'gender' => 'Female',
                'language_code' => 'en-US',
                'language_name' => 'US English',
                'supported_engines' => ['standard', 'neural'],
                'additional_language_codes' => [],
            ],
            [
                'id' => 'Matthew',
                'name' => 'Matthew',
                'gender' => 'Male',
                'language_code' => 'en-US',
                'language_name' => 'US English',
                'supported_engines' => ['standard', 'neural'],
                'additional_language_codes' => [],
            ],
            [
                'id' => 'Amy',
                'name' => 'Amy',
                'gender' => 'Female',
                'language_code' => 'en-GB',
                'language_name' => 'British English',
                'supported_engines' => ['standard', 'neural'],
                'additional_language_codes' => [],
            ],
        ];
    }
}