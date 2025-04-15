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
        $outputPath = storage_path("app/tmp/{$videoId}.mp3");

        if (!is_dir(storage_path('app/tmp'))) {
            mkdir(storage_path('app/tmp'), 0775, true);
        }

        $ytdlp = config('app.ytdlp_path');
        $ffmpeg = config('app.ffmpeg_bin');

        $command = [
            $ytdlp,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--ffmpeg-location', $ffmpeg,
            '-o', $outputPath,
            $youtubeUrl,
        ];

        $process = new Process($command);

        try {
            $process->mustRun();

            if (file_exists($outputPath)) {
                return new UploadedFile(
                    $outputPath,
                    "{$videoId}.mp3",
                    'audio/mpeg',
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