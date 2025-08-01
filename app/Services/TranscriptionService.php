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
        $maxRetries = 3;
        
        try {
            // Validate input file before processing
            if (!file_exists($fullPath)) {
                throw new \Exception("Input audio file does not exist: {$fullPath}");
            }
            
            if (!is_readable($fullPath)) {
                throw new \Exception("Input audio file is not readable: {$fullPath}");
            }
            
            // Create chunks with overlap
            for ($start = 0; $start < $duration; $start += ($chunkDuration - $overlapDuration)) {
                $actualDuration = min($chunkDuration, $duration - $start);
                
                $chunkCreated = false;
                $lastError = null;
                
                // Retry chunk creation up to maxRetries times
                for ($retry = 0; $retry < $maxRetries; $retry++) {
                    try {
                        $chunkPath = $this->createAudioChunk($fullPath, $start, $actualDuration);
                        $chunks[] = $chunkPath;
                        $this->tempFiles[] = $chunkPath;
                        $chunkCreated = true;
                        break;
                    } catch (\Exception $e) {
                        $lastError = $e;
                        
                        // Wait before retry (exponential backoff)
                        if ($retry < $maxRetries - 1) {
                            usleep(pow(2, $retry) * 100000); // 100ms, 200ms, 400ms
                        }
                    }
                }
                
                if (!$chunkCreated) {
                    throw new \Exception(
                        "Failed to create audio chunk after {$maxRetries} attempts. " .
                        "Start: {$start}s, Duration: {$actualDuration}s. " .
                        "Last error: " . ($lastError ? $lastError->getMessage() : 'Unknown error')
                    );
                }
            }
            
            // Transcribe each chunk with retry logic
            foreach ($chunks as $index => $chunkPath) {
                $transcribed = false;
                $lastError = null;
                
                for ($retry = 0; $retry < $maxRetries; $retry++) {
                    try {
                        // Verify chunk file still exists and is readable before transcription
                        if (!file_exists($chunkPath)) {
                            throw new \Exception("Chunk file no longer exists: {$chunkPath}");
                        }
                        
                        if (!is_readable($chunkPath)) {
                            throw new \Exception("Chunk file is not readable: {$chunkPath}");
                        }
                        
                        $result = $this->transcribeSingleFile($chunkPath, $language);
                        $transcriptions[] = $result['text'];
                        $transcribed = true;
                        break;
                    } catch (\Exception $e) {
                        $lastError = $e;
                        
                        // Wait before retry (exponential backoff)
                        if ($retry < $maxRetries - 1) {
                            sleep(pow(2, $retry)); // 1s, 2s, 4s
                        }
                    }
                }
                
                if (!$transcribed) {
                    throw new \Exception(
                        "Failed to transcribe chunk {$index} after {$maxRetries} attempts. " .
                        "Chunk path: {$chunkPath}. " .
                        "Last error: " . ($lastError ? $lastError->getMessage() : 'Unknown error')
                    );
                }
            }
            
            // Combine all transcriptions (remove overlap duplicates if needed)
            $combinedText = implode(' ', $transcriptions);
            
            // Basic cleanup of potential duplicate phrases at chunk boundaries
            $combinedText = $this->cleanupChunkOverlaps($combinedText);
            
            return [
                'text' => $combinedText,
                'duration' => $duration,
                'language' => $language ?? 'English',
                'chunks_processed' => count($chunks),
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
        // Validate input file exists and is readable
        if (!file_exists($inputPath)) {
            throw new \Exception("Input audio file does not exist: {$inputPath}");
        }
        
        if (!is_readable($inputPath)) {
            throw new \Exception("Input audio file is not readable: {$inputPath}");
        }
        
        // Get file size to ensure it's not empty
        $fileSize = filesize($inputPath);
        if ($fileSize === false || $fileSize === 0) {
            throw new \Exception("Input audio file is empty or unreadable: {$inputPath}");
        }
        
        $ffmpeg = config('app.ffmpeg_path') ?? config('app.ffmpeg_bin');
        
        // If ffmpeg is not configured, try to derive it from ffmpeg_bin
        if (!$ffmpeg || is_dir($ffmpeg)) {
            $ffmpegBin = config('app.ffmpeg_bin');
            if ($ffmpegBin && is_dir($ffmpegBin)) {
                $ffmpeg = rtrim($ffmpegBin, '\\/') . DIRECTORY_SEPARATOR . 'ffmpeg' . (PHP_OS_FAMILY === 'Windows' ? '.exe' : '');
            } else {
                $ffmpeg = $ffmpegBin ?? 'ffmpeg';
            }
        }
        
        // Create a more unique filename with timestamp to avoid collisions
        $uniqueId = uniqid('chunk_' . time() . '_', true);
        $chunkPath = storage_path('app' . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR . $uniqueId . '.flac');
        
        // Ensure the tmp directory exists with proper permissions
        $tmpDir = dirname($chunkPath);
        if (!is_dir($tmpDir)) {
            if (!mkdir($tmpDir, 0755, true)) {
                throw new \Exception("Failed to create temporary directory: {$tmpDir}");
            }
        }
        
        // Verify directory is writable
        if (!is_writable($tmpDir)) {
            throw new \Exception("Temporary directory is not writable: {$tmpDir}");
        }
        
        // Normalize paths for cross-platform compatibility
        $inputPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $inputPath);
        $chunkPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $chunkPath);
        
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
            '-avoid_negative_ts', 'make_zero', // Handle timestamp issues
            '-y',            // Overwrite output file
            $chunkPath
        ];
        
        $process = new Process($command);
        $process->setTimeout(600); // 10 minutes timeout
        
        try {
            $process->run();
        } catch (ProcessFailedException $e) {
            // Clean up partial file if it exists
            if (file_exists($chunkPath)) {
                unlink($chunkPath);
            }
            throw new \Exception('FFmpeg process failed: ' . $e->getMessage() . "\nCommand: " . implode(' ', $command));
        }
        
        if (!$process->isSuccessful()) {
            // Clean up partial file if it exists
            if (file_exists($chunkPath)) {
                unlink($chunkPath);
            }
            
            $errorOutput = $process->getErrorOutput();
            $output = $process->getOutput();
            
            throw new \Exception(
                "Failed to create audio chunk.\n" .
                "Command: " . implode(' ', $command) . "\n" .
                "Error: {$errorOutput}\n" .
                "Output: {$output}\n" .
                "Exit code: " . $process->getExitCode()
            );
        }
        
        // Wait a moment for file system to sync (especially on network storage)
        usleep(100000); // 100ms
        
        // Verify the chunk file was created and has content
        if (!file_exists($chunkPath)) {
            throw new \Exception("Audio chunk file was not created: {$chunkPath}");
        }
        
        $chunkSize = filesize($chunkPath);
        if ($chunkSize === false || $chunkSize === 0) {
            // Clean up empty file
            if (file_exists($chunkPath)) {
                unlink($chunkPath);
            }
            throw new \Exception("Audio chunk file is empty: {$chunkPath}");
        }
        
        // Verify the file is readable
        if (!is_readable($chunkPath)) {
            throw new \Exception("Audio chunk file is not readable: {$chunkPath}");
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
     * Clean up potential duplicate phrases at chunk boundaries
     */
    protected function cleanupChunkOverlaps(string $text): string
    {
        // Split into sentences for better overlap detection
        $sentences = preg_split('/[.!?]+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        
        if (count($sentences) <= 1) {
            return $text;
        }
        
        $cleanedSentences = [];
        $previousSentence = '';
        
        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            
            if (empty($sentence)) {
                continue;
            }
            
            // Check for similarity with previous sentence (potential overlap)
            if (!empty($previousSentence)) {
                $similarity = $this->calculateSimilarity($previousSentence, $sentence);
                
                // If sentences are very similar (>80%), skip this one as it's likely an overlap
                if ($similarity > 0.8) {
                    continue;
                }
            }
            
            $cleanedSentences[] = $sentence;
            $previousSentence = $sentence;
        }
        
        return implode('. ', $cleanedSentences) . '.';
    }
    
    /**
     * Calculate similarity between two strings using Levenshtein distance
     */
    protected function calculateSimilarity(string $str1, string $str2): float
    {
        $str1 = strtolower(trim($str1));
        $str2 = strtolower(trim($str2));
        
        if ($str1 === $str2) {
            return 1.0;
        }
        
        $maxLength = max(strlen($str1), strlen($str2));
        
        if ($maxLength === 0) {
            return 1.0;
        }
        
        $distance = levenshtein($str1, $str2);
        
        return 1.0 - ($distance / $maxLength);
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