<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$note = App\Models\Note::find(2159);

if ($note) {
    echo "Note ID: " . $note->id . PHP_EOL;
    echo "Podcast Status: " . $note->podcast_status . PHP_EOL;
    echo "Podcast File Path: " . $note->podcast_file_path . PHP_EOL;
    echo "Has Media: " . ($note->getFirstMedia('note-podcasts') ? 'Yes' : 'No') . PHP_EOL;
    
    if ($note->getFirstMedia('note-podcasts')) {
        $media = $note->getFirstMedia('note-podcasts');
        echo "Media ID: " . $media->id . PHP_EOL;
        echo "Media Disk: " . $media->disk . PHP_EOL;
        echo "Media Path: " . $media->getPath() . PHP_EOL;
        echo "Media URL: " . $media->getUrl() . PHP_EOL;
    }
    
    echo "Podcast URL: " . $note->podcast_url . PHP_EOL;
} else {
    echo "Note not found" . PHP_EOL;
}