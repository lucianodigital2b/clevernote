<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class TranscriptionService
{
    protected $apiKey;
    protected $apiEndpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';
    protected $tempFiles = [];

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
    }

    /**
     * Handle audio file upload and transcription
     */
    public function transcribeAudio($fullPath, ?string $language = null): array
    {
        try {
            if (!$this->apiKey) {
                throw new \Exception('Groq API key is not configured. Please check your environment settings.');
            }

            // Get audio duration
            $duration = $this->getAudioDuration($fullPath);
            
            // If duration is longer than 15 minutes (900 seconds), chunk the audio
            if ($duration > 900) {
                return $this->transcribeChunkedAudio($fullPath, $language, $duration);
            }
            
            // For shorter files, use the original method
            return $this->transcribeSingleFile($fullPath, $language);
            
        } catch (\Exception $e) {
            // // $this->cleanupTempFiles();
            throw $e;
        }
    }

    /**
     * Get audio duration using ffprobe
     */
    protected function getAudioDuration($filePath): float
    {
        $ffmpeg = config('app.ffmpeg_path') ?? config('app.ffmpeg_bin');
        $ffprobe = config('app.ffprobe_bin') ?? config('app.ffmpeg_probe_path');
        
        // If ffprobe is not configured, try to derive it from ffmpeg path
        if (!$ffprobe && $ffmpeg) {
            // Handle both .exe and non-.exe cases
            if (str_ends_with(strtolower($ffmpeg), '.exe')) {
                $ffprobe = str_replace('ffmpeg.exe', 'ffprobe.exe', $ffmpeg);
            } else {
                // If ffmpeg is a directory path, append the executable
                if (is_dir($ffmpeg)) {
                    $ffprobe = rtrim($ffmpeg, '\\/') . '\\ffprobe.exe';
                } else {
                    $ffprobe = str_replace('ffmpeg', 'ffprobe', $ffmpeg);
                }
            }
        }
        
        // If still no ffprobe, try common locations or just use 'ffprobe'
        if (!$ffprobe) {
            $ffprobe = 'ffprobe'; // Assume it's in PATH
        }
        
        $command = [
            $ffprobe,
            '-v', 'quiet',
            '-show_entries', 'format=duration',
            '-of', 'csv=p=0',
            $filePath
        ];
        
        $process = new Process($command);
        $process->run();
        
        if (!$process->isSuccessful()) {
            throw new \Exception('Failed to get audio duration: ' . $process->getErrorOutput());
        }
        
        return (float) trim($process->getOutput());
    }

    /**
     * Transcribe audio by chunking it into 10-minute segments with overlap
     */
    protected function transcribeChunkedAudio($fullPath, ?string $language, float $duration): array
    {
        $chunkDuration = 600; // 10 minutes in seconds (recommended by Groq)
        $overlapDuration = 10; // 10 seconds overlap to prevent word cutting
        $chunks = [];
        $transcriptions = [];
        
        try {
            // Create chunks with overlap
            for ($start = 0; $start < $duration; $start += ($chunkDuration - $overlapDuration)) {
                $actualDuration = min($chunkDuration, $duration - $start);
                $chunkPath = $this->createAudioChunk($fullPath, $start, $actualDuration);
                $chunks[] = $chunkPath;
                $this->tempFiles[] = $chunkPath;
            }
            
            // Transcribe each chunk
            foreach ($chunks as $chunkPath) {
                $result = $this->transcribeSingleFile($chunkPath, $language);
                $transcriptions[] = $result['text'];
            }
            
            // Combine all transcriptions (remove overlap duplicates if needed)
            $combinedText = implode(' ', $transcriptions);
            
            return [
                'text' => $combinedText,
                'duration' => $duration,
                'language' => $language ?? 'English',
            ];
            
        } finally {
            $this->cleanupTempFiles();
        }
    }

    /**
     * Create an audio chunk using ffmpeg with Groq-optimized settings
     */
    protected function createAudioChunk($inputPath, $start, $duration): string
    {
        $ffmpeg = config('app.ffmpeg_path') ?? config('app.ffmpeg_bin');
        
        // If ffmpeg is not configured, try to derive it from ffmpeg_bin
        if (!$ffmpeg || is_dir($ffmpeg)) {
            $ffmpegBin = config('app.ffmpeg_bin');
            if ($ffmpegBin && is_dir($ffmpegBin)) {
                $ffmpeg = rtrim($ffmpegBin, '\\/') . '\\ffmpeg.exe';
            } else {
                $ffmpeg = $ffmpegBin ?? 'ffmpeg';
            }
        }
        
        $chunkPath = storage_path('app/tmp/chunk_' . uniqid() . '.flac');
        
        // Ensure the tmp directory exists
        $tmpDir = dirname($chunkPath);
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }
        
        // Groq-optimized ffmpeg command: 16kHz mono FLAC
        $command = [
            $ffmpeg,
            '-i', $inputPath,
            '-ss', (string)$start,
            '-t', (string)$duration,
            '-ar', '16000',  // 16kHz sample rate (Groq recommendation)
            '-ac', '1',      // Mono channel
            '-map', '0:a',   // Map only audio
            '-c:a', 'flac',  // FLAC codec for lossless compression
            '-y',            // Overwrite output file
            $chunkPath
        ];
        
        $process = new Process($command);
        $process->setTimeout(600); // 10 minutes timeout
        $process->run();
        
        if (!$process->isSuccessful()) {
            throw new \Exception('Failed to create audio chunk: ' . $process->getErrorOutput());
        }
        
        // Verify the chunk file was created and has content
        if (!file_exists($chunkPath) || filesize($chunkPath) === 0) {
            throw new \Exception('Audio chunk file was not created or is empty');
        }
        
        return $chunkPath;
    }

    /**
     * Transcribe a single audio file
     */
    protected function transcribeSingleFile($fullPath, ?string $language = null): array
    {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $this->apiEndpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);

        $postFields = [
            "file" => new \CURLFile($fullPath),
            "model" => "whisper-large-v3-turbo",
            "temperature" => "0",
            "response_format" => "verbose_json",
        ];

        if($language != 'autodetect' && $language !== null) {
            $postFields['language'] = $language;
        }

        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $this->apiKey"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        // Handle cURL errors
        if ($curlError) {
            throw new \Exception('cURL error: ' . $curlError);
        }

        $result = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMessage = 'Failed to transcribe audio';
            if ($result && isset($result['error']['message'])) {
                $errorMessage .= ': ' . $result['error']['message'];
            } else {
                $errorMessage .= ': HTTP ' . $httpCode . ' - ' . ($response ?: 'Unknown error');
            }
            throw new \Exception($errorMessage);
        }

        // Validate response structure
        if (!$result || !is_array($result)) {
            throw new \Exception('Invalid response format from Groq API');
        }

        return [
            'text' => $result['text'] ?? '',
            'duration' => $result['duration'] ?? null,
            'language' => $result['language'] ?? 'English',
        ];
    }

    /**
     * Clean up temporary files
     */
    protected function cleanupTempFiles(): void
    {
        foreach ($this->tempFiles as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
        $this->tempFiles = [];
    }

    /**
     * Clean up on destruction
     */
    public function __destruct()
    {
        $this->cleanupTempFiles();
    }


    /**
     * Extract YouTube video ID from URL
     */
    protected function extractYoutubeId(string $url): ?string
    {
        $pattern = '%(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})%';
        preg_match($pattern, $url, $matches);
        return $matches[1] ?? null;
    }
}