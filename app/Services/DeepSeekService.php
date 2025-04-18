<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\RequestException;

class DeepSeekService
{
    protected $apiKey;
    protected $apiEndpoint = 'https://api.deepseek.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.deepseek.api_key');
        
        if (empty($this->apiKey)) {
            throw new \RuntimeException('DeepSeek API key is not configured');
        }
    }

    public function createStudyNote(string $transcription, ?string $language = null): array
    {
        if (empty($transcription)) {
            throw new \InvalidArgumentException('Transcription cannot be empty');
        }

        $language = $language ?? 'of the text provided';
        try {
            $prompt = <<<EOT
                You are an AI assistant that converts raw transcription into a well-structured study note using **HTML formatting**. 
                 Dont be shy to use tables, titles, lists etc.

                Writing Style Prompt
                    Focus on clarity: Make your message really easy to understand.
                    It should be a college essay. Make it long and detailed.

                Instructions:
                1. Read and analyze the transcription provided.
                2. Extract key concepts, important points, and examples.
                3. Write a study note in the following **valid JSON** format (parseable by PHP's `json_decode`):

                {
                    "title": "A short, clear title summarizing the main topic.",
                    "content": "Detailed explanation using HTML: include headings, bullet points, bold text, examples, etc.",
                    "summary": "2-3 sentence summary of the key takeaways."
                }

                Requirements:
                - Use HTML formatting for structure and clarity.
                - Return **only** the JSON object, no extra text.
                - Make sure the JSON is valid and can be decoded with PHP’s `json_decode`.

                The note should be in the following language: {$language}
                Transcription:
                {$transcription}
                EOT;


            // dump($prompt);

            $response = Http::timeout(200)->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a study assistant that always responds in valid JSON format.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000
            ]);

            // Get response content and clean it
            $content = $response->json('choices.0.message.content');
            // Remove 'json' prefix and any HTML code block indicators
            $content = preg_replace('/^(json|\`\`\`json|\`\`\`)\s*/i', '', trim($content));
            $content = preg_replace('/\`\`\`\s*$/i', '', trim($content));
            
            $studyNote = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Parsing Error', [
                    'error' => json_last_error_msg(),
                    'response' => $content
                ]);
                throw new \Exception('Invalid JSON response from DeepSeek: ' . json_last_error_msg());
            }


            // Validate study note structure
            if (!isset($studyNote['title']) || !isset($studyNote['content']) || !isset($studyNote['summary'])) {
                throw new \Exception('Incomplete study note structure received from DeepSeek');
            }

            return [
                'original_transcription' => $transcription,
                'study_note' => $studyNote,
            ];

        } catch (RequestException $e) {
            Log::error('HTTP Request Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to connect to DeepSeek API: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Study note generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function generateStudyNote($text)
    {
        $prompt = "Create a comprehensive study note from the following text. Include:
        - Key concepts and definitions
        - Main points and arguments
        - Important examples
        - Summary and conclusions
        
        Text: " . $text;

        // Call DeepSeek API with the prompt
        $response = $this->sendPrompt($prompt);
        
        return $response;
    }

    protected function sendPrompt(string $prompt): string
    {
        if (empty($prompt)) {
            throw new \InvalidArgumentException('Prompt cannot be empty');
        }

        try {
            $response = Http::timeout(30)->withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post($this->apiEndpoint, [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a study assistant that helps create comprehensive study notes.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000
            ]);

            if (!$response->successful()) {
                throw new RequestException($response);
            }

            $content = $response->json('choices.0.message.content');
            
            if (empty($content)) {
                throw new \Exception('Empty response received from DeepSeek API');
            }

            return $content;

        } catch (RequestException $e) {
            Log::error('DeepSeek API Request Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to connect to DeepSeek API: ' . $e->getMessage());
        } catch (\Exception $e) {
            Log::error('Prompt processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
