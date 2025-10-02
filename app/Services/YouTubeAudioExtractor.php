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
     * Get video metadata with cookies as fallback
     */
    private function getVideoMetadataWithCookies(string $youtubeUrl): ?array
    {
        $ytdlp = config('app.ytdlp_path');

        $command = [
            $ytdlp,
            '--dump-json',
            '--no-playlist',
            '--no-cache-dir',
        ];

        // Add cookies if available, fallback to browser cookies
        $cookiesPath = config('app.ytdlp_cookies_path', base_path('app/cookies.txt'));
        if ($cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
            logger()->info('Using static cookies file for metadata fallback', ['cookies_path' => $cookiesPath]);
        } else {
            // Fallback to browser cookies if static file not available
            $command[] = '--cookies-from-browser';
            $command[] = 'chrome';
            logger()->info('Using browser cookies for metadata fallback', ['browser' => 'chrome']);
        }

        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';

        // Add proxy configuration
        $command = $this->addProxyToCommand($command);

        $command[] = $youtubeUrl;

        $process = new Process($command);
        $process->setTimeout(60);

        try {
            $process->mustRun();
            $output = $process->getOutput();
            
            $metadata = json_decode($output, true);
            
            if (!$metadata) {
                logger()->warning('Failed to parse video metadata JSON with cookies', [
                    'url' => $youtubeUrl,
                    'output' => substr($output, 0, 500)
                ]);
                return null;
            }

            // Extract and format relevant metadata
            $formattedMetadata = [
                'video_id' => $metadata['id'] ?? null,
                'title' => $metadata['title'] ?? null,
                'description' => $metadata['description'] ?? null,
                'duration' => $metadata['duration'] ?? null,
                'thumbnail' => $metadata['thumbnail'] ?? null,
                'channel' => $metadata['uploader'] ?? $metadata['channel'] ?? null,
                'channel_id' => $metadata['uploader_id'] ?? $metadata['channel_id'] ?? null,
                'upload_date' => $metadata['upload_date'] ?? null,
                'view_count' => $metadata['view_count'] ?? null,
                'like_count' => $metadata['like_count'] ?? null,
                'comment_count' => $metadata['comment_count'] ?? null,
                'tags' => $metadata['tags'] ?? [],
                'categories' => $metadata['categories'] ?? [],
                'webpage_url' => $metadata['webpage_url'] ?? $youtubeUrl,
            ];

            // Format upload_date if available
            if ($formattedMetadata['upload_date']) {
                try {
                    $date = \DateTime::createFromFormat('Ymd', $formattedMetadata['upload_date']);
                    if ($date) {
                        $formattedMetadata['upload_date'] = $date->format('Y-m-d');
                    }
                } catch (\Exception $e) {
                    // Keep original format if parsing fails
                }
            }

            logger()->info('Successfully extracted video metadata with cookies', [
                'url' => $youtubeUrl,
                'title' => $formattedMetadata['title'],
                'duration' => $formattedMetadata['duration'],
                'channel' => $formattedMetadata['channel']
            ]);

            return $formattedMetadata;

        } catch (\Exception $e) {
            logger()->error('Failed to extract video metadata even with cookies', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage(),
                'command' => implode(' ', $command)
            ]);
            return null;
        }
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
     * Get available formats with cookies as fallback
     */
    private function getAvailableFormatsWithCookies(string $youtubeUrl, string $ytdlp): array
    {
        $command = [
            $ytdlp,
            '--list-formats',
            '--no-playlist',
            '--no-cache-dir',
        ];
        
        // Add cookies if available, fallback to browser cookies
        $cookiesPath = config('app.ytdlp_cookies_path', base_path('app/cookies.txt'));
        if ($cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
            logger()->info('Using static cookies file for formats fallback', ['cookies_path' => $cookiesPath]);
        } else {
            // Fallback to browser cookies if static file not available
            $command[] = '--cookies-from-browser';
            $command[] = 'chrome';
            logger()->info('Using browser cookies for formats fallback', ['browser' => 'chrome']);
        }
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';
        
        // Add proxy configuration
        $command = $this->addProxyToCommand($command);
        
        $command[] = $youtubeUrl;

        $process = new Process($command);
        $process->setTimeout(60);
        
        try {
            $process->mustRun();
            $output = $process->getOutput();
            $errorOutput = $process->getErrorOutput();
            
            // Check if only images are available
            if (strpos($errorOutput, 'Only images are available for download') !== false) {
                logger()->error('YouTube video has no audio/video streams available with cookies', [
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
            
            logger()->info('Successfully extracted formats with cookies', [
                'url' => $youtubeUrl,
                'formats_count' => count($formats)
            ]);
            
            return array_unique($formats);
        } catch (\Exception $e) {
            logger()->error('Failed to get available formats even with cookies', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get video metadata from YouTube URL
     */
    public function getVideoMetadata(string $youtubeUrl): ?array
    {
        // Validate and normalize URL
        $youtubeUrl = $this->validateAndNormalizeUrl($youtubeUrl);
        if (!$youtubeUrl) {
            return null;
        }

        $ytdlp = config('app.ytdlp_path');
        $cookiesPath = base_path('cookies.txt');

        $command = [
            $ytdlp,
            '--dump-json',
            '--no-playlist',
            '--no-cache-dir',
        ];

        // Try without cookies first - cookies will be added as fallback if needed
        logger()->info('Attempting metadata extraction without cookies first', ['url' => $youtubeUrl]);

        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';

        // Add proxy configuration
        $command = $this->addProxyToCommand($command);

        $command[] = $youtubeUrl;

        $process = new Process($command);
        $process->setTimeout(60); // Short timeout for metadata extraction

        try {
            $process->mustRun();
            $output = $process->getOutput();
            
            $metadata = json_decode($output, true);
            
            if (!$metadata) {
                logger()->warning('Failed to parse video metadata JSON', [
                    'url' => $youtubeUrl,
                    'output' => substr($output, 0, 500)
                ]);
                return null;
            }

            // Extract and format relevant metadata
            $formattedMetadata = [
                'video_id' => $metadata['id'] ?? null,
                'title' => $metadata['title'] ?? null,
                'description' => $metadata['description'] ?? null,
                'duration' => $metadata['duration'] ?? null,
                'thumbnail' => $metadata['thumbnail'] ?? null,
                'channel' => $metadata['uploader'] ?? $metadata['channel'] ?? null,
                'channel_id' => $metadata['uploader_id'] ?? $metadata['channel_id'] ?? null,
                'upload_date' => $metadata['upload_date'] ?? null,
                'view_count' => $metadata['view_count'] ?? null,
                'like_count' => $metadata['like_count'] ?? null,
                'comment_count' => $metadata['comment_count'] ?? null,
                'tags' => $metadata['tags'] ?? [],
                'categories' => $metadata['categories'] ?? [],
                'webpage_url' => $metadata['webpage_url'] ?? $youtubeUrl,
            ];

            // Format upload_date if available
            if ($formattedMetadata['upload_date']) {
                try {
                    $date = \DateTime::createFromFormat('Ymd', $formattedMetadata['upload_date']);
                    if ($date) {
                        $formattedMetadata['upload_date'] = $date->format('Y-m-d');
                    }
                } catch (\Exception $e) {
                    // Keep original format if parsing fails
                }
            }

            logger()->info('Successfully extracted video metadata', [
                'url' => $youtubeUrl,
                'title' => $formattedMetadata['title'],
                'duration' => $formattedMetadata['duration'],
                'channel' => $formattedMetadata['channel']
            ]);

            return $formattedMetadata;

        } catch (\Exception $e) {
            logger()->warning('Failed to extract video metadata without cookies, trying with cookies', [
                'url' => $youtubeUrl,
                'error' => $e->getMessage()
            ]);
            
            // Retry with cookies as fallback
            return $this->getVideoMetadataWithCookies($youtubeUrl);
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
        
        // Try without cookies first - cookies will be added as fallback if needed
        logger()->info('Attempting format extraction without cookies first', ['url' => $youtubeUrl]);
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';
        
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
            
            // First try with cookies as fallback
            logger()->warning('Failed to get available formats without cookies, trying with cookies', [
                'url' => $youtubeUrl,
                'error' => $errorMessage
            ]);
            
            $formatsWithCookies = $this->getAvailableFormatsWithCookies($youtubeUrl, $ytdlp);
            if (!empty($formatsWithCookies)) {
                return $formatsWithCookies;
            }
            
            // Check for specific bot detection error
            if (strpos($errorMessage, 'Sign in to confirm you\'re not a bot') !== false) {
                // Try alternative extraction methods when bot detection is triggered
                logger()->warning('YouTube bot detection triggered, trying alternative methods', [
                    'url' => $youtubeUrl,
                    'error' => $errorMessage
                ]);
                
                // Try with different user agents and additional bypass options
                return $this->tryAlternativeFormatExtraction($youtubeUrl, $ytdlp);
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

    /**
     * Try alternative format extraction methods when bot detection is triggered
     */
    private function tryAlternativeFormatExtraction(string $youtubeUrl, string $ytdlp): array
    {
        $alternativeUserAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];

        foreach ($alternativeUserAgents as $userAgent) {
            logger()->info('Trying alternative user agent for format extraction', [
                'url' => $youtubeUrl,
                'user_agent' => substr($userAgent, 0, 50) . '...'
            ]);

            $command = [
                $ytdlp,
                '--list-formats',
                '--no-playlist',
                '--no-cache-dir',
                '--user-agent', $userAgent,
                '--sleep-interval', '2',
                '--max-sleep-interval', '10',
                '--extractor-retries', '3',
                '--fragment-retries', '5',
                '--retry-sleep', 'exp=1:5:30',
                '--no-check-certificate',
                '--prefer-free-formats',
                '--ignore-errors',
                '--no-warnings',
                $youtubeUrl
            ];

            // Add proxy configuration
            $command = $this->addProxyToCommand($command);

            $process = new Process($command);
            $process->setTimeout(90);

            try {
                $process->mustRun();
                $output = $process->getOutput();
                
                // Parse available formats from output
                $formats = [];
                $lines = explode("\n", $output);
                
                foreach ($lines as $line) {
                    if (preg_match('/^(\d+)\s+.*?(audio only|m4a|webm|mp4).*?(audio only|\d+k)/i', trim($line), $matches)) {
                        $formatId = $matches[1];
                        $formats[] = $formatId;
                    }
                }
                
                if (!empty($formats)) {
                    logger()->info('Successfully extracted formats with alternative user agent', [
                        'url' => $youtubeUrl,
                        'user_agent' => substr($userAgent, 0, 50) . '...',
                        'formats_found' => count($formats)
                    ]);
                    return array_unique($formats);
                }
            } catch (\Exception $e) {
                logger()->debug('Alternative user agent failed', [
                    'url' => $youtubeUrl,
                    'user_agent' => substr($userAgent, 0, 50) . '...',
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        // If all alternative methods fail, return default formats to try
        logger()->warning('All alternative format extraction methods failed, using default fallback formats', [
            'url' => $youtubeUrl
        ]);
        
        return ['bestaudio', 'best[height<=720]', 'best[height<=480]', 'worst'];
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
        // First attempt: without cookies
        $result = $this->tryExtractionWithoutCookies($format, $ytdlp, $ffmpeg, $outputPath, $youtubeUrl, $videoId);
        if ($result !== null) {
            return $result;
        }
        
        // Second attempt: with cookies if available
        logger()->info('Extraction without cookies failed, trying with cookies', [
            'url' => $youtubeUrl, 
            'format' => $format
        ]);
        
        return $this->tryExtractionWithCookies($format, $ytdlp, $ffmpeg, $outputPath, $youtubeUrl, $videoId);
    }
    
    private function tryExtractionWithoutCookies(string $format, string $ytdlp, string $ffmpeg, string $outputPath, string $youtubeUrl, string $videoId): ?UploadedFile
    {
        $command = [
            $ytdlp,
            '--extract-audio',
            '--audio-format', 'flac',
            '--no-playlist',
            '--no-cache-dir',
            '--ffmpeg-location', $ffmpeg,
            '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1 -map 0:a -c:a flac',
        ];
        
        logger()->info('Attempting extraction without cookies', ['url' => $youtubeUrl, 'format' => $format]);
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';
        
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
    
    private function tryExtractionWithCookies(string $format, string $ytdlp, string $ffmpeg, string $outputPath, string $youtubeUrl, string $videoId): ?UploadedFile
    {
        $command = [
            $ytdlp,
            '--extract-audio',
            '--audio-format', 'flac',
            '--no-playlist',
            '--no-cache-dir',
            '--ffmpeg-location', $ffmpeg,
            '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1 -map 0:a -c:a flac',
        ];
        
        // Add cookies if available, fallback to browser cookies
        $cookiesPath = config('app.ytdlp_cookies_path', base_path('app/cookies.txt'));
        if ($cookiesPath && file_exists($cookiesPath) && is_readable($cookiesPath)) {
            $command[] = '--cookies';
            $command[] = $cookiesPath;
            logger()->info('Using static cookies file for extraction fallback', ['cookies_path' => $cookiesPath]);
        } else {
            // Fallback to browser cookies if static file not available
            $command[] = '--cookies-from-browser';
            $command[] = 'chrome';
            logger()->info('Using browser cookies for extraction fallback', ['browser' => 'chrome']);
        }
        
        // Add additional options to handle bot detection
        $command[] = '--user-agent';
        $command[] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        $command[] = '--sleep-interval';
        $command[] = '1';
        $command[] = '--max-sleep-interval';
        $command[] = '5';
        $command[] = '--extractor-retries';
        $command[] = '5';
        $command[] = '--fragment-retries';
        $command[] = '10';
        $command[] = '--retry-sleep';
        $command[] = 'linear=1:5:10';
        $command[] = '--no-check-certificate';
        $command[] = '--prefer-free-formats';
        
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