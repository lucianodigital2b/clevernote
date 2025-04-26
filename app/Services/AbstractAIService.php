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
    protected $defaultLanguage = 'en';

    public function __construct()
    {
        $this->initialize();
    }

    abstract protected function initialize();

    protected function sendRequest(string $prompt, array $additionalParams = []): array
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
                    'max_tokens' => 4000
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

    abstract protected function getSystemPrompt(): string;

    protected function parseResponse($response): array
    {
        $content = $response->json('choices.0.message.content');
        $content = $this->cleanJsonResponse($content);
        
        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('JSON Parsing Error', [
                'service' => static::class,
                'error' => json_last_error_msg(),
                'response' => $content
            ]);
            throw new \Exception('Invalid JSON response: ' . json_last_error_msg());
        }

        return $data;
    }

    protected function cleanJsonResponse(string $content): string
    {
        $content = preg_replace('/^(json|\`\`\`json|\`\`\`)\s*/i', '', trim($content));
        return preg_replace('/\`\`\`\s*$/i', '', trim($content));
    }
}