<?php

namespace App\Services\TextToSpeech;

use App\Contracts\TextToSpeechServiceInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Http\Client\RequestException;

class MurfService implements TextToSpeechServiceInterface
{
    protected array $config;
    protected array $defaults;
    protected string $baseUrl = 'https://api.murf.ai/v1';

    public function __construct(array $config = [], array $defaults = [])
    {
        $this->config = !empty($config) ? $config : config('services.murf');
        $this->defaults = $defaults;
        
        if (empty($this->config['api_key'])) {
            throw new \InvalidArgumentException('Murf API key is required');
        }
        
        Log::info('Murf Service initialized', [
            'has_api_key' => !empty($this->config['api_key']),
            'defaults' => $this->defaults
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
                'text' => $text,
                'voiceId' => $options['voice_id'] ?? $this->defaults['voice_id'] ?? 'en-US-natalie',
                'format' => strtoupper($options['output_format'] ?? $this->defaults['output_format'] ?? 'MP3'),
                'modelVersion' => 'GEN2',
                'encodeAsBase64' => false, // We'll get URL and download the file
            ];

            // Add optional parameters if provided
            if (isset($options['language_code'])) {
                $params['multiNativeLocale'] = $options['language_code'];
            }
            
            if (isset($options['rate']) && $options['rate'] >= -50 && $options['rate'] <= 50) {
                $params['rate'] = (int) $options['rate'];
            }
            
            if (isset($options['pitch']) && $options['pitch'] >= -50 && $options['pitch'] <= 50) {
                $params['pitch'] = (int) $options['pitch'];
            }
            
            if (isset($options['style'])) {
                $params['style'] = $options['style'];
            }
            
            if (isset($options['variation']) && $options['variation'] >= 0 && $options['variation'] <= 5) {
                $params['variation'] = (int) $options['variation'];
            }

            Log::info('Starting Murf synthesis', ['params' => array_merge($params, ['text' => substr($text, 0, 100) . '...'])]);

            // Make API request to Murf
            $response = Http::withHeaders([
                'api-key' => $this->config['api_key'],
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(60)->post($this->baseUrl . '/speech/generate', $params);

            if (!$response->successful()) {
                $responseBody = $response->body();
                $responseData = $response->json();
                $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Unknown error occurred';
                
                Log::error('Murf API request failed', [
                    'status' => $response->status(),
                    'error' => $errorMessage,
                    'response' => $responseBody,
                    'response_data' => $responseData
                ]);
                
                // Include full error details for debugging
                $fullError = "Status: {$response->status()}, Error: {$errorMessage}";
                if (!empty($responseData['details'])) {
                    $fullError .= ", Details: " . json_encode($responseData['details']);
                }
                if (!empty($responseBody) && strlen($responseBody) < 500) {
                    $fullError .= ", Response: {$responseBody}";
                }
                
                throw new \Exception('Murf API request failed: ' . $fullError);
            }

            $result = $response->json();
            
            if (empty($result['audioFile'])) {
                throw new \Exception('No audio file URL returned from Murf API');
            }

            // Download the audio file from Murf's URL
            $audioUrl = $result['audioFile'];
            $audioResponse = Http::timeout(120)->get($audioUrl);
            
            if (!$audioResponse->successful()) {
                throw new \Exception('Failed to download audio file from Murf');
            }

            // Generate unique filename for storage
            $extension = strtolower($params['format']);
            $filename = 'temp/podcasts/' . Str::uuid() . '.' . $extension;

            // Save audio content to local storage
            Storage::disk('local')->put($filename, $audioResponse->body());
            $filePath = storage_path('app' . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $filename));
            
            // Get file metadata
            $fileSize = Storage::disk('local')->size($filename);
            $duration = $result['audioLengthInSeconds'] ?? 0;

            Log::info('Murf synthesis completed successfully', [
                'file_path' => $filename,
                'file_size' => $fileSize,
                'duration' => $duration,
                'consumed_chars' => $result['consumedCharacterCount'] ?? 0,
                'remaining_chars' => $result['remainingCharacterCount'] ?? 0
            ]);

            return [
                'file_path' => $filename,
                'temp_file_path' => $filename,
                'full_path' => $filePath,
                'file_size' => $fileSize,
                'duration' => (float) $duration,
                'format' => $extension,
                'voice_id' => $params['voiceId'],
                'language_code' => $params['multiNativeLocale'] ?? null,
                'engine' => 'murf_gen2',
                'service' => 'murf',
                'metadata' => [
                    'characters_count' => strlen($text),
                    'words_count' => str_word_count($text),
                    'synthesis_time' => now()->toISOString(),
                    'consumed_character_count' => $result['consumedCharacterCount'] ?? 0,
                    'remaining_character_count' => $result['remainingCharacterCount'] ?? 0,
                    'model_version' => 'GEN2',
                    'word_durations' => $result['wordDurations'] ?? null
                ]
            ];

        } catch (RequestException $e) {
            Log::error('Murf HTTP request failed', [
                'error' => $e->getMessage(),
                'text_length' => strlen($text)
            ]);
            throw new \Exception('Murf service request failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Murf synthesis failed', [
                'error' => $e->getMessage(),
                'text_length' => strlen($text)
            ]);
            throw $e;
        }
    }

    public function getAvailableVoices(): array
    {
        try {
            $response = Http::withHeaders([
                'api-key' => $this->config['api_key'],
                'Accept' => 'application/json',
            ])->timeout(30)->get($this->baseUrl . '/speech/voices');

            if (!$response->successful()) {
                $responseBody = $response->body();
                $responseData = $response->json();
                $errorMessage = $responseData['message'] ?? $responseData['error'] ?? 'Unknown error occurred';
                
                Log::error('Failed to fetch Murf voices', [
                    'status' => $response->status(),
                    'error' => $errorMessage,
                    'response' => $responseBody,
                    'response_data' => $responseData
                ]);
                return $this->getFallbackVoices();
            }

            // According to Murf API docs, the response is directly an array of voice objects
            $voices = $response->json([]);
            
            // Transform Murf voice format to our standard format
            return collect($voices)->map(function ($voice) {
                return [
                    'voice_id' => $voice['voiceId'] ?? $voice['name'],
                    'name' => $voice['displayName'] ?? $voice['voiceId'],
                    'gender' => $voice['gender'] ?? 'Unknown',
                    'language_code' => $voice['locale'] ?? 'en-US',
                    'language_name' => $voice['displayLanguage'] ?? 'English',
                    'accent' => $voice['accent'] ?? null,
                    'age' => $voice['description'] ?? null,
                    'styles' => $voice['availableStyles'] ?? [],
                    'sample_rate' => 44100, // Default sample rate
                    'additional_language_codes' => array_keys($voice['supportedLocales'] ?? [])
                ];
            })->toArray();

        } catch (\Exception $e) {
            Log::error('Error fetching Murf voices', ['error' => $e->getMessage()]);
            return $this->getFallbackVoices();
        }
    }

    public function getSupportedLanguages(): array
    {
        $voices = $this->getAvailableVoices();
        $languages = [];
        
        foreach ($voices as $voice) {
            $langCode = $voice['language_code'];
            $langName = $voice['language_name'];
            
            if (!isset($languages[$langCode])) {
                $languages[$langCode] = $langName;
            }
            
            // Add additional language codes if available
            foreach ($voice['additional_language_codes'] as $additionalLang) {
                if (!isset($languages[$additionalLang])) {
                    $languages[$additionalLang] = $additionalLang; // Fallback to code if name not available
                }
            }
        }
        
        return $languages;
    }

    public function validateOptions(array $options): bool
    {
        // Validate output format
        if (isset($options['output_format'])) {
            $validFormats = ['mp3', 'wav', 'flac', 'alaw', 'ulaw', 'pcm', 'ogg'];
            if (!in_array(strtolower($options['output_format']), $validFormats)) {
                return false;
            }
        }

        // Validate voice ID (basic check)
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
        
        // Validate rate range
        if (isset($options['rate'])) {
            if (!is_numeric($options['rate']) || $options['rate'] < -50 || $options['rate'] > 50) {
                return false;
            }
        }
        
        // Validate pitch range
        if (isset($options['pitch'])) {
            if (!is_numeric($options['pitch']) || $options['pitch'] < -50 || $options['pitch'] > 50) {
                return false;
            }
        }
        
        // Validate variation range
        if (isset($options['variation'])) {
            if (!is_numeric($options['variation']) || $options['variation'] < 0 || $options['variation'] > 5) {
                return false;
            }
        }

        return true;
    }

    public function getMaxTextLength(): int
    {
        // Murf API doesn't specify a hard limit in the docs, but we'll use a reasonable limit
        return 50000; // 50k characters should be safe for most use cases
    }

    public function getServiceName(): string
    {
        return 'murf';
    }

    public function supportsSSML(): bool
    {
        return false;
    }

    /**
     * Get fallback voices when API is unavailable
     */
    protected function getFallbackVoices(): array
    {
        return [
            [
                'voice_id' => 'en-US-natalie',
                'name' => 'Natalie',
                'gender' => 'Female',
                'language_code' => 'en-US',
                'language_name' => 'English (US)',
                'accent' => 'American',
                'age' => 'Adult',
                'styles' => ['conversational', 'narration'],
                'sample_rate' => 44100,
                'additional_language_codes' => []
            ],
            [
                'voice_id' => 'en-US-marcus',
                'name' => 'Marcus',
                'gender' => 'Male',
                'language_code' => 'en-US',
                'language_name' => 'English (US)',
                'accent' => 'American',
                'age' => 'Adult',
                'styles' => ['conversational', 'narration'],
                'sample_rate' => 44100,
                'additional_language_codes' => []
            ]
        ];
    }
}