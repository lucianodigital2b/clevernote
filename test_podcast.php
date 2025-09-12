<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Note;
use App\Services\NoteToPodcastGenerator;
use App\Contracts\TextToSpeechServiceInterface;

// Available Amazon Polly voices organized by language
$availableVoices = [
    'en-US' => [
        ['id' => 'Joanna', 'name' => 'Joanna', 'gender' => 'Female'],
        ['id' => 'Matthew', 'name' => 'Matthew', 'gender' => 'Male'],
        ['id' => 'Ivy', 'name' => 'Ivy', 'gender' => 'Female'],
        ['id' => 'Justin', 'name' => 'Justin', 'gender' => 'Male'],
        ['id' => 'Kendra', 'name' => 'Kendra', 'gender' => 'Female'],
        ['id' => 'Kimberly', 'name' => 'Kimberly', 'gender' => 'Female'],
        ['id' => 'Salli', 'name' => 'Salli', 'gender' => 'Female'],
        ['id' => 'Joey', 'name' => 'Joey', 'gender' => 'Male'],
    ],
    'en-GB' => [
        ['id' => 'Amy', 'name' => 'Amy', 'gender' => 'Female'],
        ['id' => 'Emma', 'name' => 'Emma', 'gender' => 'Female'],
        ['id' => 'Brian', 'name' => 'Brian', 'gender' => 'Male'],
    ],
    'es-ES' => [
        ['id' => 'Conchita', 'name' => 'Conchita', 'gender' => 'Female'],
        ['id' => 'Enrique', 'name' => 'Enrique', 'gender' => 'Male'],
    ],
    'es-MX' => [
        ['id' => 'Mia', 'name' => 'Mia', 'gender' => 'Female'],
    ],
    'fr-FR' => [
        ['id' => 'Celine', 'name' => 'Celine', 'gender' => 'Female'],
        ['id' => 'Mathieu', 'name' => 'Mathieu', 'gender' => 'Male'],
    ],
    'de-DE' => [
        ['id' => 'Marlene', 'name' => 'Marlene', 'gender' => 'Female'],
        ['id' => 'Hans', 'name' => 'Hans', 'gender' => 'Male'],
    ],
    'it-IT' => [
        ['id' => 'Carla', 'name' => 'Carla', 'gender' => 'Female'],
        ['id' => 'Giorgio', 'name' => 'Giorgio', 'gender' => 'Male'],
    ],
    'pt-BR' => [
        ['id' => 'Vitoria', 'name' => 'Vitoria', 'gender' => 'Female'],
        ['id' => 'Ricardo', 'name' => 'Ricardo', 'gender' => 'Male'],
    ],
    'ja-JP' => [
        ['id' => 'Mizuki', 'name' => 'Mizuki', 'gender' => 'Female'],
        ['id' => 'Takumi', 'name' => 'Takumi', 'gender' => 'Male'],
    ],
];

$languages = [
    ['code' => 'en-US', 'name' => 'English (US)'],
    ['code' => 'en-GB', 'name' => 'English (UK)'],
    ['code' => 'es-ES', 'name' => 'Spanish (Spain)'],
    ['code' => 'es-MX', 'name' => 'Spanish (Mexico)'],
    ['code' => 'fr-FR', 'name' => 'French'],
    ['code' => 'de-DE', 'name' => 'German'],
    ['code' => 'it-IT', 'name' => 'Italian'],
    ['code' => 'pt-BR', 'name' => 'Portuguese (Brazil)'],
    ['code' => 'ja-JP', 'name' => 'Japanese'],
];

function displayLanguages($languages) {
    echo "\nAvailable Languages:\n";
    foreach ($languages as $index => $language) {
        echo ($index + 1) . ". {$language['name']} ({$language['code']})\n";
    }
}

function displayVoices($voices) {
    echo "\nAvailable Voices:\n";
    foreach ($voices as $index => $voice) {
        echo ($index + 1) . ". {$voice['name']} ({$voice['gender']})\n";
    }
}

function getUserInput($prompt) {
    echo $prompt;
    return trim(fgets(STDIN));
}

// Find a note to test with
$note = Note::first();

if (!$note) {
    echo "No notes found in database\n";
    exit(1);
}

echo "Testing podcast generation for note {$note->id}: {$note->title}\n";
echo "Note content preview: " . substr(strip_tags($note->content), 0, 100) . "...\n";

// Display available languages
displayLanguages($languages);

// Get language selection
$languageChoice = getUserInput("\nSelect a language (1-" . count($languages) . "): ");
$languageIndex = (int)$languageChoice - 1;

if ($languageIndex < 0 || $languageIndex >= count($languages)) {
    echo "Invalid language selection. Exiting.\n";
    exit(1);
}

$selectedLanguage = $languages[$languageIndex];
echo "Selected language: {$selectedLanguage['name']}\n";

// Get voices for selected language
$voicesForLanguage = $availableVoices[$selectedLanguage['code']] ?? [];

if (empty($voicesForLanguage)) {
    echo "No voices available for selected language. Exiting.\n";
    exit(1);
}

// Display available voices for selected language
displayVoices($voicesForLanguage);

// Get voice selection
$voiceChoice = getUserInput("\nSelect a voice (1-" . count($voicesForLanguage) . "): ");
$voiceIndex = (int)$voiceChoice - 1;

if ($voiceIndex < 0 || $voiceIndex >= count($voicesForLanguage)) {
    echo "Invalid voice selection. Exiting.\n";
    exit(1);
}

$selectedVoice = $voicesForLanguage[$voiceIndex];
echo "Selected voice: {$selectedVoice['name']} ({$selectedVoice['gender']})\n";

// Confirm selection
echo "\n=== Podcast Configuration ===\n";
echo "Language: {$selectedLanguage['name']} ({$selectedLanguage['code']})\n";
echo "Voice: {$selectedVoice['name']} ({$selectedVoice['gender']})\n";
echo "Note: {$note->title}\n";

$confirm = getUserInput("\nProceed with podcast generation? (y/N): ");
if (strtolower($confirm) !== 'y') {
    echo "Podcast generation cancelled.\n";
    exit(0);
}

// Reset the note's podcast status
$note->update([
    'podcast_status' => null,
    'podcast_file_path' => null,
    'podcast_duration' => null,
    'podcast_file_size' => null,
    'podcast_metadata' => null
]);

echo "\nGenerating podcast...\n";

// Create the podcast generator
$generator = app(NoteToPodcastGenerator::class);

try {
    $result = $generator->generatePodcast($note, [
        'voice_id' => $selectedVoice['id'],
        'language_code' => $selectedLanguage['code']
    ]);
    
    echo "\n=== Podcast Generation Completed Successfully! ===\n";
    echo "Voice Used: {$selectedVoice['name']} ({$selectedVoice['gender']})\n";
    echo "Language: {$selectedLanguage['name']}\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "\n=== Podcast Generation Failed ===\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}