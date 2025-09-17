<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

abstract class AbstractAIService
{
    protected $apiKey;
    protected $apiEndpoint;
    protected $model;
    protected $defaultLanguage = 'autodetect';

    public function __construct()
    {
        $this->initialize();
    }

    abstract protected function initialize();

    protected function sendRequest(string $prompt, array $additionalParams = []): array
    {
        // Check if content needs chunking based on estimated token count
        $estimatedTokens = $this->estimateTokenCount($this->getSystemPrompt() . $prompt);
        
        // GPT-4o has a context limit of ~128k tokens, but we'll be conservative
        // and chunk if we exceed 80k tokens to leave room for response and system prompts
        if ($estimatedTokens > 80000) {
            Log::info("Content exceeds token limit ({$estimatedTokens} tokens), using chunked processing");
            return $this->sendChunkedRequest($prompt, $additionalParams);
        }
        
        return $this->sendSingleRequest($prompt, $additionalParams);
    }
    
    protected function sendSingleRequest(string $prompt, array $additionalParams = []): array
    {
        try {
            $response = Http::timeout(200)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post($this->apiEndpoint, array_merge([
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $this->getSystemPrompt()
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'temperature' => 0.7,
                    'max_tokens' => 8000,
                    'response_format' => [
                        'type' => 'json_object'
                    ]
                ], $additionalParams));

            if (!$response->successful()) {
                throw new RequestException($response);
            }

            return $this->parseResponse($response);

        } catch (RequestException $e) {
            Log::error('AI API Request Failed', [
                'service' => static::class,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception("Failed to connect to AI API: " . $e->getMessage());
        }
    }
    
    protected function sendChunkedRequest(string $prompt, array $additionalParams = []): array
    {
        // Extract the content from the prompt (assuming it's at the end)
        $content = $this->extractContentFromPrompt($prompt);
        $promptTemplate = $this->getPromptTemplate($prompt);
        
        // Split content into chunks
        $chunks = $this->chunkContent($content, 60000); // Increased chunk size to reduce API calls and avoid rate limits
        $results = [];
        
        Log::info("Processing content in " . count($chunks) . " chunks");
        
        foreach ($chunks as $index => $chunk) {
            try {
                $chunkPrompt = $this->buildChunkPrompt($promptTemplate, $chunk, $index + 1, count($chunks));
                $result = $this->sendSingleRequest($chunkPrompt, $additionalParams);
                $results[] = $result;
                
                Log::info("Successfully processed chunk " . ($index + 1) . " of " . count($chunks));
                
                // Add a small delay between requests to avoid rate limiting
                if ($index < count($chunks) - 1) {
                    sleep(1);
                }
                
            } catch (\Exception $e) {
                Log::error("Failed to process chunk " . ($index + 1) . ": " . $e->getMessage());
                throw new \Exception("Failed to process content chunk " . ($index + 1) . ": " . $e->getMessage());
            }
        }
        
        // Combine results from all chunks
        return $this->combineChunkResults($results);
    }
    
    protected function estimateTokenCount(string $text): int
    {
        // Rough estimation: 1 token ≈ 4 characters for English text
        // This is conservative but should work for most cases
        return (int) ceil(strlen($text) / 4);
    }
    
    protected function extractContentFromPrompt(string $prompt): string
    {
        // For study note prompts, the content is typically at the end
        // We'll look for common patterns to extract the actual content
        $lines = explode("\n", $prompt);
        $contentStartIndex = 0;
        
        // Find where the actual content starts (after the prompt instructions)
        for ($i = count($lines) - 1; $i >= 0; $i--) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;
            
            // Look for common prompt ending patterns
            if (strpos($line, 'Content to analyze:') !== false ||
                strpos($line, 'Note content:') !== false ||
                strpos($line, 'Transcription to transform:') !== false ||
                strpos($line, 'EOT;') !== false) {
                $contentStartIndex = $i + 1;
                break;
            }
        }
        
        // If we can't find a clear separator, assume the last 70% is content
        if ($contentStartIndex === 0) {
            $contentStartIndex = (int) (count($lines) * 0.3);
        }
        
        return implode("\n", array_slice($lines, $contentStartIndex));
    }
    
    protected function getPromptTemplate(string $prompt): string
    {
        // Extract the prompt template (everything before the content)
        $content = $this->extractContentFromPrompt($prompt);
        return str_replace($content, '[CONTENT_PLACEHOLDER]', $prompt);
    }
    
    protected function chunkContent(string $content, int $maxTokensPerChunk): array
    {
        $chunks = [];
        $words = explode(' ', $content);
        $currentChunk = '';
        
        foreach ($words as $word) {
            $testChunk = $currentChunk . ' ' . $word;
            
            // Check if adding this word would exceed the token limit
            if ($this->estimateTokenCount($testChunk) > $maxTokensPerChunk && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                $currentChunk = $word;
            } else {
                $currentChunk = $testChunk;
            }
        }
        
        // Add the last chunk if it's not empty
        if (!empty(trim($currentChunk))) {
            $chunks[] = trim($currentChunk);
        }
        
        return $chunks;
    }
    
    protected function buildChunkPrompt(string $template, string $chunk, int $chunkNumber, int $totalChunks): string
    {
        $chunkInfo = "\n\n[CHUNK {$chunkNumber} OF {$totalChunks}]\n";
        $chunkContent = $chunkInfo . $chunk;
        
        // Add instructions for chunked processing
        $chunkInstructions = "\n\nIMPORTANT: This is chunk {$chunkNumber} of {$totalChunks}. Process this chunk as part of a larger document. Maintain consistency with the overall structure and format requirements.";
        
        return str_replace('[CONTENT_PLACEHOLDER]', $chunkContent . $chunkInstructions, $template);
    }
    
    protected function combineChunkResults(array $results): array
    {
        if (empty($results)) {
            throw new \Exception('No results to combine from chunked processing');
        }
        
        // If only one result, return it directly
        if (count($results) === 1) {
            return $results[0];
        }
        
        // Combine results based on the structure
        $combined = $results[0];
        
        // For study notes, combine the content fields
        if (isset($combined['content'])) {
            $combinedContent = '';
            $combinedSummary = '';
            
            foreach ($results as $result) {
                if (isset($result['content'])) {
                    $combinedContent .= $result['content'] . "\n\n";
                }
                if (isset($result['summary'])) {
                    $combinedSummary .= $result['summary'] . ' ';
                }
            }
            
            $combined['content'] = trim($combinedContent);
            if (!empty($combinedSummary)) {
                $combined['summary'] = trim($combinedSummary);
            }
            
            // Use the title from the first chunk or create a combined title
            if (!isset($combined['title']) && isset($results[0]['title'])) {
                $combined['title'] = $results[0]['title'];
            }
        }
        
        Log::info('Successfully combined ' . count($results) . ' chunk results');
        return $combined;
    }

    abstract protected function getSystemPrompt(): string;

    protected function parseResponse($response): array
    {
        $content = $response->json('choices.0.message.content');

        // Log::info('AI API Response Content', [
        //     'service' => static::class,
        //     'content_length' => strlen($content ?? ''),
        //     'content_preview' => substr($content ?? '', 0, 200) . '...',
        //     'raw_content' => $content
        // ]);

        if (empty($content)) {
            Log::error('Empty AI API Response', [
                'service' => static::class,
                'full_response' => $response->json()
            ]);
            throw new \Exception('AI service returned empty response');
        }

        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('JSON Parsing Error', [
                'service' => static::class,
                'error' => json_last_error_msg(),
                'response' => $content
            ]);
            throw new \Exception('Invalid JSON response: ' . json_last_error_msg());
        }

        if ($data === null) {
            Log::error('Null JSON Data', [
                'service' => static::class,
                'content' => $content
            ]);
            throw new \Exception('AI service returned null data');
        }

        Log::info('Successfully parsed AI response', [
            'service' => static::class,
            'data_keys' => array_keys($data)
        ]);

        return $data;
    }


}