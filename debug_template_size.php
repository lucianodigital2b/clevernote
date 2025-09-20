<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\DeepSeekService;
use App\Services\Prompts\AIPrompts;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $deepseekService = app(DeepSeekService::class);
    
    // Test with minimal content to see template size
    $minimalContent = "Hello world.";
    echo "Minimal content: '$minimalContent'\n";
    echo "Content length: " . strlen($minimalContent) . " characters\n";
    echo "Content tokens: ~" . ceil(strlen($minimalContent) / 4) . "\n\n";
    
    // Skip system prompt (protected method) - focus on AIPrompts template
    
    // Get the full prompt for study note
    $fullPrompt = AIPrompts::studyNotePrompt($minimalContent, 'en');
    echo "Full prompt length: " . strlen($fullPrompt) . " characters\n";
    echo "Full prompt tokens: ~" . ceil(strlen($fullPrompt) / 4) . "\n\n";
    
    // Calculate template overhead
    $templateOverhead = strlen($fullPrompt) - strlen($minimalContent);
    echo "Template overhead: " . $templateOverhead . " characters\n";
    echo "Template overhead tokens: ~" . ceil($templateOverhead / 4) . "\n\n";
    
    // Show first 500 chars of full prompt
    echo "Full prompt preview:\n";
    echo substr($fullPrompt, 0, 500) . "...\n\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}