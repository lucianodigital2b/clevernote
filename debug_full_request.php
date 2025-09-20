<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\DeepSeekService;
use App\Services\Prompts\AIPrompts;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Test with minimal content to see full request size
    $minimalContent = "Hello world.";
    echo "Minimal content: '$minimalContent'\n";
    echo "Content length: " . strlen($minimalContent) . " characters\n";
    echo "Content tokens: ~" . ceil(strlen($minimalContent) / 4) . "\n\n";
    
    // Get the full prompt for study note
    $fullPrompt = AIPrompts::studyNotePrompt($minimalContent, 'en');
    echo "AIPrompts template length: " . strlen($fullPrompt) . " characters\n";
    echo "AIPrompts template tokens: ~" . ceil(strlen($fullPrompt) / 4) . "\n\n";
    
    // Simulate the system prompt (from DeepSeekService)
    $systemPrompt = 'You are an expert educational content creator and study assistant. Your role is to transform raw content into comprehensive, detailed study materials that help students deeply understand complex topics. Always respond in valid JSON format with rich, educational content that demonstrates deep understanding and provides maximum learning value.';
    echo "System prompt length: " . strlen($systemPrompt) . " characters\n";
    echo "System prompt tokens: ~" . ceil(strlen($systemPrompt) / 4) . "\n\n";
    
    // Calculate total request overhead
    $totalOverhead = strlen($systemPrompt) + strlen($fullPrompt) - strlen($minimalContent);
    echo "Total template overhead: " . $totalOverhead . " characters\n";
    echo "Total template overhead tokens: ~" . ceil($totalOverhead / 4) . "\n\n";
    
    // Simulate the complete request structure
    $requestStructure = [
        'model' => 'gpt-4o',
        'messages' => [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ],
            [
                'role' => 'user', 
                'content' => $fullPrompt
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 8000,
        'response_format' => [
            'type' => 'json_object'
        ]
    ];
    
    $requestJson = json_encode($requestStructure, JSON_PRETTY_PRINT);
    echo "Complete request JSON length: " . strlen($requestJson) . " characters\n";
    echo "Complete request JSON tokens: ~" . ceil(strlen($requestJson) / 4) . "\n\n";
    
    echo "Request structure preview (first 800 chars):\n";
    echo substr($requestJson, 0, 800) . "...\n\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}