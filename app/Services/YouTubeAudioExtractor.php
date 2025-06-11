<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class YouTubeAudioExtractor
{
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

        $command = [
            $ytdlp,
            '--extract-audio',
            '--audio-format', 'flac',
            '--no-playlist', // Ensure only single video is processed
            '--ffmpeg-location', $ffmpeg,
            '--postprocessor-args', 'ffmpeg:-ar 16000 -ac 1 -map 0:a -c:a flac',
            '--cookies-from-browser', 'chrome',
            '--cookies', $cookiesPath,
            '-o', $outputPath,
            $youtubeUrl,
        ];

        $process = new Process($command);
        $process->setTimeout(config('app.ytdlp_timeout', 600));
        $process->setIdleTimeout(config('app.ytdlp_idle_timeout', 120));

        dump($process);
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
            logger()->error('YouTube audio extraction failed', [
                'error' => $e->getMessage(),
                'output' => $process->getErrorOutput(),
            ]);
            return null;
        }
    }
}