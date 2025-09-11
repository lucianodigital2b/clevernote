<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Note;
use App\Services\NoteToPodcastGenerator;

// Find a note to test with
$note = Note::first();

if (!$note) {
    echo "No notes found in database\n";
    exit(1);
}

echo "Testing podcast generation for note {$note->id}: {$note->title}\n";

// Reset the note's podcast status
$note->update([
    'podcast_status' => null,
    'podcast_file_path' => null,
    'podcast_duration' => null,
    'podcast_file_size' => null,
    'podcast_metadata' => null
]);

// Create the podcast generator
$generator = app(NoteToPodcastGenerator::class);

try {
    $result = $generator->generatePodcast($note, [
        'voice_id' => 'Joanna',
        'language_code' => 'en-US'
    ]);
    
    echo "Podcast generation completed successfully!\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "Podcast generation failed: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}