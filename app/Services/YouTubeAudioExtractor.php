<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class YouTubeAudioExtractor
{
    private ?string $lastError = null;
    
    public function getLastError(): ?string
    {
        return $this->lastError;
    }
    
    public function extractAudio(string $youtubeUrl): ?UploadedFile
    {
        $videoId = Str::random(10);
        $outputPath = storage_path("app/tmp/{$videoId}.flac");

        if (!is_dir(storage_path('app/tmp'))) {
            mkdir(storage_path('app/tmp'), 0775, true);
        }

        $ytdlp = config('app.ytdlp_path');
        $ffmpeg = config('app.ffmpeg_bin');
        $cookiesPath = base_path('cookies.txt');

        // First, check available formats (try with cookies, then without)
        $availableFormats = $this->getAvailableFormats($youtubeUrl, $ytdlp, $cookiesPath);
        
        // If no formats found with cookies, try without cookies
        if (empty($availableFormats) && file_exists($cookiesPath)) {
            logger()->info('Retrying format detection without cookies', ['url' => $youtubeUrl]);
            $availableFormats = $this->getAvailableFormats($youtubeUrl, $ytdlp, null);
        }
        if (empty($availableFormats)) {
            $this->lastError = 'No audio/video formats available for YouTube video. Video may be restricted, unavailable, or only contains images/storyboards.';
            logger()->error('No audio/video formats available for YouTube video', [
                'url' => $youtubeUrl,
                'reason' => 'Video may be restricted, unavailable, or only contains images/storyboards'
            ]);
            return null;
        }

        // Try multiple format strategies based on available formats
        $formatStrategies = $this->buildFormatStrategies($availableFormats);

        foreach ($formatStrategies as $format) {
            $command = [
                $ytdlp,
                '--extract-audio',
                '--audio-format', 'flac',
                '--no-playlist',
                '--ffmpeg-location', $ffmpeg,
                '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1 -map 0:a -c:a flac',
            ];
            
            // Add cookies only if file exists
            if (file_exists($cookiesPath)) {
                $command[] = '--cookies';
                $command[] = $cookiesPath;
            }
            
            $command = array_merge($command, [
                '--format', $format,
                '--ignore-errors',
                '--no-warnings',
                '--extractor-retries', '3',
                '--fragment-retries', '3',
                '-o', $outputPath,
                $youtubeUrl,
            ]);

            $result = $this->tryExtraction($command, $outputPath, $youtubeUrl, $videoId);
            if ($result !== null) {
                return $result;
            }
        }

        // Log final failure after all attempts
        if (!$this->lastError) {
            $this->lastError = 'YouTube audio extraction failed after all format attempts. Available formats: ' . implode(', ', $availableFormats);
        }
        logger()->error('YouTube audio extraction failed after all attempts', [
            'url' => $youtubeUrl,
            'attempted_formats' => $formatStrategies,
            'available_formats' => $availableFormats
        ]);

        return null;
    }

    private function getAvailableFormats(string $youtubeUrl, string $ytdlp, ?string $cookiesPath): array
    {
        $command = [
            $ytdlp,
            '--list-formats',
            '--no-playlist',
        ];
        
        // Add cookies only if path is provided and file exists
        if ($cookiesPath && file_exists($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
        }
        
        $command[] = $youtubeUrl;

        $process = new Process($command);
        $process->setTimeout(60); // Short timeout for format listing
        
        try {
            $process->mustRun();
            $output = $process->getOutput();
            $errorOutput = $process->getErrorOutput();
            
            // Check if only images are available
            if (strpos($errorOutput, 'Only images are available for download') !== false) {
                $this->lastError = 'Only images/storyboards are available for download - video may be restricted or unavailable';
                logger()->error('YouTube video has no audio/video streams available', [
                    'url' => $youtubeUrl,
                    'reason' => 'Only images/storyboards available - video may be restricted or unavailable'
                ]);
                return [];
            }
            
            // Parse available formats from output
            $formats = [];
            $lines = explode("\n", $output);
            
            foreach ($lines as $line) {
                // Look for audio formats (contains 'audio only' or has audio codec)
                if (preg_match('/^(\d+)\s+.*?(audio only|m4a|webm|mp4).*?(audio only|\d+k)/i', trim($line), $matches)) {
                    $formatId = $matches[1];
                    $formats[] = $formatId;
                }
            }
            
            return array_unique($formats);
        } catch (\Exception $e) {
            $this->lastError = 'Failed to get available formats: ' . $e->getMessage();
            logger()->warning('Failed to get available formats', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    private function buildFormatStrategies(array $availableFormats): array
    {
        $strategies = [];
        
        // If we have specific format IDs, use them
        if (!empty($availableFormats)) {
            // Try best audio format first
            $strategies[] = 'bestaudio';
            
            // Try specific format IDs
            foreach (array_slice($availableFormats, 0, 3) as $formatId) {
                $strategies[] = $formatId;
            }
        }
        
        // Fallback strategies
        $strategies = array_merge($strategies, [
            'best[height<=720]',
            'best[height<=480]',
            'worst'
        ]);
        
        return array_unique($strategies);
    }

    private function tryExtraction(array $command, string $outputPath, string $youtubeUrl, string $videoId): ?UploadedFile
    {


        $process = new Process($command);
        $process->setTimeout(config('app.ytdlp_timeout', 600));
        $process->setIdleTimeout(config('app.ytdlp_idle_timeout', 120));
        
        try {
            $process->mustRun();

            if (file_exists($outputPath)) {
                return new UploadedFile(
                    $outputPath,
                    "{$videoId}.flac",
                    'audio/flac',
                    null,
                    true // Mark it as test mode (i.e. skip file validity check)
                );
            }

            return null;
        } catch (ProcessFailedException $e) {
            $errorOutput = $process->getErrorOutput();
            $output = $process->getOutput();
            $exitCode = $process->getExitCode();
            
            // Capture detailed yt-dlp error for later use
            $this->lastError = "yt-dlp extraction failed (exit code: {$exitCode}). Error: " . trim($errorOutput ?: $e->getMessage());
            
            logger()->warning('YouTube audio extraction attempt failed', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage(),
                'output' => $output,
                'error_output' => $errorOutput,
                'exit_code' => $exitCode,
                'command' => implode(' ', $command)
            ]);
            return null;
        } catch (\Exception $e) {
            $this->lastError = "yt-dlp extraction exception: " . $e->getMessage();
            logger()->warning('YouTube audio extraction attempt exception', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage(),
                'command' => implode(' ', $command)
            ]);
            return null;
        }
    }
}