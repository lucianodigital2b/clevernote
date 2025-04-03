<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class TranscriptionService
{
    protected $apiKey;
    protected $apiEndpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';


    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
    }

    /**
     * Handle audio file upload and transcription
     */
    public function transcribeAudio(UploadedFile $file): array
    {
        // Store the file temporarily
        $path = $file->store('temp/audio', 'local');
        $fullPath = Storage::path($path);

        try {

            if (!$this->apiKey) {
                throw new \Exception('Groq API key is not configured. Please check your environment settings.');
            }

            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, "https://api.groq.com/openai/v1/audio/transcriptions");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);

            $postFields = [
                "file" => new \CURLFile($fullPath),
                "model" => "whisper-large-v3-turbo",
                "temperature" => "0",
                "response_format" => "verbose_json",
                "language" => "en"
            ];

            curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $this->apiKey"
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);


            $result = json_decode($response);

            if ($httpCode !== 200) {
                throw new \Exception('Failed to transcribe audio: ' . ($result->error->message ?? 'Unknown error'));
            }
            
            Storage::delete($path);


            return [
                'text' => $result['transcription'] ?? '',
                'duration' => $result['duration'] ?? null,
                'language' => $result['language'] ?? 'en',
            ];
        } catch (\Exception $e) {
            // Clean up on error
            Storage::delete($path);
            throw $e;
        }
    }
}