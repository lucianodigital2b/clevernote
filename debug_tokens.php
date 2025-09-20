<?php

// Simple debug script for token analysis
$service = new App\Services\DeepSeekService();

// Get system prompt tokens
$systemPrompt = $service->getSystemPrompt();
$systemTokens = $service->estimateTokenCount($systemPrompt);
echo "System prompt tokens: " . $systemTokens . PHP_EOL;

// Get study prompt template tokens  
$studyPrompt = App\Services\Prompts\AIPrompts::studyNotePrompt('autodetect');
$templateTokens = $service->estimateTokenCount($studyPrompt);
echo "Study prompt template tokens: " . $templateTokens . PHP_EOL;

// Test with 12k token chunk
$targetChars = 48000; // 12k tokens * 4 chars/token estimate
$testChunk = substr(str_repeat('This is test content for 12k token chunk analysis. ', 2000), 0, $targetChars);
$chunkTokens = $service->estimateTokenCount($testChunk);
echo "Test chunk tokens: " . $chunkTokens . PHP_EOL;

// Build full prompt like the service does
$chunkInfo = "\n\n[CHUNK 1 OF 3]\n";
$chunkInstructions = "\n\nIMPORTANT: This is chunk 1 of 3. Process this chunk as part of a larger document. Maintain consistency with the overall structure and format requirements.";
$fullChunkContent = $chunkInfo . $testChunk . $chunkInstructions;
$finalPrompt = str_replace('[CONTENT_PLACEHOLDER]', $fullChunkContent, $studyPrompt);

$finalPromptTokens = $service->estimateTokenCount($finalPrompt);
echo "Final prompt tokens: " . $finalPromptTokens . PHP_EOL;

$totalTokens = $systemTokens + $finalPromptTokens;
echo "Total input tokens: " . $totalTokens . PHP_EOL;
echo "Remaining for response: " . (128000 - $totalTokens) . PHP_EOL;

if ($totalTokens > 100000) {
    echo "WARNING: This would likely exceed context limits!" . PHP_EOL;
}