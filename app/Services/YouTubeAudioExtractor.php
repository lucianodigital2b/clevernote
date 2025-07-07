<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class YouTubeAudioExtractor
{
    private ?string $lastError = null;
    private array $proxyConfig = [];
    
    public function getLastError(): ?string
    {
        return $this->lastError;
    }
    
    /**
     * Configure Decodo proxy settings
     */
    private function configureDecodoProxy(): array
    {
        if (empty($this->proxyConfig)) {
            $this->proxyConfig = [
                'proxy' => config('app.decodo_proxy.host') . ':' . config('app.decodo_proxy.port'),
                'user' => config('app.decodo_proxy.user'),
                'password' => config('app.decodo_proxy.password')
            ];
        }
        
        return $this->proxyConfig;
    }
    
    /**
     * Test proxy connection
     */
    public function testProxyConnection(): bool
    {
        $proxyConfig = $this->configureDecodoProxy();
        
        try {
            $ch = curl_init('http://ip.decodo.com/json');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_PROXY, $proxyConfig['proxy']);
            curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxyConfig['user'] . ':' . $proxyConfig['password']);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($response !== false && $httpCode === 200) {
                logger()->info('Decodo proxy connection successful', [
                    'proxy' => $proxyConfig['proxy'],
                    'response' => $response
                ]);
                return true;
            } else {
                logger()->error('Decodo proxy connection failed', [
                    'proxy' => $proxyConfig['proxy'],
                    'http_code' => $httpCode,
                    'error' => $error
                ]);
                return false;
            }
        } catch (\Exception $e) {
            logger()->error('Decodo proxy test exception', [
                'proxy' => $proxyConfig['proxy'],
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Add proxy options to yt-dlp command
     */
    private function addProxyToCommand(array $command): array
    {
        // Check if proxy is enabled
        if (!config('app.decodo_proxy.enabled', true)) {
            logger()->info('Decodo proxy is disabled via configuration');
            return $command;
        }
        
        $proxyConfig = $this->configureDecodoProxy();
        
        if (!empty($proxyConfig['proxy']) && !empty($proxyConfig['user']) && !empty($proxyConfig['password'])) {
            $command[] = '--proxy';
            $command[] = "http://{$proxyConfig['user']}:{$proxyConfig['password']}@{$proxyConfig['proxy']}";
            
            logger()->info('Using Decodo proxy for yt-dlp', [
                'proxy' => $proxyConfig['proxy'],
                'user' => $proxyConfig['user']
            ]);
        } else {
            logger()->warning('Decodo proxy configuration incomplete, skipping proxy usage', [
                'has_proxy' => !empty($proxyConfig['proxy']),
                'has_user' => !empty($proxyConfig['user']),
                'has_password' => !empty($proxyConfig['password'])
            ]);
        }
        
        return $command;
    }
    
    /**
     * Validate and normalize YouTube URL
     */
    private function validateAndNormalizeUrl(string $url): ?string
    {
        // Add protocol if missing
        if (!preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . $url;
        }
        
        // Validate YouTube URL pattern
        $patterns = [
            '/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/',
            '/^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/',
            '/^https?:\/\/(www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url)) {
                logger()->info('YouTube URL validated and normalized', ['original' => func_get_args()[0], 'normalized' => $url]);
                return $url;
            }
        }
        
        logger()->error('Invalid YouTube URL format', ['url' => $url]);
        return null;
    }
    
    /**
     * Debug cookie file status for troubleshooting
     */
    private function debugCookieFile(string $cookiesPath): void
    {
        $status = [
            'path' => $cookiesPath,
            'exists' => file_exists($cookiesPath),
            'readable' => file_exists($cookiesPath) ? is_readable($cookiesPath) : false,
            'writable' => file_exists($cookiesPath) ? is_writable($cookiesPath) : false,
            'size' => file_exists($cookiesPath) ? filesize($cookiesPath) : 0,
            'modified' => file_exists($cookiesPath) ? date('Y-m-d H:i:s', filemtime($cookiesPath)) : null,
        ];
        
        if (file_exists($cookiesPath)) {
            $permissions = substr(sprintf('%o', fileperms($cookiesPath)), -4);
            $status['permissions'] = $permissions;
        }
        
        logger()->info('Cookie file status', $status);
    }
    
    public function extractAudio(string $youtubeUrl): ?UploadedFile
    {
        // Validate and normalize URL
        $youtubeUrl = $this->validateAndNormalizeUrl($youtubeUrl);
        if (!$youtubeUrl) {
            $this->lastError = 'Invalid YouTube URL provided';
            return null;
        }

        $videoId = Str::random(10);
        $outputPath = storage_path("app/tmp/{$videoId}.flac");

        if (!is_dir(storage_path('app/tmp'))) {
            mkdir(storage_path('app/tmp'), 0775, true);
        }

        $ytdlp = config('app.ytdlp_path');
        $ffmpeg = config('app.ffmpeg_bin');
        $cookiesPath = base_path('cookies.txt');
        
        // Debug cookie file status
        $this->debugCookieFile($cookiesPath);

        // First, check available formats (try with cookies if available, then without)
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
        $useCookies = $cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath);

        foreach ($formatStrategies as $format) {
            // First attempt: with cookies if available
            if ($useCookies) {
                $result = $this->attemptExtractionWithFormat($format, $ytdlp, $ffmpeg, $outputPath, $youtubeUrl, $videoId, $cookiesPath);
                if ($result !== null) {
                    return $result;
                }
                
                // Check if the error was cookie-related permission issue
                if ($this->lastError && strpos($this->lastError, 'Permission denied') !== false && strpos($this->lastError, 'cookies') !== false) {
                    logger()->info('Cookie permission error detected, retrying without cookies', [
                        'url' => $youtubeUrl,
                        'format' => $format,
                        'error' => $this->lastError
                    ]);
                    
                    // Second attempt: without cookies
                    $result = $this->attemptExtractionWithFormat($format, $ytdlp, $ffmpeg, $outputPath, $youtubeUrl, $videoId, null);
                    if ($result !== null) {
                        return $result;
                    }
                }
            } else {
                // Direct attempt without cookies
                $result = $this->attemptExtractionWithFormat($format, $ytdlp, $ffmpeg, $outputPath, $youtubeUrl, $videoId, null);
                if ($result !== null) {
                    return $result;
                }
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
            '--no-cache-dir', // Disable cache to avoid permission issues
        ];
        
        // Add cookies and additional authentication options
        if ($cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
            $command[] = '--no-cookies-from-browser'; // Prevent yt-dlp from trying to save cookies back
        }
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        
        // Add proxy configuration
        $command = $this->addProxyToCommand($command);
        
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
            $errorMessage = $e->getMessage();
            
            // Check for specific bot detection error
            if (strpos($errorMessage, 'Sign in to confirm you\'re not a bot') !== false) {
                $this->lastError = 'YouTube bot detection triggered. This may indicate that cookies are expired or invalid. Please update the cookies file.';
                logger()->error('YouTube bot detection triggered', [
                    'url' => $youtubeUrl,
                    'error' => $errorMessage,
                    'suggestion' => 'Update cookies file or try again later'
                ]);
            } else {
                $this->lastError = 'Failed to get available formats: ' . $errorMessage;
                logger()->warning('Failed to get available formats', [
                    'url' => $youtubeUrl,
                    'error' => $errorMessage
                ]);
            }
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
    
    /**
     * Attempt extraction with a specific format, with or without cookies
     */
    private function attemptExtractionWithFormat(string $format, string $ytdlp, string $ffmpeg, string $outputPath, string $youtubeUrl, string $videoId, ?string $cookiesPath): ?UploadedFile
    {
        $command = [
            $ytdlp,
            '--extract-audio',
            '--audio-format', 'flac',
            '--no-playlist',
            '--no-cache-dir', // Disable cache to avoid permission issues
            '--ffmpeg-location', $ffmpeg,
            '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1 -map 0:a -c:a flac',
        ];
        
        // Add cookies and additional authentication options
        if ($cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
            $command[] = '--no-cookies-from-browser'; // Prevent yt-dlp from trying to save cookies back
            logger()->info('Using cookies for YouTube extraction', ['cookies_path' => $cookiesPath, 'format' => $format]);
        } else {
            logger()->info('Extracting without cookies', [
                'format' => $format,
                'cookies_path' => $cookiesPath,
                'reason' => $cookiesPath ? 'Cookie file not accessible' : 'No cookies provided'
            ]);
        }
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        
        // Add proxy configuration
        $command = $this->addProxyToCommand($command);
        
        $command = array_merge($command, [
            '--format', $format,
            '--ignore-errors',
            '--no-warnings',
            '--extractor-retries', '3',
            '--fragment-retries', '3',
            '-o', $outputPath,
            $youtubeUrl,
        ]);

        return $this->tryExtraction($command, $outputPath, $youtubeUrl, $videoId);
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
            
            // Check for specific errors
            if (strpos($errorOutput, 'Sign in to confirm you\'re not a bot') !== false) {
                $this->lastError = "YouTube bot detection triggered during extraction. This may indicate that cookies are expired or invalid. Please update the cookies file.";
                logger()->error('YouTube bot detection triggered during extraction', [
                    'url' => $youtubeUrl,
                    'error' => $e->getMessage(),
                    'error_output' => $errorOutput,
                    'exit_code' => $exitCode,
                    'suggestion' => 'Update cookies file or try again later'
                ]);
            } elseif (strpos($errorOutput, 'Permission denied') !== false && strpos($errorOutput, 'cookies.txt') !== false) {
                $this->lastError = "Permission denied when accessing cookies file. Please check file permissions for cookies.txt.";
                logger()->error('Cookie file permission error during extraction', [
                    'url' => $youtubeUrl,
                    'error' => $e->getMessage(),
                    'error_output' => $errorOutput,
                    'exit_code' => $exitCode,
                    'suggestion' => 'Check cookies.txt file permissions'
                ]);
            } else {
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
            }
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