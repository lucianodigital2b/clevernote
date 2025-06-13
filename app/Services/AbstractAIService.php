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
    protected $defaultLanguage = 'detect';

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

    abstract protected function getSystemPrompt(): string;

    protected function parseResponse($response): array
    {
        $content = $response->json('choices.0.message.content');


        // $data = json_decode(str_replace(["\\n", "\\", "\n", "\r"], '', trim($content, "\"\"\\")), true);
        $data = json_decode($content, true);
        

        // Log::error(print_r($data, true));

        // if (json_last_error() !== JSON_ERROR_NONE) {
        //     Log::error('JSON Parsing Error', [
        //         'service' => static::class,
        //         'error' => json_last_error_msg(),
        //         'response' => $content
        //     ]);
        //     throw new \Exception('Invalid JSON response: ' . json_last_error_msg());
        // }
        

        return $data;
    }


}