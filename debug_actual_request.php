<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\Prompts\AIPrompts;

// Create a small test chunk (3k tokens = ~12k characters)
$testChunk = str_repeat("This is a test sentence. ", 500); // ~12k characters
echo "Test chunk length: " . strlen($testChunk) . " characters\n";
echo "Estimated tokens: " . ceil(strlen($testChunk) / 4) . "\n\n";

// Get the actual prompt that would be sent
$actualPrompt = AIPrompts::studyNotePrompt($testChunk, 'autodetect');

echo "ACTUAL PROMPT ANALYSIS:\n";
echo "Complete prompt length: " . strlen($actualPrompt) . " characters\n";
echo "Estimated tokens: " . ceil(strlen($actualPrompt) / 4) . "\n\n";

if (ceil(strlen($actualPrompt) / 4) > 100000) {
    echo "❌ WARNING: This request would exceed safe limits!\n";
} else {
    echo "✅ This request should be within safe limits.\n";
}

// Show the template structure
echo "\nTEMPLATE STRUCTURE (first 1000 chars):\n";
echo substr($actualPrompt, 0, 1000) . "...\n\n";

// Show where content is inserted
$contentPosition = strpos($actualPrompt, $testChunk);
if ($contentPosition !== false) {
    echo "Content inserted at position: " . $contentPosition . "\n";
    echo "Content section (100 chars before and after):\n";
    $start = max(0, $contentPosition - 100);
    $length = 200 + strlen($testChunk);
    echo substr($actualPrompt, $start, $length) . "\n";
}